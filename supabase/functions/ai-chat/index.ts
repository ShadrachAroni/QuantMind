// QuantMind Edge Function: ai-chat
// Anthropic Claude with context injection, prompt injection prevention, streaming
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { rateLimit, rateLimitResponse } from '../_shared/rateLimiter.ts';

const TIER_AI_LIMITS: Record<string, number> = {
  free: 10,
  plus: 50,
  pro: -1,    // unlimited
  student: 50,
};

const MODELS: Record<string, string> = {
  free:    'gemini-1.5-flash',
  plus:    'gemini-1.5-flash',
  pro_standard: 'gemini-1.5-flash',
  pro_advanced: 'gemini-1.5-pro',
  student: 'gemini-1.5-flash',
};

// Prompt injection prevention: strip suspicious patterns
function sanitizeInput(text: string): string {
  const patterns = [
    /ignore\s+(previous|all|prior)\s+(instructions?|prompts?)/gi,
    /you\s+are\s+now\s+/gi,
    /system\s*:\s*/gi,
    /\[INST\]/gi,
    /<\|im_start\|>/gi,
    /human\s*:\s*ignore/gi,
    /assistant\s*:\s*sure,?\s*i\s*will/gi,
  ];

  let sanitized = text;
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }
  return sanitized.slice(0, 2000); // cap length
}

const SYSTEM_PROMPT = `You are QuantMind AI, an educational financial risk analysis assistant.

CORE RULES:
- You are an EDUCATIONAL TOOL ONLY. Always clarify this.
- NEVER provide specific investment recommendations: "buy X", "sell Y", "invest in Z"
- NEVER predict specific future prices or guarantee outcomes
- NEVER claim simulations represent future reality
- ALWAYS include appropriate disclaimers when discussing risk metrics
- All analysis is based on historical data and mathematical models, not predictions

CAPABILITIES:
- Explain portfolio risk metrics (VaR, CVaR, Sharpe ratio, Sortino ratio, Max Drawdown)
- Explain simulation methodology (Monte Carlo, GBM, parameters)
- Help users understand correlation and diversification
- Explain probability distributions in portfolio context
- Answer general quantitative finance educational questions

BEHAVIOR:
- Be clear, concise, and use plain English
- Define technical terms when first used
- If asked to make financial decisions FOR the user, explain why you cannot
- Reference the data provided in the portfolio/simulation context when available

DISCLAIMERS: Always include this on first message: "QuantMind AI provides educational information only. This is not financial advice. Consult a qualified financial advisor for investment decisions."`;

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const user = await requireAuth(req);

    // Daily AI message limit
    const dailyLimit = TIER_AI_LIMITS[user.tier] ?? 10;
    if (dailyLimit !== -1) {
      const limit = await rateLimit(`ai-chat-daily:${user.id}`, dailyLimit, 86400);
      if (!limit.allowed) {
        return new Response(JSON.stringify({
          error: `You've reached your daily AI message limit (${dailyLimit} messages). Upgrade to Pro for unlimited AI access.`,
          upgradeRequired: true,
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }
    }

    const body = await req.json();
    const rawMessage = body.message;
    const context = body.context || {};
    const workflow = body.workflow || 'general_assistant';

    if (!rawMessage || typeof rawMessage !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Sanitize input to prevent prompt injection
    const message = sanitizeInput(rawMessage);

    // Gather portfolio/simulation context if provided
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let contextBlock = '';
    
    if (context.portfolio_id) {
      const { data: portfolio } = await supabase
        .from('portfolios')
        .select('name, assets')
        .eq('id', context.portfolio_id)
        .eq('user_id', user.id)
        .single();
      
      if (portfolio) {
        contextBlock += `\n\nUSER'S CURRENT PORTFOLIO: "${portfolio.name}"
Assets: ${JSON.stringify(portfolio.assets, null, 2)}`;
      }
    }

    if (context.simulation_result_id) {
      const { data: sim } = await supabase
        .from('simulations')
        .select('result, params')
        .eq('id', context.simulation_result_id)
        .eq('user_id', user.id)
        .single();
      
      if (sim?.result) {
        const metrics = (sim.result as any).metrics;
        if (metrics) {
          contextBlock += `\n\nSIMULATION RESULTS (${sim.params.num_paths} paths, ${sim.params.time_horizon_years}yr):
- Expected Return (annualised): ${(metrics.expected_return_annualized * 100).toFixed(2)}%
- Volatility (annualised): ${(metrics.volatility_annualized * 100).toFixed(2)}%
- VaR 95%: ${(metrics.var_95 * 100).toFixed(2)}%
- CVaR 95%: ${(metrics.cvar_95 * 100).toFixed(2)}%
- Sharpe Ratio: ${metrics.sharpe_ratio?.toFixed(2)}
- Max Drawdown: ${(metrics.max_drawdown * 100).toFixed(2)}%
- Probability of Loss: ${(metrics.probability_of_loss * 100).toFixed(1)}%`;
        }
      }
    }

    // AI Preferences (Restricted to Plus/Pro)
    const allowedAIPreferences = ['plus', 'pro'].includes(user.tier);
    const aiPrefs = allowedAIPreferences ? context.aiPrefs : null;
    
    if (aiPrefs) {
      contextBlock += `\n\nAI_COGNITIVE_OVERRIDES:
- Risk Aversion: ${aiPrefs.riskAversion || 'standard'}
- Detail Level: ${aiPrefs.detailLevel || 'concise'}
- Focus Areas: ${JSON.stringify(aiPrefs.focusAreas || [])}`;
    }

    // Call Gemini API
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) throw new Error('AI service unavailable');

    // Model Selection based on tier and workflow
    let model = MODELS[user.tier] || MODELS.free;
    if (user.tier === 'pro') {
      model = workflow === 'portfolio_doctor' ? MODELS.pro_advanced : MODELS.pro_standard;
    }

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: SYSTEM_PROMPT + contextBlock + "\n\nUSER_MESSAGE: " + message }]
        }],
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.7,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const err = await geminiResponse.json();
      console.error('[ai-chat] Gemini error:', err);
      throw new Error('AI service temporarily unavailable');
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response. Please try again.';

    return new Response(JSON.stringify({
      message: responseText,
      model,
      workflow,
      tokens_used: geminiData.usageMetadata?.totalTokenCount,
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
    console.error('[ai-chat] Error:', message);
    return new Response(JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
});
