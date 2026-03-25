import { createClient } from '@/lib/supabase';

export type SecurityEvent = 
  | 'AUTH_LOGIN' 
  | 'AUTH_LOGOUT' 
  | 'CREDENTIAL_CHANGE' 
  | 'SUBSCRIPTION_CHANGE' 
  | 'SUBSCRIPTION_DECOMMISSION'
  | 'PORTFOLIO_CREATE'
  | 'PORTFOLIO_DELETE'
  | 'HSM_SIGN_SUCCESS'
  | 'HSM_SIGN_FAILURE'
  | 'ADMIN_ACTION';

interface AuditOptions {
  userId?: string;
  isAdmin?: boolean;
  metadata?: any;
  resourceId?: string;
}

/**
 * Logs a high-impact security or administrative event to the persistent audit ledger.
 */
export async function logSecurityEvent(
  event: SecurityEvent, 
  options: AuditOptions = {}
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const targetUserId = options.userId || user?.id;
  if (!targetUserId && !options.isAdmin) return;

  const payload = {
    user_id: targetUserId,
    event: event,
    metadata: {
      ...options.metadata,
      timestamp: new Date().toISOString(),
      agent: 'QuantMind_Edge_v1.0',
      is_hsm_signed: !!options.metadata?.hsm_signature
    },
    created_at: new Date().toISOString()
  };

  try {
    // 1. Log to user activity ledger
    const { error: userLogError } = await supabase
      .from('user_activity_log')
      .insert([payload]);

    if (userLogError) console.error('AUDIT_LOG_USER_FAILURE:', userLogError);

    // 2. If it's an admin action or high-impact, log to admin audit ledger
    if (options.isAdmin || ['CREDENTIAL_CHANGE', 'SUBSCRIPTION_DECOMMISSION', 'ADMIN_ACTION'].includes(event)) {
      const { error: adminLogError } = await supabase
        .from('admin_audit_log')
        .insert([{
          admin_user_id: user?.id,
          action_type: event,
          target_resource: options.resourceId || 'system',
          new_value: options.metadata,
          created_at: new Date().toISOString()
        }]);

      if (adminLogError) console.error('AUDIT_LOG_ADMIN_FAILURE:', adminLogError);
    }
  } catch (error) {
    console.error('AUDIT_LOG_CRITICAL_FAILURE:', error);
  }
}
