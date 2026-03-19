# Quantmind — Data Ingestion Pipeline
*Version 1.0 · March 2026 · apps/simulation · supabase/functions · React Native*

---

## High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          FINANCIAL DATA SOURCES                         │
│                                                                         │
│  Alpha Vantage              Twelve Data               Finnhub           │
│  Historical OHLCV           Real-Time WebSocket        Sentiment +      │
│  Technical Indicators       Live Price Feed            Fundamentals     │
│  GBM Calibration (μ, σ)     Live VaR Updates           AI Context       │
│                                                                         │
│  Yahoo Finance (yfinance)                                               │
│  Fallback OHLCV · Python-side in FastAPI engine                        │
└──────────────┬──────────────────────┬───────────────────┬──────────────┘
               │                      │                   │
               ▼                      ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS  (Deno)                      │
│              Only layer authorised to call external APIs                │
│                                                                         │
│  assets/              assets-history/        market-stream/   (NEW)    │
│  Ticker search        Historical OHLCV        Twelve Data WS           │
│  Cached 1hr           Cached 1hr              Normalise ticks          │
│  → Yahoo Finance      → Alpha Vantage         → prices table           │
│                         + Yahoo fallback      → Realtime broadcast     │
│                                                                         │
│  ai-chat/  ai-task/                                                     │
│  Finnhub sentiment + fundamentals injected into Claude context.ts      │
└──────────────┬──────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    UPSTASH REDIS  (already in stack)                    │
│                                                                         │
│  · Simulation job queue  (existing)                                     │
│  · Alpha Vantage response cache  60s TTL  (extended)                   │
│  · Finnhub sentiment cache  5min TTL  (extended)                       │
│  · Last-known price per symbol  (extended)                             │
└──────────────┬──────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  SUPABASE POSTGRESQL  (storage layer)                   │
│                                                                         │
│  prices  ← NEW (migration 010)                                          │
│  portfolios · assets · simulations · simulation_paths  ← existing      │
└───────────────────────────┬──────────────────────────────────────────-──┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   SUPABASE REALTIME  (event bus)                        │
│                  postgres_changes on prices table                       │
│                  channel: 'prices', event: INSERT                       │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    REACT NATIVE APP  (Expo)                             │
│                                                                         │
│  marketDataApi.ts          subscribeToPrices()  ← extend existing      │
│  simulationStore.ts        onPriceTick()        ← extend existing      │
│  hooks/useMarketData.ts    subscription lifecycle hook  ← NEW          │
│  TanStack Query            REST + 1hr cache for historical data        │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │  POST /simulate  (fastMode=true, 500 paths)
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               SIMULATE EDGE FUNCTION  (tier check + enqueue)           │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │  enqueue to Redis
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│         FASTAPI SIMULATION SERVICE  (apps/simulation · Railway)         │
│                     Computation only — no API calls                     │
│                                                                         │
│  Dequeues from Redis → reads calibrated μ, σ from DB                   │
│  Runs GBM + Cholesky + Monte Carlo (asyncio + ProcessPoolExecutor)      │
│  Computes VaR, CVaR, Sharpe, Max Drawdown                               │
│  Writes result to simulations table                                     │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
              FanChart · RiskGauge · MetricsGrid re-render
