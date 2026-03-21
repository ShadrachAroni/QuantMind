// QuantMind Edge Function: assets
// Ticker search via Yahoo Finance — cached 1hr in Supabase KV
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { rateLimit, rateLimitResponse } from '../_shared/rateLimiter.ts';

interface AssetSearchResult {
  ticker: string;
  name: string;
  exchange: string;
  asset_class: string;
  currency?: string;
}

export async function searchYahoo(query: string): Promise<AssetSearchResult[]> {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; QuantmindBot/1.0)',
    },
  });

  if (!response.ok) return [];

  const data = await response.json();
  const quotes = data.quotes || [];

  return quotes
    .filter((q: any) => q.symbol && q.shortname)
    .map((q: any) => ({
      ticker: q.symbol.toUpperCase(),
      name: q.shortname || q.longname || q.symbol,
      exchange: q.exchDisp || q.exchange || 'Unknown',
      asset_class: classifyAsset(q.quoteType),
      currency: q.currency,
    }));
}

export function classifyAsset(quoteType: string): string {
  const map: Record<string, string> = {
    EQUITY: 'stocks',
    ETF: 'stocks',
    MUTUALFUND: 'stocks',
    BOND: 'bonds',
    CRYPTOCURRENCY: 'crypto',
    CURRENCY: 'other',
    COMMODITY: 'commodities',
    FUTURE: 'other',
    INDEX: 'other',
    OPTION: 'other',
  };
  return map[quoteType?.toUpperCase()] || 'other';
}

if (import.meta.main) {
  serve(async (req: Request) => {
    const origin = req.headers.get('Origin');
    const corsRes = handleCors(req);
    if (corsRes) return corsRes;

    try {
      const user = await requireAuth(req);

      // Rate limit: 30 req/min per user
      const limit = await rateLimit(`assets:${user.id}`, 30, 60);
      if (!limit.allowed) return rateLimitResponse(limit);

      const url = new URL(req.url);
      const query = url.searchParams.get('q');
      if (!query || query.trim().length < 1) {
        return new Response(JSON.stringify({ error: 'Query parameter q is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }

      if (query.length > 50) {
        return new Response(JSON.stringify({ error: 'Query too long' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }

      const results = await searchYahoo(query.trim());

      return new Response(JSON.stringify({ data: results }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
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

      console.error('[assets] Error:', message);
      return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
  });
}
