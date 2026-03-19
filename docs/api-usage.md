# QuantMind — API Integration Guide

This document explains how each external API is effectively utilized within the QuantMind ecosystem to deliver high-fidelity financial analysis.

## 1. External API Ecosystem

| API | Service | Role in QuantMind | Pattern |
| :--- | :--- | :--- | :--- |
| **Anthropic** | AI Layer | Powers Claude 3.5 Sonnet for the "Risk Assistant" and "Portfolio Doctor". | Edge Function proxy with context injection. |
| **Alpha Vantage**| Market Data | Primary source for historical OHLCV and technical calibration (μ, σ). | 1-hour cached REST calls for daily series. |
| **Twelve Data** | Market Data | Real-time price ticks for live portfolio valuation. | Persistent WebSocket → Supabase Realtime. |
| **Finnhub** | Market Data | Company sentiment and fundamentals for AI context. | On-demand enrichment for AI workflows. |
| **Yahoo Finance**| Market Data | Fallback for ticker search and historical data. | Direct fetch (unofficial API) as failsafe. |
| **Resend** | Comms | System-wide email notifications (Auth/Alerts). | REST API via Edge Functions. |
| **RevenueCat** | Billing | In-app subscription management and tier enforcement. | Webhook integration + HMAC verification. |

---

## 2. Effective Usage Patterns

### AI Context Injection (Anthropic)
Instead of simple chat, we inject structured portfolio data and simulation results into the AI prompt. This allows the "Portfolio Doctor" to give specific, numerically grounded advice rather than generic financial platitudes.
- **Location**: `supabase/functions/ai-chat`

### Numerical Calibration (Alpha Vantage)
We don't just show historical charts. We use the historical series to calculate the **drift** and **volatility** parameters required for the Monte Carlo simulations. This "Market-Implied Calibration" ensures simulations are grounded in recent historical reality.
- **Location**: `supabase/functions/assets-history`

### Persistent Normalisation (Twelve Data)
Different providers return data in various formats. We normalise all incoming ticks into a unified `NormalizedPrice` schema immediately at the edge.
- **Location**: `supabase/functions/market-stream`

### Security Gateway (Stitch / Internal)
All interactions with these APIs are proxied through Supabase Edge Functions. **No API keys or sensitive endpoints are ever exposed to the client application.** 

---

## 3. High-Performance Integration

- **Rate Limiting**: Implemented via Upstash Redis to stay within provider free-tier limits without degrading user experience.
- **Caching**: 1-hour caching for historical data and 24-hour persistence for simulation results ensures speed and cost-efficiency.
- **Asynchronous Execution**: Long-running simulations are offloaded to FastAPI to keep the Deno Edge Functions responsive.
