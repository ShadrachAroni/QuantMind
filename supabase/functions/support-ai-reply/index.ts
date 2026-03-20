// QuantMind Edge Function: support-ai-reply
// Automated first-pass support using RAG (Knowledge Base)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

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

    // 2. Simple RAG: Search knowledge base
    interface Article {
      title: string;
      content: string;
    }

    const { data: articles } = await supabase
      .from('knowledge_base_articles')
      .select('title, content')
      .eq('is_published', true)
      .limit(3); 

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

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.5,
        }
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.json();
      console.error('[support-ai-reply] Gemini error:', err);
      throw new Error('AI service temporarily unavailable');
    }

    const geminiData = await geminiRes.json();
    const replyContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response. Please check back later.';

    // 4. Insert AI message
    await supabase.from('support_messages').insert({
      ticket_id: ticketId,
      content: replyContent,
      is_staff: true,
      sender_type: 'ai'
    });

    // 5. Send Email Notification
    try {
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('user_id')
        .eq('id', ticketId)
        .single();
      
      if (ticket) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('id', ticket.user_id)
          .single();
        
        if (userProfile?.email) {
          const { sendEmail, getFX1Template } = await import('../_shared/email.ts');
          const emailHtml = getFX1Template(
            `<p>Our AI Assistant has provided a first-pass reply to your ticket: <strong>${subject}</strong></p>
             <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 20px 0;">
               ${replyContent}
             </div>
             <p>A human agent has also been notified and will follow up if further assistance is needed.</p>`,
            'New Support Reply'
          );
          await sendEmail({
            to: userProfile.email,
            subject: `Re: ${subject}`,
            html: emailHtml
          });
        }
      }
    } catch (emailErr) {
      console.error('[support-ai-reply] Email notification failed:', emailErr);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('AI Support Reply Error:', err);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
