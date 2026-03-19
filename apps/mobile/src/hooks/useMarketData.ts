import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useSimulationStore } from '../store/simulationStore';

export function useMarketData(symbols: string[]) {
  const updateLivePrice = useSimulationStore((s) => s.updateLivePrice);

  useEffect(() => {
    if (!symbols || symbols.length === 0) return;

    // Filter array to ensure unique valid symbols
    const uniqueSymbols = Array.from(new Set(symbols.filter(s => !!s)));
    if (uniqueSymbols.length === 0) return;

    // Subscribe to Postgres changes on the 'prices' table
    const channel = supabase.channel('realtime:prices')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prices',
          filter: `symbol=in.(${uniqueSymbols.join(',')})`,
        },
        (payload) => {
          const newRow = payload.new as { symbol: string; price: number };
          updateLivePrice(newRow.symbol, newRow.price);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to realtime prices for ${uniqueSymbols.join(', ')}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [symbols, updateLivePrice]);
}
