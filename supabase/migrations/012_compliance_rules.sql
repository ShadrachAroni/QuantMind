-- QuantMind Migration 012 — Compliance & Data Retention
-- Implementing automated purging for the DPA 2019 rules

-- Function to purge old analytics and session data
create or replace function public.purge_expired_data()
returns void language plpgsql security definer as $$
begin
  -- AI session logs: 90 days rolling
  delete from public.ai_sessions where created_at < now() - interval '90 days';
  
  -- Analytics events: 24 months rolling
  delete from public.analytics_events where created_at < now() - interval '24 months';
  
  -- Crash logs: handled via Sentry, but if we had local ones
  
  -- Account closure data: 7 years retention (handled manually or via specialized logic)
end;
$$;

-- Schedule via pg_cron if available (requires superuser or specific setup)
-- select cron.schedule('0 0 * * *', 'select public.purge_expired_data()');
