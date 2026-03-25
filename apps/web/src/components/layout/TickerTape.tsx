'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface Price {
  symbol: string;
  price: number;
  change_24h?: number;
}

export function TickerTape() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Initial fetch of latest prices
    const fetchInitialPrices = async () => {
      try {
        const { data, error } = await supabase
          .from('prices')
          .select('symbol, price, change_24h')
          .order('timestamp', { ascending: false });
        
        if (error) {
          console.error('[TickerTape] Fetch Error:', error);
        } else if (data) {
          // Dedup symbols (keep latest)
          const seen = new Set();
          const latestPrices = data.filter(p => {
            if (seen.has(p.symbol)) return false;
            seen.add(p.symbol);
            return true;
          });
          setPrices(latestPrices.slice(0, 15));
        }
      } catch (err) {
        console.error('[TickerTape] Unexpected Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialPrices();

    // Hybrid Polling Fallback (Every 30 seconds to ensure high-fidelity)
    const pollInterval = setInterval(() => {
      console.log('[TickerTape] Periodic telemetry re-sync...');
      fetchInitialPrices();
    }, 30000);

    // Realtime subscription to prices table
    const channel = supabase
      .channel('public:prices')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prices' }, (payload) => {
        console.log('[TickerTape] Realtime INSERT:', payload.new);
        const newPrice = payload.new as Price;
        setPrices(prev => {
          const index = prev.findIndex(p => p.symbol === newPrice.symbol);
          if (index > -1) {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...newPrice };
            return updated;
          }
          return [newPrice, ...prev].slice(0, 15);
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'prices' }, (payload) => {
        console.log('[TickerTape] Realtime UPDATE:', payload.new);
        const updatedPrice = payload.new as Price;
        setPrices(prev => prev.map(p => p.symbol === updatedPrice.symbol ? { ...p, ...updatedPrice } : p));
      })
      .subscribe((status) => {
        console.log('[TickerTape] Realtime Status:', status);
      });

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="w-full bg-[#12121A]/50 backdrop-blur-sm border-y border-white/5 py-1 px-4 overflow-hidden select-none h-7 flex items-center">
      {isLoading && prices.length === 0 ? (
        <div className="w-full flex items-center justify-center gap-2 text-[8px] font-bold text-[#00D9FF] uppercase tracking-[0.4em] animate-pulse font-mono">
           Initializing_Market_Telemetry_Relay...
        </div>
      ) : prices.length === 0 ? (
        <div className="w-full flex items-center justify-center gap-2 text-[8px] font-bold text-[#848D97] uppercase tracking-[0.4em] font-mono">
           Establishing_Institutional_Data_Link...
        </div>
      ) : (
        <div className="flex items-center gap-12 animate-scroll-ticker">
          {[...prices, ...prices].map((p, i) => (
            <div key={i} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[10px] font-bold text-[#848D97] tracking-wider uppercase">{p.symbol}</span>
              <span className="text-[10px] font-mono text-white">{p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              {p.change_24h !== undefined && (
                <span className={`text-[9px] font-bold ${p.change_24h >= 0 ? 'text-[#32D74B]' : 'text-[#FF453A]'}`}>
                  {p.change_24h >= 0 ? '+' : ''}{p.change_24h}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes scroll-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-ticker {
          animation: scroll-ticker 30s linear infinite;
        }
        .animate-scroll-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
