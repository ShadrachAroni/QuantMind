import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Auth Header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Not logged in or invalid token');

    // 1. Fetch subscription details from DB
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('paystack_subscription_code')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription || !subscription.paystack_subscription_code) {
      throw new Error('No active Paystack subscription found for user');
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    
    // 2. Fetch subscription details from Paystack to get the email token
    const fetchResponse = await fetch(`https://api.paystack.co/subscription/${subscription.paystack_subscription_code}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const subData = await fetchResponse.json();
    if (!subData.status) throw new Error(subData.message);

    const emailToken = subData.data.email_token;
    if (!emailToken) throw new Error('Subscription token not found');

    // 3. Disable subscription on Paystack
    const cancelResponse = await fetch('https://api.paystack.co/subscription/disable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: subscription.paystack_subscription_code,
        token: emailToken
      })
    });

    const cancelData = await cancelResponse.json();
    if (!cancelData.status) throw new Error(cancelData.message);

    // 4. Update the subscriptions table in Supabase
    const { error: updateError } = await supabaseClient
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        tier: 'free',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // 5. Update the user_profiles table to revert to free tier
    const { error: profileError } = await supabaseClient
      .from('user_profiles')
      .update({ 
        tier: 'free',
        subscription_status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    return new Response(JSON.stringify({ message: 'Subscription decommissioned successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
