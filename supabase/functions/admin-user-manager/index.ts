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
      return forbiddenResponse('Administrative privileges required for user management.');
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

    if (action === 'delete_user') {
      // Delete the user from Auth (cascades to public.user_profiles if setup, but usually needs manual cleanup or triggers)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      if (deleteError) throw deleteError;

      // Log the action
      const forwardedFor = req.headers.get('x-forwarded-for');
      const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.headers.get('x-real-ip') || null);

      await supabaseAdmin
        .from('admin_audit_log')
        .insert({
          admin_user_id: adminUser.id,
          action_type: 'DELETE_USER',
          target_resource: `auth.users/${targetUserId}`,
          target_id: targetUserId,
          reason: reason || 'Administrative user deletion.',
          ip_address: ipAddress,
        });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'USER_DELETED_SUCCESSFULLY',
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
    console.error('[admin-user-manager] CRITICAL_FAILURE:', error);
    return new Response(JSON.stringify({ error: error.message || 'INTERNAL_SERVER_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
});
