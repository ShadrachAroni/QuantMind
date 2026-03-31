import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error('Unauthorized');

    const body = await req.json();
    const { password, otpToken, verificationType } = body;

    // 2. Identity Verification
    if (verificationType === 'password') {
      if (!password) throw new Error('Password is required for verification');
      
      // Verify password by attempting a sign-in
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (signInError) throw new Error('INVALID_PASSWORD_OR_CREDENTIALS');
    } else if (verificationType === 'otp') {
      if (!otpToken) throw new Error('OTP token is required for verification');
      
      // Verify OTP
      const { error: otpError } = await supabaseAdmin.auth.verifyOtp({
        email: user.email!,
        token: otpToken,
        type: 'email'
      });

      if (otpError) throw new Error('INVALID_OR_EXPIRED_OTP');
    } else {
      throw new Error('INVALID_VERIFICATION_TYPE');
    }

    // 3. Purge App Data (RPC)
    const { error: rpcError } = await supabaseAdmin.rpc('delete_user_data', { p_user_id: user.id });
    if (rpcError) throw rpcError;

    // 4. Delete Auth User (Service Role)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    // 5. Audit Logging
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.headers.get('x-real-ip') || null);

    await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        admin_user_id: user.id, // User initiated
        action_type: 'SELF_ACCOUNT_DELETION',
        target_resource: `auth.users/${user.id}`,
        target_id: user.id,
        reason: 'User-requested permanent account termination.',
        ip_address: ipAddress,
        new_value: { status: 'deleted', platform: req.headers.get('user-agent') }
      });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'ACCOUNT_PERMANENTLY_TERMINATED' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });

  } catch (error: any) {
    console.error('[delete-account] ERROR:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === 'Unauthorized' ? 401 : 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
});
