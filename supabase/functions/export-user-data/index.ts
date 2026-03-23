import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireAuth, unauthorizedResponse } from '../_shared/auth.ts';

serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const user = await requireAuth(req);
    const origin = req.headers.get('Origin');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch all user data
    const [
      { data: profile },
      { data: portfolios },
      { data: simulations },
      { data: supportTickets },
      { data: subscriptions }
    ] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('*').eq('id', user.id).single(),
      supabaseAdmin.from('portfolios').select('*').eq('user_id', user.id),
      supabaseAdmin.from('simulations').select('*').eq('user_id', user.id),
      supabaseAdmin.from('support_tickets').select('*').eq('user_id', user.id),
      supabaseAdmin.from('subscriptions').select('*').eq('user_id', user.id).single()
    ]);

    const archive = {
      metadata: {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        version: '1.0.4'
      },
      data: {
        profile,
        subscriptions,
        portfolios,
        simulations,
        support_tickets: supportTickets
      }
    };

    // In a real production system, we would upload this to a private bucket 
    // and send a signed link via email. 
    // For this implementation, we return it directly to the dashboard/app.
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'DATA_ARCHIVE_GENERATED',
      archive 
    }), {
      status: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.message.includes('Unauthorized') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
