// QuantMind Edge Function: market-stream
// Ingests real-time price ticks from Finnhub via WebSocket (Better symbol support)
// Implements ASTERIX-inspired "Radar-Sweep" batching

// @ts-ignore: Deno global recognized at runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// API Keys from Secrets
// @ts-ignore: Deno global recognized at runtime
const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');
// @ts-ignore: Deno global recognized at runtime
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// @ts-ignore: Deno global recognized at runtime
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface PriceTick {
  symbol: string;
  price: number;
  volume: number | null;
  change_24h: number | null;
  timestamp: string;
  source: string;
}

const SYMBOL_MAP: Record<string, string> = {
  'BTC/USD': 'BINANCE:BTCUSDT',
  'ETH/USD': 'BINANCE:ETHUSDT',
  'SOL/USD': 'BINANCE:SOLUSDT',
  'ADA/USD': 'BINANCE:ADAUSDT',
  'SPX': 'SPY',
  'NDX': 'QQQ',
  'COMP': 'ONEQ'
};

const REVERSE_MAP: Record<string, string> = Object.entries(SYMBOL_MAP).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {} as Record<string, string>);

// State for Radar-Sweep Batching
let batch: PriceTick[] = [];
let activeSymbols: Set<string> = new Set(['AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 'NVDA', 'SPY', 'GLD', 'QQQ', 'BTC/USD', 'ETH/USD', 'SOL/USD']);
let dailyOpens: Record<string, number> = {};
const BATCH_INTERVAL_MS = 1000; // 1 second "radar sweep"

async function fetchDailyQuotes() {
  if (!FINNHUB_API_KEY) return;
  console.log('[ASTERIX] Fetching daily quotes for 24h change baseline...');
  
  for (const symbol of activeSymbols) {
    try {
      const finnhubSymbol = SYMBOL_MAP[symbol] || symbol;
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`);
      if (res.ok) {
        const data = await res.json();
        // Use 'o' (open) or 'pc' (previous close) as baseline for 24h change
        const openPrice = data.o || data.pc;
        if (openPrice) {
          dailyOpens[symbol] = openPrice;
          console.log(`[ASTERIX] Baseline for ${symbol}: ${openPrice}`);
          
          // Also persist baseline to DB to ensure continuity across restarts
          await supabase.from('prices').upsert({ symbol, open: openPrice }, { onConflict: 'symbol' });
        }
      }
      // Small sleep to avoid Finnhub rate limits during initial burst
      await new Promise(r => setTimeout(r, 100));
    } catch (e) {
      console.error(`[ASTERIX] Quote Fetch Error (${symbol}):`, e);
    }
  }
}

async function syncSymbols() {
  console.log('[ASTERIX] Syncing active symbols and registry baseline...');
  const { data } = await supabase.from('prices').select('symbol, open');
  if (data) {
    data.forEach((p: { symbol: string, open: number | null }) => {
      activeSymbols.add(p.symbol);
      if (p.open && !dailyOpens[p.symbol]) dailyOpens[p.symbol] = p.open;
    });
  }
}

function flushBatch() {
  if (batch.length === 0) return;
  
  // Dedup in batch (keep latest for each symbol)
  const dedupedBySymbol = new Map<string, any>();
  batch.forEach(tick => {
    dedupedBySymbol.set(tick.symbol, {
      symbol: tick.symbol,
      price: tick.price,
      volume: tick.volume,
      change_24h: tick.change_24h,
      open: dailyOpens[tick.symbol] || null,
      timestamp: tick.timestamp,
      source: 'finnhub'
    });
  });
  
  const finalTicks = Array.from(dedupedBySymbol.values());
  
  console.log(`[ASTERIX] Flushing ${finalTicks.length} ticks. First tick sample:`, JSON.stringify(finalTicks[0]));

  supabase
    .from('prices')
    .upsert(finalTicks, { onConflict: 'symbol' })
    .select()
    .then(({ data, error }: { data: any; error: any }) => {
      if (error) {
        console.error('[ASTERIX] Flash Error:', JSON.stringify(error));
      } else {
        console.log(`[ASTERIX] Radar Sweep Complete: ${finalTicks.length} ticks sent. Data returned count: ${data ? data.length : 'null'}`);
      }
    });
    
  batch = [];
}

async function startStream() {
  if (!FINNHUB_API_KEY) {
    console.error('[ASTERIX] CRITICAL: Missing FINNHUB_API_KEY. Market stream cannot start.');
    return;
  }

  // Fetch baselines before starting stream
  await fetchDailyQuotes();

  console.log('[ASTERIX] Initializing connection to Finnhub...');
  console.log('[ASTERIX] Target Supabase Project:', SUPABASE_URL);
  const socket = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);

  socket.onopen = () => {
    console.log('[ASTERIX] Market Stream Connected (Finnhub).');
    activeSymbols.forEach(symbol => {
      const finnhubSymbol = SYMBOL_MAP[symbol] || symbol;
      socket.send(JSON.stringify({'type': 'subscribe', 'symbol': finnhubSymbol}));
    });
  };

  socket.onmessage = (event: MessageEvent) => {
    try {
      if (!event.data || typeof event.data !== 'string') return;
      
      const data = JSON.parse(event.data);
      
      // Handle Finnhub keep-alive/pings
      if (data.type === 'ping') {
        // console.log('[ASTERIX] Heartbeat');
        return;
      }

      if (data.type === 'trade') {
        data.data.forEach((trade: any) => {
          const internalSymbol = REVERSE_MAP[trade.s] || trade.s;
          const openPrice = dailyOpens[internalSymbol];
          
          let changePct = 0;
          if (openPrice && openPrice > 0) {
            changePct = parseFloat(((trade.p - openPrice) / openPrice * 100).toFixed(2));
          }
          
          const tick: PriceTick = {
            symbol: internalSymbol,
            price: parseFloat(trade.p.toFixed(2)), // Enforce 2 decimal places for price
            volume: trade.v,
            change_24h: changePct,
            timestamp: new Date(trade.t).toISOString(),
            source: 'finnhub'
          };
          batch.push(tick);
        });
      }
    } catch (e) {
      // Log errors but don't crash the loop
      if (e instanceof Error) {
        console.error(`[ASTERIX] Socket Msg Processing Error (${event.data.slice(0, 50)}...):`, e.message);
      }
    }
  };

  socket.onerror = (err) => {
    console.error('[ASTERIX] WebSocket Error:', err);
  };

  socket.onclose = () => {
    console.log('[ASTERIX] Stream Closed. Reconnecting in 5s...');
    setTimeout(startStream, 5000);
  };

  // Radar sweep timers
  setInterval(flushBatch, BATCH_INTERVAL_MS);
  setInterval(syncSymbols, 60000); // Re-sync symbols every minute
  setInterval(fetchDailyQuotes, 3600000); // Re-fetch baselines every hour
}

// Initial sync and stream start
syncSymbols().then(() => {
  startStream();
});

// @ts-ignore: Deno global recognized at runtime
Deno.serve(async (_req: Request) => {
  return new Response(JSON.stringify({ 
    status: "streaming", 
    architecture: "asterix-inspired",
    active_symbols: Array.from(activeSymbols),
    connected: !!FINNHUB_API_KEY
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
