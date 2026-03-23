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

    const body = await req.json();
    const { planCode } = body;

    if (!planCode) throw new Error('Missing planCode');

    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) throw new Error('Server configuration error: missing Paystack API key');

    // Call Paystack Initialize Transaction API
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: 100, // Initial temp amount, Paystack uses the plan amount if a plan is provided
        plan: planCode,
        channels: ['card', 'mobile_money', 'apple_pay', 'bank_transfer'],
        // Assuming dashboard routes locally to 3000
        callback_url: `${req.headers.get('origin') || Deno.env.get('SITE_URL') || 'http://localhost:3000'}/settings/billing?success=true`,
        metadata: {
           supabase_user_id: user.id
        }
      }),
    });

    const data = await response.json();
    if (!data.status) throw new Error(data.message);

    return new Response(JSON.stringify({ url: data.data.authorization_url }), {
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
