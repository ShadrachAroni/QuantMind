import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireAuth, forbiddenResponse } from '../_shared/auth.ts';

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const adminUser = await requireAuth(req);
    if (!adminUser.is_admin) {
      return forbiddenResponse('Administrative privileges required for session state modification.');
    }

    const body = await req.json().catch(() => ({}));
    const { action, targetUserId, reason } = body;

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'targetUserId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (action === 'revoke_sessions') {
      // Revoke all sessions for the target user using Admin API
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(targetUserId);
      if (signOutError) throw signOutError;

      // Extract a clean IP for the Postgres 'inet' type
      const forwardedFor = req.headers.get('x-forwarded-for');
      const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.headers.get('x-real-ip') || null);

      // Log the action to the audit trail
      const { error: logError } = await supabaseAdmin
        .from('admin_audit_log')
        .insert({
          admin_user_id: adminUser.id,
          action_type: 'REVOKE_SESSIONS',
          target_resource: `auth.users/${targetUserId}`,
          target_id: targetUserId,
          reason: reason || 'Administrative session revocation initiated from dashboard.',
          ip_address: ipAddress,
        });
      
      if (logError) console.error('AUDIT_LOG_ERROR:', logError);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'SESSION_REVOCATION_COMPLETE',
        target: targetUserId 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    return new Response(JSON.stringify({ error: 'INVALID_ADMIN_ACTION' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });

  } catch (error: any) {
    console.error('[admin-session-manager] CRITICAL_FAILURE:', error);
    return new Response(JSON.stringify({ error: error.message || 'INTERNAL_SERVER_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
});
