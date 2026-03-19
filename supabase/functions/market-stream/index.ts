// QuantMind Edge Function: market-stream
// Ingests real-time price ticks from Twelve Data via WebSocket
// Implements ASTERIX-inspired "Radar-Sweep" batching

// @ts-ignore: Deno global recognized at runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore: Deno global recognized at runtime
const TWELVE_DATA_API_KEY = Deno.env.get('TWELVE_DATA_API_KEY');
// @ts-ignore: Deno global recognized at runtime
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// @ts-ignore: Deno global recognized at runtime
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface PriceTick {
  symbol: string;
  price: number;
  volume: number | null;
  timestamp: string;
  source: string;
}

// State for Radar-Sweep Batching
let batch: PriceTick[] = [];
const BATCH_INTERVAL_MS = 1000; // 1 second "radar sweep"

function flushBatch() {
  if (batch.length === 0) return;
  
  console.log(`[ASTERIX] Radar Sweep: Flushing ${batch.length} ticks to 'prices' table.`);
  
  // Dedup in batch (keep latest for each symbol)
  const dedupedBySymbol = new Map<string, PriceTick>();
  batch.forEach(tick => {
    dedupedBySymbol.set(tick.symbol, tick);
  });
  
  const finalTicks = Array.from(dedupedBySymbol.values());
  
  supabase
    .from('prices')
    .upsert(finalTicks, { onConflict: 'symbol,timestamp' })
    .then(({ error }: { error: any }) => {
      if (error) console.error('[ASTERIX] Flash Error:', error);
    });
    
  batch = [];
}

async function startStream() {
  if (!TWELVE_DATA_API_KEY) {
    console.error('Missing TWELVE_DATA_API_KEY');
    return;
  }

  const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${TWELVE_DATA_API_KEY}`);

  ws.onopen = () => {
    console.log('[ASTERIX] Market Stream Connected.');
    ws.send(JSON.stringify({
      "action": "subscribe",
      "params": { "symbols": "AAPL,MSFT,TSLA,BTC/USD,ETH/USD" }
    }));
  };

  ws.onmessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    
    if (data.event === 'price') {
      const tick: PriceTick = {
        symbol: data.symbol,
        price: data.price,
        volume: data.day_volume || null,
        timestamp: new Date(data.timestamp * 1000).toISOString(),
        source: 'twelve_data'
      };
      
      batch.push(tick);
    }
  };

  ws.onerror = (e: Event) => {
    console.error('[ASTERIX] WebSocket Error:', e);
  };

  ws.onclose = () => {
    console.log('[ASTERIX] Stream Closed. Reconnecting in 5s...');
    setTimeout(startStream, 5000);
  };

  // Start radar sweep timer
  setInterval(flushBatch, BATCH_INTERVAL_MS);
}

// Start the stream
startStream();

// @ts-ignore: Deno global recognized at runtime
Deno.serve(async (_req: Request) => {
  return new Response(JSON.stringify({ status: "streaming", architecture: "asterix-inspired" }), {
    headers: { "Content-Type": "application/json" },
  });
});
