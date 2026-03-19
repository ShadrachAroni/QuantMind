// QuantMind Edge Function: simulate-status
// Poll simulation job status and return full result when complete
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const user = await requireAuth(req);

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return new Response(JSON.stringify({ error: 'Valid simulation id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: simulation, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !simulation) {
      return new Response(JSON.stringify({ error: 'Simulation not found or access denied.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    return new Response(JSON.stringify({
      id: simulation.id,
      status: simulation.status,
      result: simulation.result,
      params: simulation.params,
      error_message: simulation.error_message,
      is_cached: simulation.is_cached,
      cached_from: simulation.cached_from,
      duration_ms: simulation.duration_ms,
      created_at: simulation.created_at,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Unauthorized') || message.includes('Missing')) {
      return new Response(JSON.stringify({ error: 'Your session has expired. Please sign in again.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
});
