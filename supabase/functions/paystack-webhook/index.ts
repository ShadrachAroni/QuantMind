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

    switch (event.event) {
      case 'subscription.create': {
        const data = event.data;
        // User metadata was injected during transaction API init
        const supabaseUserId = data.customer?.metadata?.supabase_user_id;

        if (supabaseUserId) {
          await supabase
            .from('subscriptions')
            .upsert({
              user_id: supabaseUserId,
              paystack_customer_code: data.customer.customer_code,
              paystack_subscription_code: data.subscription_code,
              status: 'active',
              current_period_start: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
              current_period_end: data.next_payment_date ? new Date(data.next_payment_date).toISOString() : null
            }, { onConflict: 'user_id' });
        }
        break;
      }

      case 'subscription.disable':
      case 'subscription.not_renew': {
        const data = event.data;
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled', // matching stripe enum or simplified string logic
            cancel_at_period_end: true
          })
          .eq('paystack_subscription_code', data.subscription_code);
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
                amount: data.amount / 100, // Paystack is in kobo/cents usually
                currency: data.currency,
                status: data.status,
                channel: data.channel
             }, { onConflict: 'reference' });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const data = event.data;
        const supabaseUserId = data.customer?.metadata?.supabase_user_id;
        
        if (supabaseUserId) {
            // Re-attempt charge logs tracking
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
             
             // Possibly suspend sub
             if (data.subscription?.subscription_code) {
                  await supabase
                  .from('subscriptions')
                  .update({
                    status: 'past_due'
                  })
                  .eq('paystack_subscription_code', data.subscription.subscription_code);
             }
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
