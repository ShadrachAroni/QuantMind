-- QuantMind Migration 008 — Feature Flag Auditing

create table if not exists public.flag_audit_log (
  id              uuid          primary key default gen_random_uuid(),
  flag_id         uuid          not null references public.feature_flags(id) on delete cascade,
  actor_id        uuid          not null references auth.users(id),
  action          text          not null, -- created, updated, deleted, toggled
  change          jsonb         not null, -- {old: ..., new: ...}
  reason          text,
  created_at      timestamptz   not null default now()
);

create index flag_audit_log_flag_idx on public.flag_audit_log(flag_id);

alter table public.flag_audit_log enable row level security;
-- Service role only
