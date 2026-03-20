# Supabase Secrets Configuration Guide

This document lists all the secrets required for the QuantMind Edge Functions and provides instructions on how to set them.

## 1. AI Integration
- **`GEMINI_API_KEY`**: Key from [Google AI Studio](https://aistudio.google.com/).
  > [!NOTE]
  > QuantMind has migrated from Anthropic to Gemini 1.5 Flash for cost-efficiency and performance.

## 2. Infrastructure & Security
- **`SIMULATION_SECRET_KEY`**: `simulation_secret_key`
  > [!IMPORTANT]
  > This must match the `SIMULATION_SECRET_KEY` in the Python simulation service environment variables (Render/Railway).
- **`SIMULATION_SERVICE_URL`**: The public URL of the deployed simulation backend (e.g., `https://quantmind-sim.onrender.com`).
- **`UPSTASH_REDIS_URL`**: Redis URL for rate limiting and job queuing.
- **`UPSTASH_REDIS_TOKEN`**: Redis Token for rate limiting and job queuing.

## 3. Financial Data & Payments
- **`RESEND_API_KEY`**: For institutional email notifications.
- **`ALPHA_VANTAGE_API_KEY`**: Market data calibration and historical OHLCV.
- **`TWELVE_DATA_API_KEY`**: Secondary market data source.
- **`FINNHUB_API_KEY`**: Used for sentiment analysis and news correlation.
- **`REVENUECAT_WEBHOOK_SECRET`**: To verify and sync subscription statuses.

## How to Set Secrets
Use the Supabase CLI to set these secrets for your remote project:

```bash
# Set a single secret
supabase secrets set KEY=VALUE

# Set multiple secrets at once
supabase secrets set GEMINI_API_KEY=AIza... RESEND_API_KEY=re_...
```

To list existing secrets:
```bash
supabase secrets list
```
