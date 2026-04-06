/**
 * OmniWealth Unified Auth & Security Diagnostics
 * 
 * Provides standardized error handling, audit logging, and identity bridging
 * for MojoAuth, Supabase, and Warrant (ReBAC) interactions.
 */

export enum AuthService {
  SUPABASE = 'SUPABASE',
  MOJOAUTH = 'MOJOAUTH',
  WARRANT = 'WARRANT',
  LOCAL_REBAC = 'LOCAL_REBAC'
}

export enum SecurityEvent {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  SESSION_REFRESH = 'SESSION_REFRESH',
  LOGOUT = 'LOGOUT',
  REBAC_DENIED = 'REBAC_DENIED',
  MFA_STEPUP = 'MFA_STEPUP'
}

export interface AuthDiagnostic {
  service: AuthService;
  event: SecurityEvent;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * Audit Logger: Standardizes how security events are recorded for institutional review.
 */
export async function logSecurityAudit(diagnostic: AuthDiagnostic) {
  const payload = {
    ...diagnostic,
    timestamp: diagnostic.timestamp || new Date().toISOString(),
    environment: Deno.env.get('ENVIRONMENT') || 'development'
  };

  console.log(`[SECURITY_AUDIT][${payload.service}][${payload.event}]: User ${payload.userId || 'anonymous'}`);
  
  // In production, this would also write to a dedicated audit_logs table or external SIEM
  /*
  const { supabaseAdmin } = await import('./supabaseAdmin.ts');
  await supabaseAdmin.from('security_audit_logs').insert(payload);
  */
}

/**
 * Error Facade: Standardizes auth errors returned to the client 
 * while preserving detailed diagnostics for developers.
 */
export function handleAuthError(error: any, service: AuthService): Response {
  const correlationId = crypto.randomUUID();
  
  logSecurityAudit({
    service,
    event: SecurityEvent.LOGIN_FAILURE,
    metadata: { error: error.message, correlationId },
    timestamp: new Date().toISOString()
  });

  return new Response(JSON.stringify({
    status: 'error',
    code: 'AUTH_FAILED',
    message: 'Authentication or authorization failed. Please contact your system administrator.',
    correlationId
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Session Configuration: Synchronized TTL settings
 */
export const SECURITY_CONFIG = {
  SESSION_TTL_SECONDS: 3600, // 1 Hour (User requested sync)
  MFA_THRESHOLD_SECONDS: 86400, // 24 Hours
  BIOMETRIC_STRICT_MODE: true
};
