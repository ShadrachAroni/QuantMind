-- QuantMind Migration 026 — Security Hardening & Audit Remediation
-- This migration addresses security vulnerabilities identified in the Supabase Security Audit.

-- ======================================================
-- 1. HARDENING VIEWS (ERROR: Security Definer View)
-- ======================================================
-- Recreating views with security_invoker = true to ensure they respect RLS policies of the querying user.

-- Monthly Active Users
DROP VIEW IF EXISTS public.view_mau;
CREATE VIEW public.view_mau WITH (security_invoker = true) AS
SELECT
  date_trunc('month', created_at) AS month,
  count(distinct user_id) AS mau_count
FROM public.analytics_events
WHERE event_type = 'session_start'
GROUP BY 1;

-- Revenue by Tier
DROP VIEW IF EXISTS public.view_revenue_by_tier;
CREATE VIEW public.view_revenue_by_tier WITH (security_invoker = true) AS
SELECT
  tier,
  count(*) AS subscriber_count,
  CASE 
    WHEN tier = 'plus' THEN count(*) * 9.99
    WHEN tier = 'pro' THEN count(*) * 24.99
    WHEN tier = 'student' THEN count(*) * 5.00
    ELSE 0
  END AS estimated_mrr
FROM public.subscriptions
WHERE status = 'active'
GROUP BY tier;

-- AI Performance
DROP VIEW IF EXISTS public.view_ai_performance;
CREATE VIEW public.view_ai_performance WITH (security_invoker = true) AS
SELECT
  model_id,
  avg(latency_ms) AS avg_latency,
  avg(ttfb_ms) AS avg_ttfb,
  sum(tokens_in) AS total_tokens_in,
  sum(tokens_out) AS total_tokens_out,
  count(*) AS total_requests
FROM public.ai_sessions
GROUP BY model_id;

-- Simulation Stats
DROP VIEW IF EXISTS public.view_simulation_stats;
CREATE VIEW public.view_simulation_stats WITH (security_invoker = true) AS
SELECT
  status,
  count(*) AS count,
  avg(duration_ms) AS avg_duration
FROM public.simulations
GROUP BY status;


-- ======================================================
-- 2. HARDENING FUNCTIONS (WARN: Mutable Search Path)
-- ======================================================
-- Setting explicit search_path to prevent search-path hijacking in SECURITY DEFINER functions.

ALTER FUNCTION public.increment_ai_usage(user_id_val uuid) SET search_path = '';
ALTER FUNCTION public.cleanup_paystack_transactions() SET search_path = '';
ALTER FUNCTION public.check_institutional_record(p_email text) SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.enforce_credential_change_policy() SET search_path = '';
ALTER FUNCTION public.log_ai_session_with_quota(user_id_val uuid, model_id_val text, tokens_in_val integer, tokens_out_val integer, latency_ms_val integer) SET search_path = '';
ALTER FUNCTION public.decrypt_api_key(encrypted_text text, passphrase text) SET search_path = '';
ALTER FUNCTION public.delete_old_webhook_events() SET search_path = '';
ALTER FUNCTION public.save_user_ai_config(p_provider text, p_model_id text, p_api_key text) SET search_path = '';
ALTER FUNCTION public.approve_campaign(p_campaign_id uuid) SET search_path = '';
ALTER FUNCTION public.handle_auth_email_hook(event jsonb) SET search_path = '';
ALTER FUNCTION public.cleanup_expired_otps() SET search_path = '';
ALTER FUNCTION public.prevent_modification_on_acceptance() SET search_path = '';
ALTER FUNCTION public.handle_password_change() SET search_path = '';
ALTER FUNCTION public.encrypt_api_key(plain_text text, passphrase text) SET search_path = '';
ALTER FUNCTION public.handle_risk_alert_on_simulation() SET search_path = '';
ALTER FUNCTION public.auto_log_system_event() SET search_path = '';


-- ======================================================
-- 3. RESTRICTING ACCESS (WARN: Public Executable SD Functions)
-- ======================================================
-- Revoking EXECUTE permission from public/anon/authenticated for internal-only functions.

REVOKE EXECUTE ON FUNCTION public.approve_campaign(p_campaign_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_log_system_event() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_institutional_record(p_email text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_paystack_transactions() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_user_data(p_user_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_password_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_risk_alert_on_simulation() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_ai_usage(user_id_val uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.invoke_support_ai_reply() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_ai_session_with_quota(user_id_val uuid, model_id_val text, tokens_in_val integer, tokens_out_val integer, latency_ms_val integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_expired_data() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.save_user_ai_config(p_provider text, p_model_id text, p_api_key text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_welcome_email() FROM anon, authenticated;


-- ======================================================
-- 4. HARDENING EXTENSIONS (WARN: Extension in Public)
-- ======================================================
-- Moving extensions to a dedicated schema.

CREATE SCHEMA IF NOT EXISTS extensions;
-- ALTER EXTENSION pg_net SET SCHEMA extensions;
-- ALTER EXTENSION moddatetime SET SCHEMA extensions;


-- ======================================================
-- 5. FIXING RLS POLICIES (WARN: RLS Policy Always True)
-- ======================================================

-- Tightening tracking updates for campaign recipients
DROP POLICY IF EXISTS "Public tracking updates" ON public.campaign_recipients;
CREATE POLICY "Public tracking updates" ON public.campaign_recipients 
FOR UPDATE USING (status = 'sent') WITH CHECK (status IN ('opened', 'clicked'));

-- Ensuring only users can create their own profile (preventing profile poaching)
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.user_profiles;
CREATE POLICY "Service role can insert profiles" ON public.user_profiles 
FOR INSERT WITH CHECK (auth.uid() = id);
