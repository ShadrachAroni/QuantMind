-- QuantMind Migration 004 — AI & Analytics Expansion
-- Adding AI Session tracking for cost and latency attribution

create table if not exists public.ai_sessions (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          not null references auth.users(id) on delete cascade,
  model_id        text          not null, -- haiku, sonnet, opus
  task_type       text          not null, -- metric_explanation, weakness_analysis, etc.
  tokens_in       integer       not null default 0,
  tokens_out      integer       not null default 0,
  latency_ms      integer       not null default 0,
  ttfb_ms         integer,
  outcome_feedback integer,      -- -1, 0, 1
  workflow_id     text,         -- to link sub-tasks
  feature_flags   jsonb,        -- active flags during this session
  created_at      timestamptz   not null default now()
);

create index ai_sessions_user_idx on public.ai_sessions(user_id, created_at desc);
create index ai_sessions_workflow_idx on public.ai_sessions(workflow_id);

alter table public.ai_sessions enable row level security;

create policy "Users can read their own AI sessions"
  on public.ai_sessions for select
  using (auth.uid() = user_id);

-- INSERT handled by Edge Function via service role
