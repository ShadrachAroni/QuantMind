import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  if (!signature.startsWith('sha256=')) return false;
  
  const receivedHash = signature.substring(7); // Remove 'sha256='
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', 
    enc.encode(secret), 
    { name: 'HMAC', hash: 'SHA-256' }, 
    false, 
    ['sign', 'verify']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC', 
    key, 
    enc.encode(payload)
  );
  
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const isValid = hex === receivedHash.toLowerCase();
  
  if (!isValid) {
    console.error(`[GITHUB_SIG_FAIL] Computed: ${hex.substring(0, 8)}..., Received: ${receivedHash.substring(0, 8)}...`);
  }
  
  return isValid;
}

serve(async (req: Request) => {
  try {
    const signature = req.headers.get('x-hub-signature-256');
    const eventType = req.headers.get('x-github-event');
    const secret = Deno.env.get('GITHUB_WEBHOOK_SECRET');

    if (!signature || !eventType) {
       console.error('[GITHUB_WEBHOOK] Missing headers');
       return new Response('Missing headers', { status: 400 });
    }

    if (!secret) {
       console.error('[GITHUB_WEBHOOK] GITHUB_WEBHOOK_SECRET not configured');
       return new Response('Config missing', { status: 500 });
    }

    const payloadText = await req.text();
    const isValid = await verifySignature(payloadText, signature, secret);

    if (!isValid) {
      console.error('[GITHUB_WEBHOOK] Invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(payloadText);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Log to public.webhook_events
    await supabase.from('webhook_events').insert({
      provider: 'github',
      event_type: eventType,
      payload: payload,
      processed: true,
      processed_at: new Date().toISOString()
    });

    // 2. Automation: Handle 'push' events specifically
    if (eventType === 'push') {
      const repoName = payload.repository?.full_name;
      const ref = payload.ref;
      const pusher = payload.pusher?.name;
      const commitMsg = payload.commits?.[0]?.message || 'No commit message';

      console.log(`[GITHUB_PUSH] ${repoName} (${ref}) by ${pusher}: ${commitMsg}`);

      // Log push to system_event_log for transparency
      await supabase.from('system_event_log').insert({
        event_name: 'github_push',
        event_type: 'repository',
        description: `New push detected in ${repoName} on ${ref} by ${pusher}`,
        metadata: {
          repository: repoName,
          ref: ref,
          pusher: pusher,
          commit: commitMsg,
          compare_url: payload.compare
        }
      });
    }

    // 3. Handle 'ping' event from GitHub
    if (eventType === 'ping') {
      console.log('[GITHUB_PING] Webhook connection verified');
      return new Response(JSON.stringify({ message: 'Pong! Webhook verified successfully.' }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('[GITHUB_WEBHOOK_CRITICAL] Error processing webhook:', error);
    return new Response('Webhook handling failed', { status: 500 });
  }
});