```

---

## 1. Data Sources

### Alpha Vantage — Historical Data & GBM Calibration

**Used by:** `assets-history` Edge Function

Provides historical OHLCV series and built-in technical indicators (RSI, MACD).
The Edge Function uses this data to auto-populate `expected_return` (μ) and
`volatility` (σ) suggestions in the portfolio builder. Responses are cached
1 hour in Supabase to stay within the 25 req/min free tier limit.

### Twelve Data — Real-Time WebSocket Feed

**Used by:** `market-stream` Edge Function (new)

Single persistent WebSocket connection consuming zero REST quota. Price ticks
are normalised inside the Edge Function and written to the `prices` table.
Supabase Realtime then broadcasts each INSERT to all subscribed app clients.
This powers live portfolio valuation and continuous VaR recalculation.

### Finnhub — Sentiment & Fundamentals

**Used by:** `ai-chat` and `ai-task` Edge Functions

Not a price feed. Finnhub sentiment scores and company fundamentals are
fetched during AI context assembly inside `packages/ai/src/context.ts`.
They enrich the Claude prompt with qualitative signals — for example, a
high negative sentiment score on a held asset causes Portfolio Doctor to
weight tail-risk scenarios more heavily. Cached 5 minutes in Redis per ticker.

### Yahoo Finance (yfinance)

**Used by:** `assets-history` Edge Function (existing) and FastAPI engine (fallback)

Currently the primary source for historical OHLCV in the `assets-history`
Edge Function. Alpha Vantage is the production upgrade path. Also used
Python-side in `apps/simulation/` as a fallback when calibration data is
unavailable from the primary source.

---

## 2. Ingestion Layer

Ingestion is deliberately split across two layers. **Supabase Edge Functions**
own all external API communication. **FastAPI** owns all computation.
Neither layer crosses into the other's responsibility.

### Layer A — Supabase Edge Functions

Path: `supabase/functions/`

```
supabase/functions/
  ├── assets/              # existing
  │   └── index.ts         # GET /assets/search?q=
  │                        # Ticker search → Yahoo Finance → cached 1hr
  │                        # Returns: { ticker, name, exchange, assetClass }
  │
  ├── assets-history/      # existing
  │   └── index.ts         # GET /assets/history?symbol=AAPL&period=2y
  │                        # Fetches OHLCV → computes μ, σ → cached 1hr
  │                        # Returns: { symbol, expectedReturn, volatility, prices[] }
  │
  └── market-stream/       # NEW — add in migration 010
      └── index.ts         # Connects Twelve Data WebSocket
                           # Normalises ticks → writes to prices table
                           # Broadcasts via Supabase Realtime channel 'prices'
```

### Layer B — FastAPI Simulation Service

Path: `apps/simulation/app/`

FastAPI's sole responsibility is computation. It never calls external APIs
and never writes directly to Supabase. All DB interaction is mediated by
Edge Functions. FastAPI reads calibration data (μ, σ) that was already
stored by the `assets-history` Edge Function.

```
apps/simulation/app/
  ├── main.py              # FastAPI app factory, CORS, lifespan, startup checks
  ├── config.py            # Pydantic Settings — env vars, tier limits, model params
  ├── dependencies.py      # Auth (SIMULATION_SECRET_KEY), rate limiting, tier gate
  ├── routers/
  │   ├── simulate.py      # POST /simulate
  │   ├── scenarios.py     # POST /scenarios — stress test shocks
  │   ├── goals.py         # POST /goals — retirement / education goal probability
  │   ├── optimize.py      # POST /optimize — allocation optimisation
  │   └── health.py        # GET /health
  ├── models/
  │   ├── portfolio.py     # PortfolioInput, AssetInput, CorrelationMatrix
  │   ├── simulation.py    # SimulationParams, SimulationResult, PercentilePaths
  │   ├── metrics.py       # RiskMetrics, GoalResult, OptimizationResult
  │   └── scenario.py      # ShockParams, BuiltInScenario enum
  └── engine/
      ├── gbm.py           # GBM path generator — vectorised NumPy
      ├── cholesky.py      # Correlated random normals via Cholesky decomposition
      ├── monte_carlo.py   # Multi-asset simulation orchestrator
      ├── risk_metrics.py  # VaR, CVaR, Sharpe, Sortino, max drawdown
      ├── diversification.py
      ├── scenarios.py     # apply_shock() — 2008 / COVID / crypto / custom
      ├── goals.py
      ├── optimizer.py
      └── advanced/
          ├── jump_diffusion.py
          ├── fat_tails.py
          └── regime_switching.py
```

> **Rule:** Never add `services/`, `workers/`, or `scheduler.py` inside
> `apps/simulation/`. That directory is computation-only. API fetching
> belongs exclusively in `supabase/functions/`.

---

## 3. Scheduler

Periodic data refresh is handled by **Supabase Edge Function cron triggers**,
configured in `supabase/config.toml`. No APScheduler, Celery, or separate
scheduler process is needed — doing so would introduce a second scheduler
on Railway alongside the existing Upstash Redis job queue.

```toml
# supabase/config.toml

[functions.assets-history]
# No cron — triggered on-demand by mobile app via marketDataApi.ts

[functions.market-stream]
schedule = "*/1 * * * *"   # poll fallback every 1 min if WebSocket reconnects
                           # primary mode is persistent WebSocket, not polling
```

Simulation jobs use the existing queue flow — no changes needed:

```
simulate Edge Function
  → validates SimulationRequest + checks tier entitlement (path limit)
  → enqueues job to Upstash Redis
  → FastAPI worker dequeues via asyncio + ProcessPoolExecutor
  → runs engine, writes result to simulations table
  → simulate-status Edge Function polls for progress and streams partialResult
