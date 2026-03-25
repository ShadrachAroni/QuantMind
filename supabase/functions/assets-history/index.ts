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

export function normalizeAlphaVantage(raw: any, symbol: string): NormalizedPrice[] {
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

export function computeGBMParams(prices: NormalizedPrice[]): { mu: number; sigma: number } {
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

export async function fetchAlphaVantage(symbol: string, apiKey: string): Promise<NormalizedPrice[]> {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Alpha Vantage request failed');
  const data = await res.json();
  if (data['Note']) throw new Error('Alpha Vantage rate limit hit');
  return normalizeAlphaVantage(data, symbol);
}

export async function fetchYahooFallback(symbol: string): Promise<NormalizedPrice[]> {
  // Map internal symbols to Yahoo-friendly symbols
  const YAHOO_MAP: Record<string, string> = {
    'BTC/USD': 'BTC-USD',
    'ETH/USD': 'ETH-USD',
    'SOL/USD': 'SOL-USD',
    'ADA/USD': 'ADA-USD',
    'DOT/USD': 'DOT-USD',
    'SPX': '^GSPC',
    'NDX': '^NDX'
  };

  const yahooSymbol = YAHOO_MAP[symbol] || symbol;
  const end = Math.floor(Date.now() / 1000);
  const start = end - 2 * 365 * 24 * 3600;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&period1=${start}&period2=${end}`;
  
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  
  if (!res.ok) {
    console.warn(`[assets-history] Yahoo fallback failed for ${yahooSymbol}: ${res.status}`);
    throw new Error(`Yahoo Finance request failed for ${yahooSymbol}`);
  }
  
  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No data from Yahoo for ${yahooSymbol}`);

  const timestamps: number[] = result.timestamp || [];
  const closes: number[] = result.indicators?.quote?.[0]?.close || [];
  const opens: number[] = result.indicators?.quote?.[0]?.open || [];
  const highs: number[] = result.indicators?.quote?.[0]?.high || [];
  const lows: number[] = result.indicators?.quote?.[0]?.low || [];
  const volumes: number[] = result.indicators?.quote?.[0]?.volume || [];

  return timestamps
    .map((ts, i) => ({
      symbol: symbol.toUpperCase(), // Return original requested symbol
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol')?.toUpperCase();
    
    if (!symbol || !/^[A-Z0-9.\-]{1,10}$/.test(symbol)) {
      return new Response(JSON.stringify({ error: 'Valid symbol parameter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // 1. Try internal registry first (check for data freshness)
    const { data: cached } = await supabase
      .from('asset_history')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false }); // Get latest first

    let prices: NormalizedPrice[] = [];
    let source = 'registry';
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

    if (cached && cached.length > 50) {
      const latestTimestamp = new Date(cached[0].timestamp).getTime();
      const isFresh = (Date.now() - latestTimestamp) < CACHE_TTL_MS;
      
      if (isFresh) {
        prices = cached.map(p => ({
          symbol: p.symbol,
          price: Number(p.price),
          timestamp: p.timestamp,
          source: p.source as any
        }));
      } else {
        console.log(`[assets-history] Cache stale for ${symbol}, refetching...`);
      }
    }

    if (prices.length === 0) {
      // 2. Fetch from external if not in registry or stale
      const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
      try {
        if (alphaVantageKey) {
          prices = await fetchAlphaVantage(symbol, alphaVantageKey);
          source = 'alpha_vantage';
        }
      } catch {
        // Fall through
      }

      if (prices.length === 0) {
        prices = await fetchYahooFallback(symbol);
        source = 'yahoo';
      }

      // 3. Persist to registry for future requests
      if (prices.length > 0) {
         const rows = prices.map(p => ({
            symbol: p.symbol,
            price: p.price,
            timestamp: p.timestamp,
            source: p.source
         }));
         
         await supabase.from('asset_history').upsert(rows, { onConflict: 'symbol,timestamp' });
         console.log(`[INGEST] Persisted ${rows.length} records for ${symbol}`);
      }
    }

    if (prices.length < 5) {
      return new Response(JSON.stringify({ error: `Insufficient data for ${symbol}` }), {
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
        'X-Data-Source': source,
        ...corsHeaders(origin),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[assets-history] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
});
