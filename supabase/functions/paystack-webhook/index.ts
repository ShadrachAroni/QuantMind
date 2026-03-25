import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', 
    enc.encode(secret), 
    { name: 'HMAC', hash: 'SHA-512' }, 
    false, 
    ['sign', 'verify']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC', 
    key, 
    enc.encode(payload)
  );
  
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hex === signature;
}

serve(async (req: Request) => {
  try {
    const signature = req.headers.get('x-paystack-signature');
    const secret = Deno.env.get('PAYSTACK_SECRET_KEY');

    if (!signature || !secret) {
      return new Response('Missing signature or secret', { status: 400 });
    }

    const payloadText = await req.text();
    const isValid = await verifySignature(payloadText, signature, secret);

    if (!isValid) {
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(payloadText);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const getTierFromPlan = (planCode: string): string => {
      if (planCode === Deno.env.get('PAYSTACK_PLAN_PRO') || planCode === 'PLN_pro_456') return 'pro';
      if (planCode === Deno.env.get('PAYSTACK_PLAN_PLUS') || planCode === 'PLN_plus_123') return 'plus';
      if (planCode === Deno.env.get('PAYSTACK_PLAN_STUDENT') || planCode === 'PLN_student_789') return 'student';
      return 'free';
    };

    switch (event.event) {
      case 'subscription.create': {
        const data = event.data;
        const supabaseUserId = data.customer?.metadata?.supabase_user_id;
        const tier = getTierFromPlan(data.plan.plan_code);

        if (supabaseUserId) {
          // 1. Update Subscriptions table
          await supabase
            .from('subscriptions')
            .upsert({
              user_id: supabaseUserId,
              paystack_customer_code: data.customer.customer_code,
              paystack_subscription_code: data.subscription_code,
              status: 'active',
              tier: tier,
              current_period_start: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
              current_period_end: data.next_payment_date ? new Date(data.next_payment_date).toISOString() : null
            }, { onConflict: 'user_id' });
          
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('has_used_trial')
            .eq('id', supabaseUserId)
            .single();

          // 2. Sync to User Profiles (Crucial for Gating)
          await supabase
            .from('user_profiles')
            .update({ 
              tier: tier,
              subscription_status: 'active',
              has_used_trial: data.customer?.metadata?.is_trial === true || profile?.has_used_trial
            })
            .eq('id', supabaseUserId);
            
          console.log(`[SUBSCRIPTION_CREATE] User ${supabaseUserId} upgraded to ${tier}${data.customer?.metadata?.is_trial ? ' (TRIAL)' : ''}`);
        }
        break;
      }

      case 'subscription.disable':
      case 'subscription.not_renew': {
        const data = event.data;
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('paystack_subscription_code', data.subscription_code)
          .single();

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: true
          })
          .eq('paystack_subscription_code', data.subscription_code);

        if (sub?.user_id) {
          await supabase
            .from('user_profiles')
            .update({ 
              tier: 'free',
              subscription_status: 'cancelled' 
            })
            .eq('id', sub.user_id);
            
          console.log(`[SUBSCRIPTION_DISABLE] User ${sub.user_id} subscription cancelled`);
        }
        break;
      }
      
      case 'charge.success': {
        const data = event.data;
        const supabaseUserId = data.metadata?.supabase_user_id || data.customer?.metadata?.supabase_user_id;
        
        if (supabaseUserId) {
            await supabase
             .from('paystack_transactions')
             .upsert({
                reference: data.reference,
                user_id: supabaseUserId,
                amount: data.amount / 100,
                currency: data.currency,
                status: data.status,
                channel: data.channel
             }, { onConflict: 'reference' });

            // If this is a subscription payment, ensure user_profiles is active
            if (data.plan) {
               await supabase
                .from('user_profiles')
                .update({ subscription_status: 'active' })
                .eq('id', supabaseUserId);
            }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const data = event.data;
        const supabaseUserId = data.customer?.metadata?.supabase_user_id;
        
        if (supabaseUserId) {
            await supabase
             .from('paystack_transactions')
             .upsert({
                reference: data.transaction?.reference || `inv_${data.id}`,
                user_id: supabaseUserId,
                amount: data.amount / 100,
                currency: data.currency,
                status: 'failed',
                channel: 'system_retry'
             }, { onConflict: 'reference' });
             
             if (data.subscription?.subscription_code) {
                const { data: sub } = await supabase
                  .from('subscriptions')
                  .select('id, user_id')
                  .eq('paystack_subscription_code', data.subscription.subscription_code)
                  .single();

                if (sub) {
                  await supabase
                    .from('subscriptions')
                    .update({ status: 'expired', tier: 'free' })
                    .eq('id', sub.id);
                  
                  await supabase
                    .from('user_profiles')
                    .update({ subscription_status: 'expired', tier: 'free' })
                    .eq('id', sub.user_id);

                  console.log(`[Webhook] User ${sub.user_id} downgraded to free tier due to payment failure.`);
                }
             }
             
             console.error(`[PAYMENT_FAILED] User ${supabaseUserId} payment failed for ${data.amount}`);
        }
        break;
      }

      case 'charge.refunded': {
        const data = event.data;
        const supabaseUserId = data.metadata?.supabase_user_id || data.customer?.metadata?.supabase_user_id;

        if (supabaseUserId) {
          await supabase
            .from('user_profiles')
            .update({
              tier: 'free',
              subscription_status: 'canceled'
            })
            .eq('id', supabaseUserId);
          
          await supabase
            .from('subscriptions')
            .update({
              tier: 'free',
              status: 'canceled'
            })
            .eq('user_id', supabaseUserId);
            
          console.log(`[CHARGE_REFUNDED] User ${supabaseUserId} reverted to free tier`);
        }
        break;
      }
      }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
});
