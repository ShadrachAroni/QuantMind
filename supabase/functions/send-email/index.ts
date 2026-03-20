/// <reference lib="deno.ns" />
// QuantMind Edge Function: send-email
// Centralized mailer triggered via API or DB Webhooks
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { sendEmail, getFX1Template } from '../_shared/email.ts';

serve(async (req: Request) => {
  // Handle CORS
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { to, subject, title, body, action_url, action_text } = await req.json();

    if (!to || !subject || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build FX1 Content
    let htmlContent = `<p>${body}</p>`;
    if (action_url && action_text) {
      htmlContent += `<a href="${action_url}" class="btn">${action_text}</a>`;
    }

    const html = getFX1Template(htmlContent, title || subject);

    // Send via Resend
    const result = await sendEmail({ to, subject, html });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-email] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
