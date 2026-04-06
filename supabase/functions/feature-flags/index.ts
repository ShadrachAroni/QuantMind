// QuantMind Edge Function: feature-flags
// Evaluates active flags for a user based on tier and metadata
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
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: flags } = await supabase
      .from('feature_flags')
      .select('key, enabled, rollout_percent')
      .eq('enabled', true);

    // Simple evaluation logic
    const activeFlags = (flags || []).filter(f => {
      // Deterministic rollout check
      if (f.rollout_percent === 100) return true;
      if (f.rollout_percent === 0) return false;
      
      // Simple hash-based rollout
      const hash = [...user.id.replace(/-/g, '')].reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return (hash % 100) < f.rollout_percent;
    }).map(f => f.key);

    return new Response(JSON.stringify({ flags: activeFlags }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
});