```

---

## 4. Processing & Normalisation

All normalisation happens inside the Edge Function that fetches the data,
before writing to Supabase. The canonical `NormalizedPrice` shape is defined
in `@quantmind/shared-types` so both Edge Functions and the mobile app
use the same contract.

### Shared Type

```typescript
// packages/shared-types/src/market.ts

export interface NormalizedPrice {
  symbol:    string;
  price:     number;
  open?:     number;
  high?:     number;
  low?:      number;
  volume?:   number;
  timestamp: string;   // ISO 8601 UTC — always UTC, never local
  source:    'alpha_vantage' | 'twelve_data' | 'yahoo' | 'finnhub';
}
```

### market-stream Edge Function (Twelve Data)

```typescript
// supabase/functions/market-stream/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { NormalizedPrice } from '@quantmind/shared-types';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!   // service role — write access
);

function normalizeTwelveDataTick(raw: Record<string, unknown>): NormalizedPrice {
  return {
    symbol:    String(raw.symbol),
    price:     parseFloat(String(raw.price)),
    volume:    raw.volume ? Number(raw.volume) : undefined,
    timestamp: new Date(Number(raw.timestamp) * 1000).toISOString(),
    source:    'twelve_data',
  };
}

async function persistTick(tick: NormalizedPrice): Promise<void> {
  const { error } = await supabase.from('prices').insert(tick);
  if (error) console.error('prices insert failed:', error.message);
  // Supabase Realtime broadcasts the INSERT automatically —
  // no manual push required.
}

// WebSocket connection lifecycle managed by Deno runtime
const ws = new WebSocket(
  `wss://ws.twelvedata.com/v1/quotes/price?apikey=${Deno.env.get('TWELVE_DATA_API_KEY')}`
);

ws.onmessage = async (event) => {
  const raw = JSON.parse(event.data);
  if (raw.event !== 'price') return;   // ignore heartbeats, subscribe acks
  const tick = normalizeTwelveDataTick(raw);
  await persistTick(tick);
};
```

### assets-history Edge Function (Alpha Vantage)

```typescript
// supabase/functions/assets-history/index.ts  — extend existing function

import { NormalizedPrice } from '@quantmind/shared-types';

function normalizeAlphaVantageOHLCV(
  raw: Record<string, Record<string, string>>,
  symbol: string
): NormalizedPrice[] {
  return Object.entries(raw['Time Series (Daily)']).map(([date, bar]) => ({
    symbol,
    price:     parseFloat(bar['4. close']),
    open:      parseFloat(bar['1. open']),
    high:      parseFloat(bar['2. high']),
    low:       parseFloat(bar['3. low']),
    volume:    parseInt(bar['5. volume'], 10),
    timestamp: new Date(date).toISOString(),
    source:    'alpha_vantage',
  }));
}
```

---

## 5. Storage Layer

### Existing Tables — Do Not Redefine

```sql
-- migration 001_initial_schema.sql  (already applied)
portfolios       (id, user_id, name, assets[], correlation_matrix, created_at)
assets           (id, portfolio_id, ticker, weight, expected_return, volatility)
simulations      (id, user_id, portfolio_id, params_hash, result JSONB, created_at)
simulation_paths (id, simulation_id, paths BYTEA)   -- compressed Float64Array
```

> The `assets` table is **portfolio-scoped**. It stores a user's position
> weights and calibrated μ/σ for a specific portfolio. It is not a market
> data table. Do not conflate it with the new `prices` table.

### New Table — prices

Add as a new migration file following Quantmind's sequential naming convention:

```
supabase/migrations/010_prices_table.sql
```

```sql
-- 010_prices_table.sql

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

-- Schedule pruning daily via pg_cron (add to Supabase dashboard)
-- select cron.schedule('prune-prices', '0 2 * * *', 'select prune_old_prices()');

-- RLS: authenticated users can read prices; only service role can write
alter table public.prices enable row level security;

create policy "authenticated read prices"
  on public.prices
  for select
  to authenticated
  using (true);

-- No INSERT/UPDATE/DELETE policy for authenticated users.
-- All writes come from Edge Functions using SUPABASE_SERVICE_ROLE_KEY.
```

---

## 6. Realtime Layer

Supabase Realtime automatically broadcasts `postgres_changes` events when
rows are inserted into `prices`. No manual push mechanism is needed — the
`market-stream` Edge Function writes a row, Realtime fires the event.

### Mobile Subscription

Extend the existing `marketDataApi.ts` service:

```typescript
// apps/mobile/src/services/marketDataApi.ts  (add to existing file)

