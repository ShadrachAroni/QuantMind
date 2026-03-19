// QuantMind Edge Function: support-ai-reply
// Automated first-pass support using RAG (Knowledge Base)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

Deno.serve(async (req: Request) => {
  try {
    const { record } = await req.json(); // Trigger payload
    const ticketId = record.id;
    const subject = record.subject;

    // 1. Fetch the initial message
    const { data: messages, error: msgError } = await supabase
      .from('support_messages')
      .select('content')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (msgError || !messages.length) throw new Error('Initial message not found');
    const userMessage = messages[0].content;

    // 2. Simple RAG: Search knowledge base via keyword match on tags/content
    // In a production app, we would use pgvector here.
    interface Article {
      title: string;
      content: string;
    }

    const { data: articles } = await supabase
      .from('knowledge_base_articles')
      .select('title, content')
      .eq('is_published', true)
      .limit(3); 
      // Simplified: Just taking top 3 for context in this MVP

    const context = (articles as Article[] | null)?.map((a: Article) => `ARTICLE: ${a.title}\n${a.content}`).join('\n\n') || 'No direct documentation found.';

    // 3. Generate AI Reply
    const systemPrompt = `You are the QuantMind Virtual Assistant. Your goal is to provide a helpful "first-pass" reply to support tickets.
    Use the provided Knowledge Base context if relevant. If you cannot solve the issue, assure the user that a human agent has been notified.
    
    KNOWLEDGE BASE CONTEXT:
    ${context}
    
    TONE: Professional, empathetic, and technical.
    LIMIT: Max 150 words.
    STRICT RULE: Do not make up facts. If information is missing, refer to the human team.`;

    const userPrompt = `TICKET SUBJECT: ${subject}\nUSER MESSAGE: ${userMessage}`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const aiData = await aiRes.json();
    const replyContent = aiData.content[0].text;

    // 4. Insert AI message
    await supabase.from('support_messages').insert({
      ticket_id: ticketId,
      content: replyContent,
      is_staff: true,
      sender_type: 'ai'
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('AI Support Reply Error:', err);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
