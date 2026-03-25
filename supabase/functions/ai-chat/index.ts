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

const DOCTOR_PROMPT = `
SPECIAL_WORKFLOW: PORTFOLIO_DOCTOR
You are performing a deep diagnostic on the user's portfolio and simulation results.
1. Identify the top 3 risk factors (e.g., high concentration, high max drawdown, poor Sortino ratio).
2. Suggest general structural adjustments (e.g., "Increasing exposure to non-correlated assets like Bonds or Gold could dampen the Max Drawdown").
3. Analyze how the portfolio might behave in the specific stress scenario if provided.
4. Keep the tone clinical, institutional, and objective.
`;

const PERSONA_PROMPTS: Record<string, string> = {
  ANALYTICAL_COLD: "Your tone is clinical, institutional, and purely data-driven. Minimize emotive language. Focus on statistical significance and mathematical rigour.",
  ADVISORY_SUPPORTIVE: "Your tone is professional yet encouraging. Act as a high-level research assistant. Explain complex concepts clearly and provide constructive feedback on risk structures.",
  CRITICAL_ADVERSARIAL: "Your tone is skeptical and rigorous. Act as a 'Red Team' analyst. Challenge assumptions, highlight potential tail-risk failures, and look for what could go wrong.",
  HEDGE_FUND_VIBE: "Your tone is fast-paced, decisive, and focused on alpha and edge. Use institutional jargon. Prioritize risk-adjusted returns and market efficiency.",
  QUANTI_MAXIMALIST: "Your tone is obsessed with models and Greek parameters. Reference VaR, CVaR, and correlation matrices frequently. Everything is a stochastic process."
};

const SENSITIVITY_PROMPTS: Record<string, string> = {
  CONSERVATIVE: "Prioritize capital preservation above all else. Highlight even minor tail-risks and maintain a highly defensive posture in your analysis.",
  BALANCED: "Maintain a neutral stance between risk and reward. Focus on the 95% confidence interval and standard model outputs.",
  AGGRESSIVE: "Acknowledge higher risk tolerances. Focus on growth potential and volatility as an opportunity, while still noting major drawdown risks.",
  MAX_EXPOSURE: "Assume maximum risk appetite. Focus on extreme scenarios, leveraged outcomes, and potential for high-convexity performance."
};

const BASE_SYSTEM_PROMPT = `You are QuantMind AI, an educational financial risk analysis assistant.

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch full profile for persona and bandwidth tracking
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('ai_persona, ai_risk_sensitivity, ai_daily_usage_count, tier')
      .eq('id', user.id)
      .single();

    const userTier = profile?.tier || user.tier || 'free';
    const dailyLimit = TIER_AI_LIMITS[userTier] ?? 10;

    // Daily AI message limit
    const currentUsage = profile?.ai_daily_usage_count || 0;
    if (dailyLimit !== -1 && currentUsage >= dailyLimit) {
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

    // Fetch Market Sentiment (Pro Feature)
    let sentimentBlock = '';
    const { data: sentiment } = await supabase
      .from('market_sentiment')
      .select('sentiment_score, summary, top_signals')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sentiment) {
      sentimentBlock = `\n\nCURRENT MARKET SENTIMENT:
- Score: ${sentiment.sentiment_score} (Scale: -1 to 1)
- Summary: ${sentiment.summary}
- Top Signals: ${JSON.stringify(sentiment.top_signals)}`;
    } else {
      sentimentBlock = `\n\nCURRENT MARKET SENTIMENT: NEUTRAL (No significant news or social shifts detected in the last baseline).`;
    }

    // Gather portfolio/simulation context if provided

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

    // ─── Custom AI Configuration (Pro/Plus Only) ───────────────────────────
    let apiServiceKey = Deno.env.get('GEMINI_API_KEY');
    let aiModel = MODELS[user.tier] || MODELS.free;
    let aiProvider = 'google';

    const isPremium = ['plus', 'pro'].includes(user.tier);
    
    if (isPremium) {
      const { data: customConfig } = await supabase
        .from('user_ai_configs')
        .select('provider, model_id, encrypted_api_key')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (customConfig) {
        aiProvider = customConfig.provider;
        aiModel = customConfig.model_id;
        
        const { data: decryptedData, error: decryptError } = await supabase
          .rpc('decrypt_api_key', { 
            encrypted_text: customConfig.encrypted_api_key
          });

        if (!decryptError && decryptedData) {
          apiServiceKey = decryptedData;
        } else {
          console.warn('[ai-chat] API Key decryption failed, falling back to system defaults.', decryptError);
        }
      }

      // Pro handling for internal models if no custom config
      if (!customConfig && user.tier === 'pro') {
        aiModel = workflow === 'portfolio_doctor' ? MODELS.pro_advanced : MODELS.pro_standard;
      }
    }

    if (!apiServiceKey) throw new Error('AI service unavailable');

    // ─── Call AI Provider ──────────────────────────────────────────────────
    let responseText = '';
    let totalTokens = 0;

    const personaPrompt = PERSONA_PROMPTS[profile?.ai_persona as string] || PERSONA_PROMPTS.ANALYTICAL_COLD;
    const sensitivityPrompt = SENSITIVITY_PROMPTS[profile?.ai_risk_sensitivity as string] || SENSITIVITY_PROMPTS.BALANCED;
    const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\nCOGNITIVE_OVERRIDE:\n${personaPrompt}\n${sensitivityPrompt}`;

    const fullPrompt = (workflow === 'portfolio_doctor' ? DOCTOR_PROMPT : '') + systemPrompt + sentimentBlock + contextBlock + "\n\nUSER_MESSAGE: " + message;

    if (aiProvider === 'google') {
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiServiceKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { maxOutputTokens: 1500, temperature: 0.7 }
        }),
      });

      if (!geminiResponse.ok) throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
      const data = await geminiResponse.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
      totalTokens = data.usageMetadata?.totalTokenCount || 0;

    } else if (aiProvider === 'openai') {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiServiceKey}`
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [{ role: 'system', content: (workflow === 'portfolio_doctor' ? DOCTOR_PROMPT : '') + systemPrompt + contextBlock }, { role: 'user', content: message }],
          max_tokens: 1500,
          temperature: 0.7
        }),
      });

      if (!openaiResponse.ok) throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      const data = await openaiResponse.json();
      responseText = data.choices?.[0]?.message?.content || 'No response generated.';
      totalTokens = data.usage?.total_tokens || 0;

    } else if (aiProvider === 'anthropic') {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiServiceKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: aiModel,
          system: (workflow === 'portfolio_doctor' ? DOCTOR_PROMPT : '') + systemPrompt + contextBlock,
          messages: [{ role: 'user', content: message }],
          max_tokens: 1500,
          temperature: 0.7
        }),
      });

      if (!anthropicResponse.ok) throw new Error(`Anthropic API error: ${anthropicResponse.statusText}`);
      const data = await anthropicResponse.json();
      responseText = data.content?.[0]?.text || 'No response generated.';
      totalTokens = data.usage?.output_tokens + data.usage?.input_tokens || 0;
    }

    // Update usage count in DB using robust RPC with daily reset logic
    if (responseText && responseText !== 'No response generated.') {
      await supabase.rpc('increment_ai_usage', { user_id_val: user.id });
    }

    return new Response(JSON.stringify({
      message: responseText,
      model: aiModel,
      provider: aiProvider,
      workflow,
      tokens_used: totalTokens,
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