import { supabase } from './supabase';
import { NormalizedPrice } from '@quantmind/shared-types';

/**
 * Subscribe to live price ticks for the given symbols.
 * Returns the channel subscription — call .unsubscribe() on unmount.
 */
export function subscribeToPrices(
  symbols: string[],
  onTick: (price: NormalizedPrice) => void
) {
  return supabase
    .channel('prices')
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'prices',
        filter: `symbol=in.(${symbols.join(',')})`,
      },
      (payload) => onTick(payload.new as NormalizedPrice)
    )
    .subscribe();
}
```

### Lifecycle Hook

```typescript
// apps/mobile/src/hooks/useMarketData.ts  (new file)

import { useEffect } from 'react';
import { subscribeToPrices } from '../services/marketDataApi';
import { useSimulationStore }  from '../store/simulationStore';

export function useMarketData(symbols: string[]) {
  const onPriceTick = useSimulationStore((s) => s.onPriceTick);

  useEffect(() => {
    if (!symbols.length) return;
    const channel = subscribeToPrices(symbols, onPriceTick);
    return () => { channel.unsubscribe(); };
  }, [symbols.join(',')]);
}
```

---

## 7. React Native Integration

All integration points hook into **existing** files. No new packages, no new
services, no new deployment targets.

```
apps/mobile/src/
  services/
    marketDataApi.ts       ← add: subscribeToPrices()          (extend existing)
  store/
    simulationStore.ts     ← add: onPriceTick()                (extend existing)
  hooks/
    useMarketData.ts       ← new file (subscription lifecycle)
  screens/simulation/
    SimulationResultsScreen.tsx  ← mount useMarketData(tickers) while screen focused
```

### simulationStore Extension

```typescript
// apps/mobile/src/store/simulationStore.ts  (add to existing Zustand slice)

onPriceTick: (tick: NormalizedPrice) => {
  const { results, activePortfolioId } = get();
  if (!results || !activePortfolioId) return;

  // Debounce: ignore ticks if a simulation is already running
  if (get().status === 'running' || get().status === 'streaming') return;

  // Trigger a fast incremental simulation (500 paths) using updated spot prices
  // Full 10,000-path simulation is reserved for explicit user-triggered runs
  get().runSimulation({
    portfolioId: activePortfolioId,
    fastMode:    true,     // 500 paths, no streaming, returns synchronously
    spotPrices:  { [tick.symbol]: tick.price },
  });
},
```

**Data fetching split:**

| Data Type | Transport | Cache |
|---|---|---|
| Ticker search | REST → `assets` Edge Function | TanStack Query, 1hr |
| Historical OHLCV / μ σ | REST → `assets-history` Edge Function | TanStack Query, 1hr |
| Live price ticks | Supabase Realtime WebSocket | In-memory (simulationStore) |
| Simulation results | REST → `simulate-status` Edge Function | Supabase + simulationStore |

---

## 8. Caching Strategy

Upstash Redis is already deployed and wired into both the Edge Functions layer
(`UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN` in env vars) and the FastAPI
service. Extend its use as follows — no new infrastructure required.

| Cache Key Pattern | Value | TTL | Layer |
|---|---|---|---|
| `price:last:{SYMBOL}` | Latest `NormalizedPrice` JSON | 60s | Edge Function |
| `av:ohlcv:{SYMBOL}:{PERIOD}` | Alpha Vantage raw response | 1hr | Edge Function |
| `fh:sentiment:{SYMBOL}` | Finnhub sentiment score | 5min | Edge Function |
| `sim:result:{PARAMS_HASH}` | Simulation result JSONB | 1hr | FastAPI |

The simulation result cache key (`params_hash`) is already implemented in the
`simulations` table schema — Redis simply moves the TTL-based deduplication
upstream before the DB write.

---

## 9. Rate Limiting Strategy

| Provider | Free Limit | Strategy |
|---|---|---|
| Alpha Vantage | 25 req/min | 1hr Supabase cache in `assets-history` fn. Redis deduplicates concurrent requests within the same 60s window. |
| Twelve Data | 800 req/day REST / 1 WS connection | Use WebSocket — one persistent connection costs zero REST quota. REST only for historical backfill. |
| Finnhub | 60 req/min | Fetch on AI context assembly only (not every tick). 5min Redis cache per ticker. |
| Yahoo Finance | Unofficial / no hard limit | Python-side fallback in FastAPI engine. No caching needed for infrequent fallback use. |

---

## 10. End-to-End Live VaR Flow

This is the complete path from a market price movement to an updated risk
metric on the user's screen:

```
① Twelve Data WebSocket emits price tick for AAPL

