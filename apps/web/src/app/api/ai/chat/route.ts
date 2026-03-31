import { createServerSupabaseClient } from '@/lib/supabase-server';
import { decrypt } from '@/lib/encryption';
import { checkAIQuota, logAIUsage } from '@/lib/ai/quota';

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;

/**
 * AI Oracle API Route - STREAMING
 * Supports dynamic multi-provider (Gemini, OpenAI, Anthropic) and quota management.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 });
    }

    const { messages } = await req.json();

    // 1. Fetch User Profile and custom AI configuration
    const [profileRes, configRes] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_ai_configs').select('*').eq('user_id', user.id).eq('is_active', true).maybeSingle()
    ]);

    const profile = profileRes.data;
    const customConfig = configRes.data;

    if (!profile) {
      return new Response(JSON.stringify({ error: 'PROFILE_NOT_FOUND' }), { status: 404 });
    }

    // 2. Quota Check
    let isUsingCustomNode = !!(customConfig && customConfig.encrypted_api_key && ENCRYPTION_SECRET);
    const quotaStatus = await checkAIQuota(supabase, user.id, isUsingCustomNode);
    
    if (!quotaStatus.allowed) {
      return new Response(JSON.stringify({ error: 'QUOTA_EXCEEDED' }), { status: 429 });
    }

    // 3. Determine Provider and API Key
    let provider = 'google';
    let modelId = 'gemini-2.5-flash';
    let targetApiKey = process.env.GEMINI_API_KEY;

    if (isUsingCustomNode && customConfig) {
      try {
        provider = customConfig.provider;
        modelId = customConfig.model_id;
        targetApiKey = decrypt(customConfig.encrypted_api_key, ENCRYPTION_SECRET!);
      } catch (err) {
        console.error('DECRYPTION_FAILED::NODE_BYPASS_FALLBACK');
        isUsingCustomNode = false; // Fallback to system if custom fails
      }
    }

    if (!targetApiKey) {
      return new Response(JSON.stringify({ error: 'CONFIG_RELAY_NOT_FOUND' }), { status: 500 });
    }

    // --- FETCH ARCHIVAL CONTEXT DATA ---
    const [portfoliosRes, simulationsRes, marketRes] = await Promise.all([
      supabase.from('portfolios').select('id, name, assets').eq('user_id', user.id),
      supabase.from('simulations').select('id, portfolio_name, status, result').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('prices').select('symbol, price, change_24h').limit(15)
    ]);

    const contextData = {
      portfolios: (portfoliosRes.data || []).map(p => ({ name: p.name, assets: p.assets })),
      recent_simulations: (simulationsRes.data || []).map(s => ({
        name: s.portfolio_name,
        status: s.status,
        summary: s.result?.summary || 'No summary available'
      })),
      market_vitals: marketRes.data || []
    };

    const systemPrompt = `You are the QuantMind AI Oracle, an institutional-grade financial assistant. 
    Your goal is to provide deep insights into the user's specific financial situation.
    CONTEXT: ${JSON.stringify(contextData)}
    GUIDELINES: 1. Reference portfolios/simulations by name. 2. Use live market_vitals. 3. Use institutional tone and markdown.`;

    // 4. Provider-Specific Request Handling
    if (provider === 'google') {
      const contents = messages
        .filter((m: any) => m.content && m.content.trim() !== '')
        .map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${targetApiKey}&alt=sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: "Understood. Synchronizing cognitive buffers..." }] },
            ...contents
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return new Response(JSON.stringify({ error: 'QUOTA_EXCEEDED' }), { status: 429 });
        return new Response(JSON.stringify({ error: 'COGNITIVE_RELAY_FAILURE' }), { status: 500 });
      }

      // 5. Proxy results and increment quota on start if not custom
      if (!isUsingCustomNode) {
        // Estimate token count very roughly
        const estTokensIn = JSON.stringify(messages).length / 4;
        await logAIUsage(supabase, user.id, modelId, Math.floor(estTokensIn));
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) { controller.close(); return; }
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.substring(6));
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    if (text) controller.enqueue(encoder.encode(text));
                  } catch (e) {}
                }
              }
            }
          } catch (err) { controller.error(err); } finally { controller.close(); }
        },
      });

      return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
    } else {
      // OpenAI/Anthropic Placeholder - Extend as needed
      return new Response(JSON.stringify({ error: 'PROVIDER_PROTOCOL_NOT_YET_IMPLEMENTED' }), { status: 501 });
    }

  } catch (error) {
    console.error('[AI_Relay_Fatal]', error);
    return new Response(JSON.stringify({ error: 'INTERNAL_SERVER_ERROR' }), { status: 500 });
  }
}
