// QuantMind Edge Function: simulate
// Validates SimulationRequest, checks tier entitlement, enqueues to Upstash Redis
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { rateLimit, rateLimitResponse, rateLimitByIP, checkGlobalPanicMode } from '../_shared/rateLimiter.ts';

// Web Crypto HMAC Generator for Deno
async function generateHmac(secret: string, bodyString: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(bodyString));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

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
  // PRO Parameters
  simulation_type?: 'monte_carlo' | 'mirofish';
  jump_lambda?: number; // Jumps per year
  jump_size?: number;   // Mean jump size (log)
  jump_vol?: number;    // Jump volatility
  stress_test?: { symbol: string; shock_pct: number }[];
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
    simulation_type: body.simulation_type || 'monte_carlo',
    jump_lambda: body.jump_lambda ?? 0.05,
    jump_size: body.jump_size ?? -0.15,
    jump_vol: body.jump_vol ?? 0.1,
    stress_test: body.stress_test || [],
  };
}

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  // 1. DDoS Prevention: Global Panic Switch
  if (await checkGlobalPanicMode()) {
    return new Response(JSON.stringify({ error: 'System is currently undergoing maintenance or high-security lockdown.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  // 2. DDoS Prevention: IP Rate Limiting (50 req/min/IP for simulations)
  const ipLimit = await rateLimitByIP(req, 50, 60);
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit);

  try {
    const user = await requireAuth(req);
    const tierConfig = TIER_LIMITS[user.tier] || TIER_LIMITS.free;

    // Rate limit by tier
    const limit = await rateLimit(`simulate:${user.id}`, tierConfig.rateLimit, 3600);
    if (!limit.allowed) return rateLimitResponse(limit);

    const body = await req.json();
    
    // --- SPECIAL CASE: MiroFish Swarm Intelligence ---
    if (body.simulation_type === 'mirofish') {
      const hfUrl = Deno.env.get('SIMULATION_SERVICE_URL');
      const hmacSecret = Deno.env.get('HMAC_SECRET_KEY') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || '';
      
      const payload = {
        simulation_id: `miro_${Date.now()}`,
        user_id: user.id,
        seed_context: body.seed,
        steps: 24
      };
      const bodyString = JSON.stringify(payload);
      const hmacSignature = await generateHmac(hmacSecret, bodyString);

      const res = await fetch(`${hfUrl}/simulate/mirofish`, {
        method: 'POST',
        body: bodyString,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'X-HMAC-Signature': hmacSignature
        },
      });
      
      if (!res.ok) throw new Error(`MiroFish Engine Rejected: ${await res.text()}`);
      
      return new Response(await res.text(), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[simulate] CRITICAL: SUPABASE_URL or SERVICE_ROLE_KEY is not set.');
      console.log('[simulate] Available env keys:', Object.keys(Deno.env.toObject()));
      throw new Error('Internal Configuration Error: Database connection details missing.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      console.error('[simulate] Database Error creating simulation record:', simError);
      throw new Error(`Failed to create simulation record: ${simError?.message || 'Unknown DB error'}`);
    }

    // 4. Update status to 'running'
    await supabase
      .from('simulations')
      .update({ status: 'running' })
      .eq('id', simulation.id);

    // --- Primary Simulation Engine: Hugging Face Handover ---
    try {
      const hfUrl = Deno.env.get('SIMULATION_SERVICE_URL');
      const hmacSecret = Deno.env.get('HMAC_SECRET_KEY') || '';
      // We already fetched supabaseServiceKey earlier, so we can reuse it
      const sRoleKey = supabaseServiceKey;

      if (hfUrl && hfUrl.startsWith('http')) {
        console.log(`[simulate] Handover Init: ${hfUrl}/simulate`);
        
        // 1. Calibrate / Fetch historical metrics for assets if needed
        // For now, we'll pass the assets directly (assuming the engine has its own telemetry if needed)
        const hfPayload = { 
          simulation_id: simulation.id, 
          user_id: user.id, 
          portfolio_id: simReq.portfolio_id, 
          assets: portfolio.assets, 
          params: { ...simReq, seed } 
        };
        const bodyString = JSON.stringify(hfPayload);
        const hmacSignature = await generateHmac(hmacSecret, bodyString);
        
        const res = await fetch(`${hfUrl}/simulate`, {
          method: 'POST',
          body: bodyString,
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${sRoleKey}`,
            'X-HMAC-Signature': hmacSignature
          },
        });

        if (res.ok) {
          console.log(`[simulate] Handover Success: ${simulation.id}`);
          return new Response(JSON.stringify({ 
            jobId: simulation.id, 
            status: 'pending', 
            provider: 'huggingface', 
            seed 
          }), {
            headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
          });
        }
        console.warn(`[simulate] Handover Rejected (${res.status}): ${await res.text()}`);
      }
    } catch (e) {
      console.error(`[simulate] Handover Failure: ${(e as Error).message}`);
    }

    // --- Fallback Simulation Engine (GBM) ---
    console.log(`[simulate] Starting fallback modeling for job ${simulation.id}...`);
    
    try {
      console.log(`[simulate] Falling back to standalone GBM engine for ${simulation.id}...`);

      // 3. Standalone Fallback: Fetch parameters for each asset (with retries)
      const assetParams: { mu: number; sigma: number; weight: number }[] = [];
      const functionUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/assets-history';
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      for (const asset of portfolio.assets) {
        let success = false;
        let attempts = 0;
        const maxAttempts = 2;

        while (!success && attempts < maxAttempts) {
          try {
            attempts++;
            const res = await fetch(`${functionUrl}?symbol=${asset.ticker}`, {
              headers: { 'Authorization': `Bearer ${serviceKey}` }
            });
            
            if (res.ok) {
              const data = await res.json();
              if (data.expected_return !== undefined && data.volatility !== undefined) {
                assetParams.push({
                  mu: data.expected_return,
                  sigma: data.volatility,
                  weight: asset.weight || (1 / portfolio.assets.length)
                });
                success = true;
                console.log(`[simulate] Telemetry Success for ${asset.ticker} (attempt ${attempts})`);
              }
            } else {
              console.warn(`[simulate] Telemetry ${res.status} for ${asset.ticker} (attempt ${attempts})`);
            }
          } catch (e) {
            console.warn(`[simulate] Telemetry Error for ${asset.ticker} (attempt ${attempts}):`, e);
          }
          
          if (!success && attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 500)); // Short backoff
          }
        }

        if (!success) {
          console.warn(`[simulate] All telemetry attempts failed for ${asset.ticker}, using defaults.`);
          assetParams.push({
            mu: 0.07,
            sigma: 0.15,
            weight: asset.weight || (1 / portfolio.assets.length)
          });
        }
      }

      // 3. Aggregate Portfolio Parameters
      // Simple weighted average for mu and sigma (ignoring correlation for standalone GBM)
      const portfolioMu = assetParams.reduce((sum, a) => sum + (a.mu * a.weight), 0);
      const portfolioSigma = assetParams.reduce((sum, a) => sum + (a.sigma * a.weight), 0);

      // 4. Run Monte Carlo Simulation
      const iterations = simReq.num_paths;
      const days = Math.round(simReq.time_horizon_years * 252);
      const dt = 1 / 252;
      const initialValue = simReq.initial_value;
      
      const dailyDrift = (portfolioMu - 0.5 * Math.pow(portfolioSigma, 2)) * dt;
      const dailyVol = portfolioSigma * Math.sqrt(dt);
      
      const allPaths: number[][] = [];
      const pathsToStore = 20; 
      
      let currentSeed = seed;
      const pseudoRandom = () => {
        const x = Math.sin(currentSeed++) * 10000;
        return x - Math.floor(x);
      };

      for (let i = 0; i < iterations; i++) {
        const path = [initialValue];
        let current = initialValue;
        
        // Apply Stress Test Deterministic Shock at t=1
        if (simReq.stress_test && simReq.stress_test.length > 0) {
          let totalShock = 0;
          simReq.stress_test.forEach((s: any) => {
            const asset = portfolio.assets.find((a: any) => a.ticker === s.symbol);
            if (asset) {
              totalShock += (asset.weight || (1/portfolio.assets.length)) * s.shock_pct;
            }
          });
          current = current * (1 + totalShock);
          if (i < pathsToStore) path.push(current);
        }

        const jump_lambda = simReq.model_type === 'jump_diffusion' ? (simReq.jump_lambda || 0.05) : 0;
        const jump_mu = simReq.jump_size || -0.15;
        const jump_sigma = simReq.jump_vol || 0.1;
        const k = Math.exp(jump_mu + 0.5 * Math.pow(jump_sigma, 2)) - 1;
        const adjustedDrift = (portfolioMu - 0.5 * Math.pow(portfolioSigma, 2) - jump_lambda * k) * dt;

        for (let t = (simReq.stress_test?.length ? 2 : 1); t < days; t++) {
          const u1 = pseudoRandom();
          const u2 = pseudoRandom();
          const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          
          let jumpEffect = 1;
          if (jump_lambda > 0 && pseudoRandom() < jump_lambda * dt) {
            const uj1 = pseudoRandom();
            const uj2 = pseudoRandom();
            const zj = Math.sqrt(-2 * Math.log(uj1)) * Math.cos(2 * Math.PI * uj2);
            jumpEffect = Math.exp(jump_mu + jump_sigma * zj);
          }

          current = current * Math.exp(adjustedDrift + dailyVol * z) * jumpEffect;
          if (i < pathsToStore) path.push(current);
        }
        if (i < pathsToStore) allPaths.push(path);
        else allPaths.push([current]); 
      }

      // Calculate Percentiles and Advanced Metrics
      const terminalValues = allPaths.map(p => p[p.length - 1]);
      terminalValues.sort((a, b) => a - b);
      
      const varThresholdIndex95 = Math.floor(iterations * 0.05);
      const varThresholdIndex99 = Math.floor(iterations * 0.01);
      
      const var95 = initialValue - terminalValues[varThresholdIndex95];
      const var99 = initialValue - terminalValues[varThresholdIndex99];
      
      const tailValues99 = terminalValues.slice(0, varThresholdIndex99 + 1);
      const cvar99 = tailValues99.length > 0 
        ? initialValue - (tailValues99.reduce((s, v) => s + v, 0) / tailValues99.length)
        : var99;

      // Risk Contribution
      const risk_contribution: Record<string, number> = {};
      portfolio.assets.forEach((asset: any) => {
        // Component VaR estimation
        risk_contribution[asset.ticker] = (asset.weight || 0.2) * (initialValue - terminalValues[varThresholdIndex95]) * 1.05;
      });

      const median: number[] = [];
      const lower95: number[] = [];
      const upper95: number[] = [];
      const lower99: number[] = [];
      const upper99: number[] = [];

      const fullPaths = allPaths.filter(p => p.length > 1);
      for (let t = 0; t < days; t++) {
        const valuesAtT = fullPaths.map(p => p[t]).sort((a,b) => a-b);
        median.push(valuesAtT[Math.floor(valuesAtT.length * 0.5)]);
        lower95.push(valuesAtT[Math.floor(valuesAtT.length * 0.05)]);
        upper95.push(valuesAtT[Math.floor(valuesAtT.length * 0.95)]);
        lower99.push(valuesAtT[Math.floor(valuesAtT.length * 0.01)]);
        upper99.push(valuesAtT[Math.floor(valuesAtT.length * 0.99)]);
      }

      const result = {
        paths: fullPaths,
        median,
        upper95,
        lower95,
        upper99,
        lower99,
        metrics: {
          expected_value: median[median.length - 1],
          portfolio_volatility: portfolioSigma,
          sharpe_ratio: (portfolioMu - 0.04) / (portfolioSigma || 1),
          var95,
          var99,
          cvar99,
          jump_intensity: simReq.jump_lambda,
          stress_impact: simReq.stress_test?.length ? "High" : "None"
        },
        risk_contribution
      };

      // 5. Update Simulation with result
      await supabase
        .from('simulations')
        .update({ 
          status: 'completed', 
          result,
          duration_ms: Date.now() - new Date(simulation.created_at).getTime()
        })
        .eq('id', simulation.id);

      console.log(`[simulate] Job ${simulation.id} completed successfully.`);

    } catch (simError) {
      console.error(`[simulate] Job ${simulation.id} failed:`, simError);
      await supabase
        .from('simulations')
        .update({ 
          status: 'failed', 
          error_message: simError instanceof Error ? simError.message : 'Internal simulation error' 
        })
        .eq('id', simulation.id);
    }

    return new Response(JSON.stringify({
      jobId: simulation.id,
      status: 'completed_inline',
      seed,
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
