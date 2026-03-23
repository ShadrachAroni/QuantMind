import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireAuth, forbiddenResponse, unauthorizedResponse } from '../_shared/auth.ts';

serve(async (req: Request) => {
  const origin = req.headers.get('Origin') || '*';
  const authHeader = req.headers.get('Authorization');
  console.log(`[admin-mfa-handler] INCOMING_REQUEST: ${req.method} | Auth: ${authHeader ? 'PRESENT' : 'MISSING'}`);
  
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const user = await requireAuth(req);
    if (!user.is_admin) {
      return forbiddenResponse('Administrative privileges required for authentication challenges.', origin);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, code: inputCode } = await req.json().catch(() => ({}));

    if (action === 'send') {
      // 1. Rate Limit Check: Don't spam if a code was sent in the last 2 minutes
      const { data: existingCode } = await supabaseAdmin
        .from('admin_otp_codes')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingCode) {
        const lastSent = new Date(existingCode.created_at).getTime();
        const now = new Date().getTime();
        if (now - lastSent < 2 * 60 * 1000) {
          console.log('[admin-mfa-handler] RATE_LIMIT_HIT: Skipping duplicate email dispatch.');
          return new Response(JSON.stringify({ success: true, message: 'AUTHORIZATION_CODE_ALREADY_DISPATCHED' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
          });
        }
      }

      // 2. Generate 6-digit code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // 3. Store in DB (Clean up old codes for this user first)
      await supabaseAdmin
        .from('admin_otp_codes')
        .delete()
        .eq('user_id', user.id);

      const { error: dbError } = await supabaseAdmin
        .from('admin_otp_codes')
        .insert({
          user_id: user.id,
          code_hash: generatedCode, // Storing plain for simplicity in internal dev
          expires_at: expiresAt.toISOString(),
        });

      if (dbError) throw dbError;

      // 3. Trigger email
      const emailRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.email,
          type: 'admin_2fa_otp',
          details: { code: generatedCode },
        }),
      });

      console.log(`[admin-mfa-handler] EMAIL_DISPATCH_STATUS: ${emailRes.status}`);

      if (!emailRes.ok) {
        const errorText = await emailRes.text();
        console.error('EMAIL_DISPATCH_FAILURE:', errorText);
        throw new Error('Failed to dispatch authorization code to administrative email.');
      }

      return new Response(JSON.stringify({ success: true, message: 'AUTHORIZATION_CODE_DISPATCHED' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    if (action === 'verify') {
      if (!inputCode) throw new Error('Authorization code required.');

      // 1. Fetch valid code
      const { data, error: fetchError } = await supabaseAdmin
        .from('admin_otp_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('code_hash', inputCode)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (fetchError || !data) {
        // Log failed attempt to security log
        await supabaseAdmin.from('security_log').insert({
          user_id: user.id,
          threat_type: 'FAILED_ADMIN_MFA',
          severity: 'HIGH',
          metadata: { attempt: inputCode, ip: req.headers.get('x-real-ip') },
        });

        return unauthorizedResponse('Invalid or expired authorization code.', origin);
      }

      // 2. Success - Update user profile
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({ last_mfa_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 3. Delete used code
      await supabaseAdmin
        .from('admin_otp_codes')
        .delete()
        .eq('id', data.id);

      // 4. Log success
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action_type: 'MFA_VERIFIED',
        target_resource: 'auth.mfa',
        reason: 'Administrative multi-factor challenge successfully completed.',
      });

      return new Response(JSON.stringify({ success: true, message: 'VERIFICATION_SUCCESSFUL' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    return new Response(JSON.stringify({ error: 'INVALID_MFA_ACTION' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });

  } catch (error: any) {
    console.error('[admin-mfa-handler] CRITICAL_FAILURE:', error);
    return new Response(JSON.stringify({ error: error.message || 'INTERNAL_SERVER_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
});