② market-stream Edge Function
     normalizesTwelveDataTick(raw) → NormalizedPrice
     supabase.from('prices').insert(tick)          ← service role write
     updates Redis key  price:last:AAPL

③ Supabase Realtime
     detects INSERT on prices table
     broadcasts to all subscribed channels matching filter: symbol=in.(AAPL,...)

④ React Native App  (SimulationResultsScreen is open)
     useMarketData(['AAPL', 'MSFT', 'GOOGL'])  hook is mounted
     subscribeToPrices() receives payload
     calls simulationStore.onPriceTick(tick)

⑤ simulationStore
     status is 'done' → proceed
     calls runSimulation({ portfolioId, fastMode: true, spotPrices: {AAPL: 213.45} })

⑥ simulate Edge Function
     validates SimulationRequest
     checks tier entitlement (path limit: fastMode uses 500 paths, within Free tier)
     enqueues job to Upstash Redis → returns { jobId, estimatedMs: 800 }

⑦ FastAPI worker  (asyncio dequeues job)
     reads portfolio weights + calibrated μ,σ from assets table
     overrides AAPL spot price with tick.price
     runs GBM + Cholesky → 500 paths
     computes VaR (95%), CVaR, updated portfolio value
     writes SimulationResult to simulations table

⑧ simulate-status Edge Function  (polled every 500ms by simulationApi.ts)
     status: 'done' → returns full SimulationResult

⑨ simulationStore.results updated
     FanChart re-renders with new percentile paths
     RiskGauge needle animates to new risk score
     VaR figure updates with live badge indicator
```

---

## 11. New Files to Add

These are the only net-new files. Every other change is an extension of an
existing file.

```
supabase/
  functions/
    market-stream/
      index.ts              ← Twelve Data WebSocket → normalise → prices table
  migrations/
    010_prices_table.sql    ← prices table + index + RLS + prune function

apps/
  mobile/src/
    hooks/
      useMarketData.ts      ← subscription lifecycle (mount/unmount)
    services/
      marketDataApi.ts      ← extend: + subscribeToPrices()
    store/
      simulationStore.ts    ← extend: + onPriceTick()

packages/
  shared-types/src/
    market.ts               ← NormalizedPrice interface (if not already present)
```

**Env vars already defined — no new entries needed:**
- `TWELVE_DATA_API_KEY` ← added in Project Structure v2.0
- `ALPHA_VANTAGE_API_KEY` ← added in Project Structure v2.0
- `FINNHUB_API_KEY` ← added in Project Structure v2.0
- `UPSTASH_REDIS_URL` / `UPSTASH_REDIS_TOKEN` ← existing

---

## Key Design Principles

**Edge Functions are the only API gateway.**
The mobile app and FastAPI service never hold third-party financial API keys.
All external calls are proxied, cached, and normalised by Edge Functions before
anything downstream sees the data.

**FastAPI is computation-only.**
The simulation microservice reads calibrated parameters from the database and
runs the engine. It does not poll APIs, does not schedule jobs, and does not
write to Supabase directly. Separation of ingestion from simulation is a hard
architectural rule.

**Normalise at the edge, early.**
Every provider returns data in a different shape and timezone convention.
`NormalizedPrice` is established once in `@quantmind/shared-types` and applied
immediately inside each Edge Function before any persistence or broadcast.

**Redis deduplicates; Supabase persists.**
Redis holds short-lived caches and the simulation job queue. Supabase holds the
durable record. Never treat Redis as the source of truth for price history.

**Schema changes are always migrations.**
Any modification to the database — including the new `prices` table — must be
expressed as a new `supabase/migrations/NNN_description.sql` file and applied
via `supabase db push`. No in-place edits to existing migrations.

**fastMode for live updates; full simulation for user-triggered runs.**
Continuous VaR recalculation uses 500 paths to stay within free-tier entitlements
and return in under 1 second. The full 10,000-path simulation is reserved for
explicit user-triggered runs from `SimulationConfigScreen`.
