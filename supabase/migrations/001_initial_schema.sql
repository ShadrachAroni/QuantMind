-- QuantMind Initial Schema
-- Migration 001 — March 2026

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- ======================================================
-- USER PROFILES
-- Extends Supabase auth.users with app-specific fields
-- ======================================================
create table public.user_profiles (
  id              uuid          primary key references auth.users(id) on delete cascade,
  email           text          not null,
  full_name       text,
  avatar_url      text,
  tier            text          not null default 'free'
                                check (tier in ('free', 'plus', 'pro', 'student')),
  onboarding_completed boolean   not null default false,
  date_of_birth   date,
  analytics_consent boolean     not null default true,
  mfa_enabled     boolean       not null default false,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

-- RLS
alter table public.user_profiles enable row level security;

create policy "Users can read their own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Service role insert (called from auth trigger)
create policy "Service role can insert profiles"
  on public.user_profiles for insert
  with check (true);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ======================================================
-- PORTFOLIOS
-- ======================================================
create table public.portfolios (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          not null references auth.users(id) on delete cascade,
  name            text          not null check (length(name) between 1 and 100),
  description     text          check (length(description) <= 500),
  assets          jsonb         not null default '[]',
  correlation_matrix jsonb,
  total_value     numeric(18,2),
  is_active       boolean       not null default true,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

create index portfolios_user_id_idx on public.portfolios(user_id);
create index portfolios_created_at_idx on public.portfolios(user_id, created_at desc);

alter table public.portfolios enable row level security;

create policy "Users own their portfolios"
  on public.portfolios
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ======================================================
-- SIMULATIONS
-- ======================================================
create table public.simulations (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          not null references auth.users(id) on delete cascade,
  portfolio_id    uuid          references public.portfolios(id) on delete set null,
  params          jsonb         not null,
  params_hash     text          not null,  -- for cache deduplication
  result          jsonb,
  status          text          not null default 'pending'
                                check (status in ('pending', 'running', 'completed', 'failed')),
  model_version   text          not null default '1.0.0',
  num_paths       integer       not null,
  time_horizon_years numeric(4,2) not null,
  error_message   text,
  seed            bigint,
  is_cached       boolean       not null default false,
  cached_from     timestamptz,
  duration_ms     integer,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

create index simulations_user_id_idx on public.simulations(user_id, created_at desc);
create index simulations_portfolio_idx on public.simulations(portfolio_id);
create index simulations_params_hash_idx on public.simulations(params_hash);

alter table public.simulations enable row level security;

create policy "Users own their simulations"
  on public.simulations
  using (auth.uid() = user_id);

create policy "Users can insert their simulations"
  on public.simulations for insert
  with check (auth.uid() = user_id);

-- ======================================================
-- SIMULATION PATHS (compressed binary)
-- ======================================================
create table public.simulation_paths (
  id              uuid          primary key default gen_random_uuid(),
  simulation_id   uuid          not null references public.simulations(id) on delete cascade,
  paths           bytea         not null,    -- compressed Float64Array
  created_at      timestamptz   not null default now()
);

create index simulation_paths_sim_idx on public.simulation_paths(simulation_id);

alter table public.simulation_paths enable row level security;

create policy "Users can read paths for their simulations"
  on public.simulation_paths for select
  using (
    exists (
      select 1 from public.simulations s
      where s.id = simulation_id and s.user_id = auth.uid()
    )
  );

-- ======================================================
-- ANALYTICS EVENTS
-- Write-only from client, read via service role only
-- ======================================================
create table public.analytics_events (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          not null references auth.users(id) on delete cascade,
  event_type      text          not null,
  properties      jsonb         not null default '{}',
  session_id      text,
  app_version     text,
  platform        text,
  created_at      timestamptz   not null default now()
);

create index analytics_events_user_idx on public.analytics_events(user_id, created_at desc);
create index analytics_events_type_idx on public.analytics_events(event_type, created_at desc);

alter table public.analytics_events enable row level security;

create policy "Users can insert their own events"
  on public.analytics_events for insert
  with check (auth.uid() = user_id);
-- No SELECT policy for users — service role only

-- ======================================================
-- SUPPORT TICKETS
-- ======================================================
create table public.support_tickets (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          not null references auth.users(id) on delete cascade,
  subject         text          not null check (length(subject) between 5 and 200),
  status          text          not null default 'open'
                                check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority        text          not null default 'normal'
                                check (priority in ('low', 'normal', 'high', 'urgent')),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

create table public.support_messages (
  id              uuid          primary key default gen_random_uuid(),
  ticket_id       uuid          not null references public.support_tickets(id) on delete cascade,
  user_id         uuid          references auth.users(id),
  is_staff        boolean       not null default false,
  content         text          not null check (length(content) between 1 and 5000),
  created_at      timestamptz   not null default now()
);

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

create policy "Users manage their tickets"
  on public.support_tickets
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users read messages on their tickets"
  on public.support_messages for select
  using (
    exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

create policy "Users insert messages on their tickets"
  on public.support_messages for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

-- ======================================================
-- WEBHOOK EVENTS (RevenueCat)
-- ======================================================
create table public.webhook_events (
  id              uuid          primary key default gen_random_uuid(),
  provider        text          not null check (provider in ('revenuecat', 'stripe')),
  event_id        text          not null unique,  -- provider's event ID
  event_type      text          not null,
  payload         jsonb         not null,
  processed       boolean       not null default false,
  error_message   text,
  created_at      timestamptz   not null default now(),
  processed_at    timestamptz
);

create index webhook_events_event_id_idx on public.webhook_events(event_id);

alter table public.webhook_events enable row level security;
-- No user policies — service role only

-- ======================================================
-- SUBSCRIPTIONS
-- ======================================================
create table public.subscriptions (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          not null references auth.users(id) on delete cascade unique,
  tier            text          not null default 'free'
                                check (tier in ('free', 'plus', 'pro', 'student')),
  status          text          not null default 'active'
                                check (status in ('active', 'canceled', 'past_due', 'trialing')),
  revenuecat_id   text,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean   not null default false,
  trial_ends_at   timestamptz,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read their subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ======================================================
-- FEATURE FLAGS
-- ======================================================
create table public.feature_flags (
  id              uuid          primary key default gen_random_uuid(),
  key             text          not null unique,
  enabled         boolean       not null default false,
  rollout_percent integer       not null default 0 check (rollout_percent between 0 and 100),
  description     text,
  created_by      uuid          references auth.users(id),
  updated_by      uuid          references auth.users(id),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

alter table public.feature_flags enable row level security;
-- No user SELECT policy — internal/admin access only via service role

-- ======================================================
-- ADMIN AUDIT LOG (immutable)
-- ======================================================
create table public.admin_audit_log (
  id              uuid          primary key default gen_random_uuid(),
  admin_user_id   uuid          not null references auth.users(id),
  action_type     text          not null,
  target_resource text          not null,
  target_id       text,
  old_value       jsonb,
  new_value       jsonb,
  reason          text,
  ip_address      inet,
  created_at      timestamptz   not null default now()
);

alter table public.admin_audit_log enable row level security;
-- INSERT only via service role — no UPDATE/DELETE policy (immutable by design)

-- ======================================================
-- PROMPT TEMPLATES
-- ======================================================
create table public.prompt_templates (
  id              uuid          primary key default gen_random_uuid(),
  name            text          not null unique,
  version         integer       not null default 1,
  workflow        text          not null,
  system_prompt   text          not null,
  is_active       boolean       not null default false,
  reviewed_by     uuid          references auth.users(id),
  published_at    timestamptz,
  created_at      timestamptz   not null default now()
);

alter table public.prompt_templates enable row level security;
-- No user SELECT policy — service role only

-- ======================================================
-- HELPER FUNCTIONS
-- ======================================================

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger portfolios_updated_at
  before update on public.portfolios
  for each row execute procedure public.handle_updated_at();

create trigger simulations_updated_at
  before update on public.simulations
  for each row execute procedure public.handle_updated_at();

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute procedure public.handle_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- Data deletion cascade (GDPR / CCPA)
create or replace function public.delete_user_data(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  delete from public.simulations where user_id = p_user_id;
  delete from public.portfolios where user_id = p_user_id;
  delete from public.analytics_events where user_id = p_user_id;
  delete from public.support_tickets where user_id = p_user_id;
  delete from public.subscriptions where user_id = p_user_id;
  -- user_profiles cascades from auth.users
end;
$$;
