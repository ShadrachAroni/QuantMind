# QuantMind Technical Documentation — Architecture & Modules

## 1. System Overview

QuantMind is a high-performance quantitative finance monorepo designed for portfolio risk analysis and educational simulation. It follows a decoupled architecture where data ingestion, computation, and user interface are strictly separated.

### Core Stack
- **Frontend**: React Native (Expo) for Mobile, Next.js for Web & Dashboard.
- **Backend**: Supabase (PostgreSQL, Edge Functions, Realtime, Auth).
- **Simulation Engine**: FastAPI (Python) with NumPy/SciPy for Monte Carlo simulations.
- **Infrastructure**: Vercel (Web), Heroku/Railway (Simulation Engine), Supabase Cloud.

---

## 2. Module Documentation

### `apps/mobile` (Expo React Native)
The primary user interface.
- **Features**: Real-time portfolio monitoring, interactive portfolio builder, AI Risk Assistant, and detailed simulation visualizations (Fan Charts, Heatmaps).
- **Core Technology**: TypeScript, Reanimated 3, Skia (Charting), Zustand (State Management), TanStack Query (Data Fetching).

### `apps/simulation` (FastAPI Simulation Engine)
The numerical backbone of the platform.
- **Responsibility**: Computation-only. Runs Monte Carlo simulations using vectorised NumPy operations.
- **Models**:
    - **GBM**: Geometric Brownian Motion (Standard).
    - **Fat-Tails**: Student-t distribution for better extreme scenario modelling.
    - **Jump Diffusion**: Modelling sudden market shocks (Merton model).
- **Integration**: Dequeues jobs from Redis, reads calibration from Supabase, and writes results back to the `simulations` table.

### `supabase/functions` (Edge Functions)
The API Gateway layer. **The only layer allowed to communicate with external financial APIs.**
- **`ai-chat`**: Orchestrates Claude (Anthropic) for conversational risk analysis.
- **`assets-history`**: Fetches historical series (Alpha Vantage/Yahoo) and computes drift (μ) and volatility (σ) for calibration.
- **`market-stream`**: Persistent WebSocket connection (Twelve Data) that normalises price ticks and broadcasts them via Supabase Realtime.
- **`simulate`**: Validates requests, checks user tier entitlements, and enqueues jobs to the simulation worker.

### `packages/shared-types`
Canonical TypeScript interfaces shared across all modules (Mobile, Web, Functions). Ensures type safety for Portfolios, Assets, and Simulation Results.

---

## 3. Data Flow

1. **Search**: Mobile → `assets` Edge Function → Yahoo Finance Search.
2. **Calibration**: Mobile → `assets-history` Edge Function → Alpha Vantage (OHLCV) → Numerical Drift/Vol Compute → Cache in Redis/DB.
3. **Simulation**: Mobile → `simulate` Edge Function → Upstash Redis → FastAPI Worker → Supabase DB → Supabase Realtime → Mobile UI update.
4. **AI Context**: Mobile → `ai-chat` Edge Function → Finnhub (Sentiment) + DB (Portfolio Data) → Anthropic Claude → Mobile UI.
