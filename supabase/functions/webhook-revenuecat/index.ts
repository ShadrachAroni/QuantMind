// QuantMind Edge Function: webhook-revenuecat
// HMAC-SHA256 signature verification + idempotent subscription processing
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const TIER_MAP: Record<string, string> = {
  'quantmind_plus_monthly':   'plus',
  'quantmind_plus_annual':    'plus',
  'quantmind_pro_monthly':    'pro',
  'quantmind_pro_annual':     'pro',
  'quantmind_student_monthly':'student',
  'quantmind_student_annual': 'student',
};

async function verifyHmacSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const sigBytes = hexToBytes(signature);
  const bodyBytes = new TextEncoder().encode(body);
  
  return await crypto.subtle.verify('HMAC', key, sigBytes, bodyBytes);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

serve(async (req: Request) => {
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ 
      status: 'active', 
      message: 'QuantMind RevenueCat Webhook is listening' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const origin = req.headers.get('Origin');

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('X-RevenueCat-Signature') || '';
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');

    if (!webhookSecret) throw new Error('Webhook secret not configured');

    // Verify signature
    const isValid = await verifyHmacSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error('[webhook-revenuecat] Invalid signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const eventId = event?.id;

    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Missing event ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Idempotency: check if already processed
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id, processed')
      .eq('event_id', eventId)
      .single();

    if (existing?.processed) {
      return new Response(JSON.stringify({ status: 'already_processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store the event
    const { error: insertError } = await supabase
      .from('webhook_events')
      .upsert({
        provider: 'revenuecat',
        event_id: eventId,
        event_type: event.type,
        payload,
      });

    if (insertError) throw new Error('Failed to store webhook event');

    // Process the event
    const eventType = event.type;
    const appUserId = event.app_user_id;

    if (!appUserId) {
      console.error('[webhook-revenuecat] Missing app_user_id');
      return new Response(JSON.stringify({ status: 'ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let newTier = 'free';
    let status = 'active';
    const productId = event.product_id || '';

    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'REACTIVATION':
      case 'UNCANCELLATION':
        newTier = TIER_MAP[productId] || 'free';
        status = 'active';
        break;
      case 'CANCELLATION':
        status = 'canceled';
        // Keep tier until period end
        break;
      case 'EXPIRATION':
        newTier = 'free';
        status = 'active';
        break;
      case 'BILLING_ISSUE':
        status = 'past_due';
        break;
      default:
        // Ignore unhandled events
        await supabase
          .from('webhook_events')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('event_id', eventId);
        return new Response(JSON.stringify({ status: 'ignored' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    // Update subscription and user profile
    const expirationAt = event.expiration_at_ms 
      ? new Date(event.expiration_at_ms).toISOString() 
      : null;

    await supabase.from('subscriptions').upsert({
      user_id: appUserId,
      tier: newTier,
      status,
      revenuecat_id: appUserId,
      current_period_end: expirationAt,
      cancel_at_period_end: eventType === 'CANCELLATION',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // Update profile tier to match subscription
    if (newTier !== 'free' && eventType !== 'CANCELLATION') {
      await supabase
        .from('user_profiles')
        .update({ tier: newTier })
        .eq('id', appUserId);
    } else if (eventType === 'EXPIRATION') {
      await supabase
        .from('user_profiles')
        .update({ tier: 'free' })
        .eq('id', appUserId);
    }

    // Mark as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('event_id', eventId);

    // Send Confirmation Email for purchases/renewals/activations
    if (['INITIAL_PURCHASE', 'RENEWAL', 'REACTIVATION', 'UNCANCELLATION'].includes(eventType)) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(appUserId);
        if (userData?.user?.email) {
          // Call the CENTRALIZED send-email service
          const sendEmailUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`;
          const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

          let type = 'subscription_update';
          let details: any = { tier: newTier, userId: appUserId };

          if (eventType === 'INITIAL_PURCHASE') {
            type = 'welcome';
          } else {
            const amount = event.price_in_purchased_currency 
              ? `${event.currency} ${event.price_in_purchased_currency.toFixed(2)}` 
              : (newTier === 'pro' ? 'USD 49.99' : 'USD 19.99');
              
            const nextBilling = expirationAt 
              ? new Date(expirationAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A';

            details = {
              tier: newTier,
              status: 'PROVISIONED',
              amount: amount,
              nextBilling: nextBilling,
              userId: appUserId
            };
          }

          const emailRes = await fetch(sendEmailUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              to: userData.user.email,
              type,
              tier: newTier,
              userId: appUserId,
              details
            })
          });

          if (!emailRes.ok) {
            console.error('[webhook-revenuecat] Mailer service error:', await emailRes.text());
          }
        }
      } catch (emailErr) {
        console.error('[webhook-revenuecat] Email notification failed:', emailErr);
      }
    }

    return new Response(JSON.stringify({ status: 'processed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[webhook-revenuecat] Error:', message);
    return new Response(JSON.stringify({ error: 'Processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
