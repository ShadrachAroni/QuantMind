-- QuantMind Migration 010 — Prices Table
-- Real-time price ticks from Twelve Data WebSocket

create table public.prices (
  id         uuid          primary key default gen_random_uuid(),
  symbol     text          not null,
  price      numeric(18,6) not null,
  open       numeric(18,6),
  high       numeric(18,6),
  low        numeric(18,6),
  volume     bigint,
  timestamp  timestamptz   not null,
  source     text          not null
             check (source in ('alpha_vantage','twelve_data','yahoo','finnhub')),
  created_at timestamptz   default now()
);

-- Primary access pattern: latest prices for a given symbol
create index prices_symbol_ts_idx
  on public.prices (symbol, timestamp desc);

-- Auto-purge ticks older than 30 days to control table growth
create or replace function prune_old_prices()
returns void language sql as $$
  delete from public.prices
  where timestamp < now() - interval '30 days';
$$;

-- RLS: authenticated users can read prices; only service role can write
alter table public.prices enable row level security;

create policy "authenticated read prices"
  on public.prices
  for select
  to authenticated
  using (true);

-- No INSERT/UPDATE/DELETE policy for authenticated users.
-- All writes come from Edge Functions using SUPABASE_SERVICE_ROLE_KEY.
