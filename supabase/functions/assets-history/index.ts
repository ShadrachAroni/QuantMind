// QuantMind Edge Function: assets-history
// Historical OHLCV + GBM calibration (mu, sigma) 
// Sources: Alpha Vantage (primary) → Yahoo Finance (fallback)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { rateLimit, rateLimitResponse } from '../_shared/rateLimiter.ts';

interface NormalizedPrice {
  symbol: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  timestamp: string;
  source: 'alpha_vantage' | 'twelve_data' | 'yahoo' | 'finnhub';
}

interface HistoricalResponse {
  symbol: string;
  prices: NormalizedPrice[];
  expected_return: number;   // annualised mu
  volatility: number;        // annualised sigma
  period_start: string;
  period_end: string;
  source: string;
}

function normalizeAlphaVantage(raw: any, symbol: string): NormalizedPrice[] {
  const series = raw['Time Series (Daily)'];
  if (!series) return [];
  
  return Object.entries(series)
    .slice(0, 500) // cap to ~2 years
    .map(([date, bar]: [string, any]) => ({
      symbol: symbol.toUpperCase(),
      price: parseFloat(bar['4. close']),
      open: parseFloat(bar['1. open']),
      high: parseFloat(bar['2. high']),
      low: parseFloat(bar['3. low']),
      volume: parseInt(bar['5. volume'], 10),
      timestamp: new Date(date).toISOString(),
      source: 'alpha_vantage' as const,
    }))
    .filter(p => !isNaN(p.price) && p.price > 0);
}

function computeGBMParams(prices: NormalizedPrice[]): { mu: number; sigma: number } {
  if (prices.length < 2) return { mu: 0.07, sigma: 0.15 };

  // Sort chronologically
  const sorted = [...prices].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Daily log returns
  const logReturns: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const r = Math.log(sorted[i].price / sorted[i-1].price);
    if (isFinite(r)) logReturns.push(r);
  }

  if (logReturns.length === 0) return { mu: 0.07, sigma: 0.15 };

  // Annualise: 252 trading days
  const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
  const variance = logReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / logReturns.length;
  const sigma_daily = Math.sqrt(variance);
  const mu_daily = mean;

  const sigma = sigma_daily * Math.sqrt(252);
  const mu = (mu_daily + 0.5 * variance) * 252; // GBM drift adjustment

  // Clamp to plausible ranges per validation rules
  return {
    mu: Math.max(-1, Math.min(10, mu)),
    sigma: Math.max(0.01, Math.min(5, sigma)),
  };
}

async function fetchAlphaVantage(symbol: string, apiKey: string): Promise<NormalizedPrice[]> {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Alpha Vantage request failed');
  const data = await res.json();
  if (data['Note']) throw new Error('Alpha Vantage rate limit hit');
  return normalizeAlphaVantage(data, symbol);
}

async function fetchYahooFallback(symbol: string): Promise<NormalizedPrice[]> {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 2 * 365 * 24 * 3600;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${start}&period2=${end}`;
  
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error('Yahoo Finance request failed');
  
  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error('No data from Yahoo');

  const timestamps: number[] = result.timestamp || [];
  const closes: number[] = result.indicators?.quote?.[0]?.close || [];
  const opens: number[] = result.indicators?.quote?.[0]?.open || [];
  const highs: number[] = result.indicators?.quote?.[0]?.high || [];
  const lows: number[] = result.indicators?.quote?.[0]?.low || [];
  const volumes: number[] = result.indicators?.quote?.[0]?.volume || [];

  return timestamps
    .map((ts, i) => ({
      symbol: symbol.toUpperCase(),
      price: closes[i],
      open: opens[i],
      high: highs[i],
      low: lows[i],
      volume: volumes[i],
      timestamp: new Date(ts * 1000).toISOString(),
      source: 'yahoo' as const,
    }))
    .filter(p => p.price && !isNaN(p.price) && p.price > 0);
}

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const user = await requireAuth(req);

    const limit = await rateLimit(`assets-history:${user.id}`, 20, 60);
    if (!limit.allowed) return rateLimitResponse(limit);

    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol')?.toUpperCase();
    
    if (!symbol || !/^[A-Z0-9.\-]{1,10}$/.test(symbol)) {
      return new Response(JSON.stringify({ error: 'Valid symbol parameter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    let prices: NormalizedPrice[] = [];
    let source = 'yahoo';

    try {
      if (alphaVantageKey) {
        prices = await fetchAlphaVantage(symbol, alphaVantageKey);
        source = 'alpha_vantage';
      }
    } catch {
      // Fall through to Yahoo
    }

    if (prices.length === 0) {
      prices = await fetchYahooFallback(symbol);
      source = 'yahoo';
    }

    if (prices.length < 10) {
      return new Response(JSON.stringify({ error: `No sufficient historical data found for ${symbol}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const { mu, sigma } = computeGBMParams(prices);
    const sorted = prices.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const response: HistoricalResponse = {
      symbol,
      prices: sorted,
      expected_return: mu,
      volatility: sigma,
      period_start: sorted[0].timestamp,
      period_end: sorted[sorted.length - 1].timestamp,
      source,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'X-Data-Source': source,
        'X-Data-Timestamp': new Date().toISOString(),
        ...corsHeaders(origin),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Unauthorized') || message.includes('Missing')) {
      return new Response(JSON.stringify({ error: 'Your session has expired. Please sign in again.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
    console.error('[assets-history] Error:', message);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
});
