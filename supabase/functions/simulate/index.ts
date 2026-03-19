// QuantMind Edge Function: simulate
// Validates SimulationRequest, checks tier entitlement, enqueues to Upstash Redis
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { rateLimit, rateLimitResponse } from '../_shared/rateLimiter.ts';

const TIER_LIMITS: Record<string, { maxPaths: number; rateLimit: number }> = {
  free:    { maxPaths: 2000,   rateLimit: 5  },
  plus:    { maxPaths: 10000,  rateLimit: 20 },
  pro:     { maxPaths: 100000, rateLimit: 60 },
  student: { maxPaths: 10000,  rateLimit: 20 },
};

interface SimulationRequest {
  portfolio_id: string;
  num_paths: number;
  time_horizon_years: number;
  initial_value: number;
  risk_free_rate?: number;
  model_type?: 'gbm' | 'jump_diffusion' | 'fat_tails' | 'regime_switching';
  seed?: number;
}

function validateRequest(body: any): SimulationRequest {
  if (!body.portfolio_id || typeof body.portfolio_id !== 'string') {
    throw new Error('portfolio_id is required');
  }
  if (!body.num_paths || typeof body.num_paths !== 'number' || 
      body.num_paths < 100 || body.num_paths > 100000) {
    throw new Error('num_paths must be between 100 and 100,000');
  }
  if (!body.time_horizon_years || body.time_horizon_years < 0.25 || body.time_horizon_years > 30) {
    throw new Error('time_horizon_years must be between 0.25 and 30');
  }
  if (!body.initial_value || body.initial_value <= 0) {
    throw new Error('initial_value must be positive');
  }
  
  const allowed_models = ['gbm', 'jump_diffusion', 'fat_tails', 'regime_switching'];
  if (body.model_type && !allowed_models.includes(body.model_type)) {
    throw new Error(`model_type must be one of: ${allowed_models.join(', ')}`);
  }

  return {
    portfolio_id: body.portfolio_id,
    num_paths: body.num_paths,
    time_horizon_years: body.time_horizon_years,
    initial_value: body.initial_value,
    risk_free_rate: body.risk_free_rate,
    model_type: body.model_type || 'gbm',
    seed: body.seed,
  };
}

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const user = await requireAuth(req);
    const tierConfig = TIER_LIMITS[user.tier] || TIER_LIMITS.free;

    // Rate limit by tier
    const limit = await rateLimit(`simulate:${user.id}`, tierConfig.rateLimit, 3600);
    if (!limit.allowed) return rateLimitResponse(limit);

    const body = await req.json();
    const simReq = validateRequest(body);

    // Enforce tier path limit
    if (simReq.num_paths > tierConfig.maxPaths) {
      return new Response(JSON.stringify({ 
        error: `Your ${user.tier} plan allows up to ${tierConfig.maxPaths.toLocaleString()} simulation paths. Upgrade for more.`,
        maxPaths: tierConfig.maxPaths,
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Check advanced model access (free/student cannot use advanced models)
    const advancedModels = ['jump_diffusion', 'fat_tails', 'regime_switching'];
    if (advancedModels.includes(simReq.model_type || '') && 
        !['pro'].includes(user.tier)) {
      return new Response(JSON.stringify({
        error: 'Advanced simulation models (Jump Diffusion, Fat Tails, Regime Switching) require a Pro subscription.',
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Verify portfolio belongs to user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: portfolio, error: pfError } = await supabase
      .from('portfolios')
      .select('id, assets, name')
      .eq('id', simReq.portfolio_id)
      .eq('user_id', user.id)
      .single();

    if (pfError || !portfolio) {
      return new Response(JSON.stringify({ error: 'Portfolio not found or access denied.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    if (!portfolio.assets || portfolio.assets.length === 0) {
      return new Response(JSON.stringify({ error: 'Portfolio has no assets. Add assets before running a simulation.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Generate a unique seed if not provided (for reproducibility)
    const seed = simReq.seed ?? Math.floor(Math.random() * 2_147_483_647);

    // Create simulation record
    const paramsHash = btoa(JSON.stringify({ ...simReq, seed })).slice(0, 64);
    
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .insert({
        user_id: user.id,
        portfolio_id: simReq.portfolio_id,
        params: { ...simReq, seed },
        params_hash: paramsHash,
        status: 'pending',
        num_paths: simReq.num_paths,
        time_horizon_years: simReq.time_horizon_years,
        seed,
      })
      .select()
      .single();

    if (simError || !simulation) {
      throw new Error('Failed to create simulation record');
    }

    // Enqueue to Upstash for FastAPI worker
    // In production this would use actual Redis queue
    // For now, we'll process inline with the FastAPI service URL
    const simulationServiceUrl = Deno.env.get('SIMULATION_SERVICE_URL');
    if (simulationServiceUrl) {
      // Async: fire and forget to simulation service
      fetch(`${simulationServiceUrl}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Simulation-Secret': Deno.env.get('SIMULATION_SECRET_KEY') || '',
        },
        body: JSON.stringify({
          simulation_id: simulation.id,
          user_id: user.id,
          portfolio_id: simReq.portfolio_id,
          assets: portfolio.assets,
          params: { ...simReq, seed },
        }),
      }).catch(err => console.error('Failed to enqueue simulation:', err));
    }

    return new Response(JSON.stringify({
      jobId: simulation.id,
      status: 'pending',
      estimatedMs: simReq.num_paths < 1000 ? 800 : simReq.num_paths < 5000 ? 3000 : 10000,
      seed,
    }), {
      status: 202,
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
    // Validation errors
    if (message.includes('required') || message.includes('must be')) {
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
    console.error('[simulate] Error:', message);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
});
