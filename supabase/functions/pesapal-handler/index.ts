import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PESAPAL_API_URL = 'https://pay.pesapal.com/v3';
const CONSUMER_KEY = Deno.env.get('PESAPAL_CONSUMER_KEY');
const CONSUMER_SECRET = Deno.env.get('PESAPAL_CONSUMER_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAuthToken() {
  const res = await fetch(`${PESAPAL_API_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('PESAPAL_AUTH_FAILED: ' + JSON.stringify(data));
  return data.token;
}

async function registerIPN(token: string, webhookUrl: string) {
  const res = await fetch(`${PESAPAL_API_URL}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: webhookUrl,
      ipn_notification_type: 'GET',
    }),
  });
  const data = await res.json();
  if (!data.ipn_id) throw new Error('PESAPAL_IPN_REGISTRATION_FAILED: ' + JSON.stringify(data));
  return data.ipn_id;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // 1. Initiate Payment Flow
    if (path === 'initiate-payment') {
      const { planId, amount, billingAddress, userId } = await req.json();
      const token = await getAuthToken();
      
      // Use the function's own URL for webhooks
      // Correct Supabase Functions path: /functions/v1/function-name/path
      const webhookUrl = `${url.origin}/functions/v1/pesapal-handler/webhook`;
      const ipnId = await registerIPN(token, webhookUrl);

      const merchantReference = `QM_${Date.now()}_${userId.substring(0, 8)}`;

      const paymentDetails = {
        id: merchantReference,
        currency: 'KES',
        amount: Number(amount).toFixed(2),
        description: `QuantMind ${planId.toUpperCase()} Subscription`,
        callback_url: `quantmind://payment-callback`, // Mobile Deep Link
        notification_id: ipnId,
        billing_address: {
          email_address: billingAddress.email,
          phone_number: billingAddress.phone,
          first_name: billingAddress.firstName,
          last_name: billingAddress.lastName,
          line_1: billingAddress.street,
          city: billingAddress.city,
          country_code: 'KE',
        },
      };

      const submitRes = await fetch(`${PESAPAL_API_URL}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentDetails),
      });

      const orderData = await submitRes.json();
      if (orderData.status !== '200') throw new Error('PESAPAL_ORDER_FAILED: ' + orderData.message);

      // Save pending transaction
      await supabase.from('subscription_payments').insert({
        user_id: userId,
        amount: amount,
        status: 'PENDING',
        pesapal_order_tracking_id: orderData.order_tracking_id,
        pesapal_merchant_reference: merchantReference,
        billing_address: billingAddress
      });

      return new Response(JSON.stringify(orderData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Webhook / IPN Handler
    if (path === 'webhook') {
      const OrderTrackingId = url.searchParams.get('OrderTrackingId');
      const OrderMerchantReference = url.searchParams.get('OrderMerchantReference');

      if (!OrderTrackingId) return new Response('Missing ID', { status: 400 });

      const token = await getAuthToken();
      const statusRes = await fetch(
        `${PESAPAL_API_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const statusData = await statusRes.json();
      const paymentStatus = statusData.payment_status_description; // "Completed", "Failed", etc.

      if (paymentStatus === 'Completed') {
        // Find the payment record to get user_id and plan
        const { data: payment } = await supabase
          .from('subscription_payments')
          .select('user_id, amount')
          .eq('pesapal_order_tracking_id', OrderTrackingId)
          .single();

        if (payment) {
          // Update Payment status
          await supabase
            .from('subscription_payments')
            .update({ status: 'COMPLETED', payment_method: statusData.payment_method })
            .eq('pesapal_order_tracking_id', OrderTrackingId);

          // Determine Tier (Simplified logic: match price)
          let tier = 'free';
          if (payment.amount >= 20000) tier = 'institution'; // ~199 USD
          else if (payment.amount >= 5000) tier = 'pro';      // ~49 USD
          else if (payment.amount >= 2000) tier = 'basic';    // ~19 USD

          // Update User Profile
          await supabase
            .from('user_profiles')
            .update({ 
              tier: tier,
              subscription_status: 'active',
              next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('id', payment.user_id);
        }
      } else if (paymentStatus === 'Failed') {
        await supabase
          .from('subscription_payments')
          .update({ status: 'FAILED' })
          .eq('pesapal_order_tracking_id', OrderTrackingId);
      }

      return new Response(JSON.stringify({ status: paymentStatus }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });

  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
