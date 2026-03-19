-- QuantMind Migration 009 — OTA Update Management

create table if not exists public.ota_releases (
  id              uuid          primary key default gen_random_uuid(),
  channel         text          not null, -- production, staging, preview
  bundle_hash     text          not null,
  rollout_percent integer       not null default 0 check (rollout_percent between 0 and 100),
  status          text          not null default 'draft' 
                                check (status in ('draft', 'deploying', 'active', 'paused', 'reverted')),
  description     text,
  created_by      uuid          references auth.users(id),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

create table if not exists public.ota_rollout_events (
  id              uuid          primary key default gen_random_uuid(),
  release_id      uuid          not null references public.ota_releases(id) on delete cascade,
  event_type      text          not null, -- step_up, pause, crash_spike
  details         jsonb,
  created_at      timestamptz   not null default now()
);

alter table public.ota_releases enable row level security;
alter table public.ota_rollout_events enable row level security;
-- Service role only for management
