# QuantMind — Environment Variable Guide

This guide explains how to configure the environment variables required for the QuantMind monorepo and where to obtain the necessary credentials.

## 1. Global Setup (Root `.env`)
The root `.env` file centralises common variables used by multiple applications.

| Variable | Description | Source |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Your Supabase Project URL | [Supabase Dashboard](https://supabase.com/dashboard) |
| `SUPABASE_ANON_KEY` | Public access key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY`| Admin access key (Server-only!) | Supabase Dashboard > Settings > API |
| `ANTHROPIC_API_KEY` | Key for Claude AI | [Anthropic Console](https://console.anthropic.com/) |
| `RESEND_API_KEY` | Key for email services | [Resend Dashboard](https://resend.com/overview) |

---

## 2. Service-Specific Keys

### Supabase Edge Functions (`supabase/functions/.env`)
These keys must be set in the Supabase Dashboard as "Secrets" for deployment.
- **`UPSTASH_REDIS_URL` / `TOKEN`**: Get from [Upstash](https://upstash.com/) (Redis for Job Queues).
- **`ALPHA_VANTAGE_API_KEY`**: Get a free key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key).
- **`TWELVE_DATA_API_KEY`**: Get a free key from [Twelve Data](https://twelvedata.com/pricing).
- **`FINNHUB_API_KEY`**: Get a free key from [Finnhub](https://finnhub.io/dashboard).
- **`REVENUECAT_WEBHOOK_SECRET`**: Get from [RevenueCat](https://app.revenuecat.com/) Project Settings.

### Simulation Service (`apps/simulation/.env`)
- **`SIMULATION_SECRET_KEY`**: A secure UUID used to authenticate requests between Supabase and the FastAPI engine. Generate one yourself.
- **`SIMULATION_SERVICE_URL`**: The public URL where your FastAPI engine is deployed (e.g., Railway/Heroku).

### Dashboard (`apps/dashboard/.env`)
- **`ADMIN_PASSWORD`**: Set a strong password for accessing the management portal.

---

## 3. How to Obtain API Keys

### Financial Data
1. **Alpha Vantage**: Mandatory for historical OHLCV data. Visit their site and register for a free tier key.
2. **Twelve Data**: Optional but recommended for real-time price ticks via WebSocket.
3. **Finnhub**: Used by the AI Assistant to gather market sentiment and company news.

### Backend Infrastructure
1. **Supabase**: Create a project at [supabase.com](https://supabase.com). You will need the URL, Anon Key, and Service Role Key.
2. **Upstash**: Create a Redis database. Copy the REST URL and Token. This powers our job queuing and rate limiting.

### AI Engine (Claude)
1. **Anthropic**: Create an account at [anthropic.com](https://anthropic.com). Create a new API Key. QuantMind specifically uses **Claude 3.5 Sonnet** and **Opus**.

### Payments (RevenueCat)
1. **RevenueCat**: Create an app and set up your products. Copy the Webhook Secret to allow the backend to sync subscription statuses.

---

## 4. Local Development Warning
> [!WARNING]
> Never commit `.env` files to Git. Always copy `.env.example` to `.env` and fill in your local values.
