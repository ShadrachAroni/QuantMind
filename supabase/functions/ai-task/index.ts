// QuantMind Edge Function: ai-task
// Structured AI tasks (Portfolio Doctor, Stress Debrief, Goal Planning)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';

const MODELS = {
  haiku:  'claude-3-haiku-20240307',
  sonnet: 'claude-3-5-sonnet-20241022',
  opus:   'claude-3-opus-20240229',
};

// Workflow definition as per PDF
// Portfolio Doctor: Haiku (classify) -> Opus (analyze) -> Sonnet (summarize)
// Since we are in an Edge Function, we might do these sequentially or as single high-tier call for MVP
// PDF suggests Batch workflows are non-streaming and return WorkflowResult.

async function callClaude(model: string, system: string, message: string) {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: message }],
    }),
  });
  return response.json();
}

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const user = await requireAuth(req);
    const { task_type, portfolio_id, simulation_id, metadata } = await req.json();

    if (!task_type) throw new Error('task_type is required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch context
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolio_id)
      .single();

    let result = {};
    let aiResponse: any = null;

    if (task_type === 'portfolio_doctor') {
      // 1. Haiku classifies risk areas (omitted for brevity, doing single Sonnet call for robust MVP)
      // 2. Pro users get Opus analysis
      const model = user.tier === 'pro' ? MODELS.opus : MODELS.sonnet;
      const system = `You are the QuantMind Portfolio Doctor. Analyze the user's assets and provide a professional risk assessment.
      Format your response as structured JSON: { "summary": string, "weaknesses": string[], "strengths": string[], "recommendation_type": string }
      DO NOT provide specific buy/sell tickers. Focus on diversification, correlation, and risk metrics.`;
      
      const message = `Portfolio: ${JSON.stringify(portfolio?.assets || [])}
      Metrics: ${JSON.stringify(metadata?.metrics || {})}`;

      aiResponse = await callClaude(model, system, message);
      if (aiResponse?.content?.[0]?.text) {
        result = JSON.parse(aiResponse.content[0].text);
      }
    } 
    else if (task_type === 'stress_debrief') {
      // Analyze simulation shocks
      const model = MODELS.sonnet;
      const system = `Explain the impact of market shocks on this portfolio. Reference the 2008 and COVID-19 scenarios.`;
      const message = `Simulation Results: ${JSON.stringify(metadata?.metrics || {})}`;
      aiResponse = await callClaude(model, system, message);
      if (aiResponse?.content?.[0]?.text) {
        result = { explanation: aiResponse.content[0].text };
      }
    }

    // Log to ai_sessions and increment quota using system RPC
    if (aiResponse) {
      await supabase.rpc('log_ai_session_with_quota', {
        user_id_val: user.id,
        model_id_val: user.tier === 'pro' ? MODELS.opus : MODELS.sonnet,
        tokens_in_val: aiResponse.usage?.input_tokens || 0,
        tokens_out_val: aiResponse.usage?.output_tokens || 0,
      });
    }

    return new Response(JSON.stringify(result), {
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
