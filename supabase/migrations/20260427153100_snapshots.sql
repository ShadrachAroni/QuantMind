-- Migration 024 — April 2027
-- Support for MiroFish Scenario Snapshots

create table public.simulation_snapshots (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    title text not null,
    seed_context text not null,
    interactions_log jsonb not null,
    sentiment_shock float not null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.simulation_snapshots enable row level security;

create policy "Users can view their own snapshots"
    on public.simulation_snapshots for select
    using (auth.uid() = user_id);

create policy "Users can insert their own snapshots"
    on public.simulation_snapshots for insert
    with check (auth.uid() = user_id);
