-- QuantMind Migration 007 — Aggregation Views for Dashboard
-- Providing telemetry and financial metrics for the management dashboard

-- Monthly Active Users
create or replace view public.view_mau as
select
  date_trunc('month', created_at) as month,
  count(distinct user_id) as mau_count
from public.analytics_events
where event_type = 'session_start'
group by 1;

-- Revenue by Tier (Estimated from active subscriptions)
create or replace view public.view_revenue_by_tier as
select
  tier,
  count(*) as subscriber_count,
  case 
    when tier = 'plus' then count(*) * 9.99
    when tier = 'pro' then count(*) * 24.99
    when tier = 'student' then count(*) * 5.00
    else 0
  end as estimated_mrr
from public.subscriptions
where status = 'active'
group by tier;

-- AI Costs and Latency by Model
create or replace view public.view_ai_performance as
select
  model_id,
  avg(latency_ms) as avg_latency,
  avg(ttfb_ms) as avg_ttfb,
  sum(tokens_in) as total_tokens_in,
  sum(tokens_out) as total_tokens_out,
  count(*) as total_requests
from public.ai_sessions
group by model_id;

-- Simulation Volume and Success Rate
create or replace view public.view_simulation_stats as
select
  status,
  count(*) as count,
  avg(duration_ms) as avg_duration
from public.simulations
group by status;
