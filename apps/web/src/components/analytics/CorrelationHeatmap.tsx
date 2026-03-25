'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { Info, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetHistory {
  symbol: string;
  price: number;
  timestamp: string;
}

interface CorrelationHeatmapProps {
  symbols: string[];
  days?: number;
}

export function CorrelationHeatmap({ symbols, days = 30 }: CorrelationHeatmapProps) {
  const [data, setData] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: string, y: string, value: number } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchHistory() {
      if (symbols.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: history, error: fetchError } = await supabase
          .from('asset_history')
          .select('symbol, price, timestamp')
          .in('symbol', symbols)
          .order('timestamp', { ascending: true });

        if (fetchError) throw fetchError;

        // Group by symbol and calculate daily returns
        const grouped: Record<string, number[]> = {};
        symbols.forEach(s => grouped[s] = []);

        const pricesBySymbol: Record<string, number[]> = {};
        history?.forEach((item: AssetHistory) => {
          if (!pricesBySymbol[item.symbol]) pricesBySymbol[item.symbol] = [];
          pricesBySymbol[item.symbol].push(item.price);
        });

        Object.keys(pricesBySymbol).forEach(symbol => {
          const prices = pricesBySymbol[symbol];
          const returns: number[] = [];
          for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
          }
          grouped[symbol] = returns;
        });

        setData(grouped);
      } catch (err: any) {
        console.error('CORRELATION_FETCH_ERROR:', err);
        setError('Connection to data stream interrupted.');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [symbols.join(','), days]);

  const matrix = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    
    symbols.forEach(s1 => {
      result[s1] = {};
      symbols.forEach(s2 => {
        if (s1 === s2) {
          result[s1][s2] = 1;
        } else {
          result[s1][s2] = calculateCorrelation(data[s1] || [], data[s2] || []);
        }
      });
    });

    return result;
  }, [data, symbols]);

  function calculateCorrelation(x: number[], y: number[]) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const muX = x.reduce((a, b) => a + b, 0) / n;
    const muY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - muX;
      const dy = y[i] - muY;
      numerator += dx * dy;
      sumX2 += dx * dx;
      sumY2 += dy * dy;
    }

    const denominator = Math.sqrt(sumX2 * sumY2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  const getColor = (val: number) => {
    if (val > 0.7) return 'bg-[#32D74B]'; // Strong Positive
    if (val > 0.3) return 'bg-[#32D74B]/60'; // Weak Positive
    if (val > -0.3) return 'bg-white/10'; // Neutral
    if (val > -0.7) return 'bg-[#FF453A]/60'; // Weak Negative
    return 'bg-[#FF453A]'; // Strong Negative
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="text-[10px] font-mono text-[#00D9FF] animate-pulse tracking-widest uppercase">Computing_Correlation_Matrix...</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <Layers className="text-[#00D9FF]" size={20} />
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-widest">Diversification_Interplay_Matrix</h3>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-[#32D74B]" />
               <span className="text-[8px] font-mono text-[#848D97] uppercase">Positive</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-[#FF453A]" />
               <span className="text-[8px] font-mono text-[#848D97] uppercase">Negative</span>
            </div>
         </div>
      </div>

      <div className="relative overflow-x-auto no-scrollbar rounded-2xl border border-white/5 bg-black/20 p-4">
         <table className="w-full border-separate border-spacing-2">
            <thead>
               <tr>
                  <th className="w-16"></th>
                  {symbols.map(s => (
                     <th key={s} className="text-[10px] font-mono text-[#848D97] uppercase tracking-widest p-2 h-12 align-bottom">
                        <div className="-rotate-45 origin-bottom-left translate-x-4">{s}</div>
                     </th>
                  ))}
               </tr>
            </thead>
            <tbody>
               {symbols.map(s1 => (
                  <tr key={s1}>
                     <td className="text-[10px] font-mono text-[#848D97] uppercase tracking-widest p-2 text-right font-bold border-r border-white/5">{s1}</td>
                     {symbols.map(s2 => {
                        const val = matrix[s1][s2];
                        return (
                           <td 
                             key={s2} 
                             className="p-1"
                             onMouseEnter={() => setHoveredCell({ x: s1, y: s2, value: val })}
                             onMouseLeave={() => setHoveredCell(null)}
                           >
                              <div className={cn(
                                 "w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-all duration-300 relative group",
                                 getColor(val),
                                 s1 === s2 ? "opacity-30 grayscale" : "hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] cursor-help"
                              )}>
                                 <span className="text-[9px] md:text-xs font-bold text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                    {val.toFixed(2)}
                                 </span>
                              </div>
                           </td>
                        );
                     })}
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {hoveredCell && (
         <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
               <div className={cn("p-2 rounded-lg", getColor(hoveredCell.value))}>
                  {hoveredCell.value > 0 ? <TrendingUp size={16} className="text-white" /> : <TrendingDown size={16} className="text-white" />}
               </div>
               <div>
                  <p className="text-[10px] font-bold text-white uppercase font-mono tracking-widest">{hoveredCell.x} / {hoveredCell.y}</p>
                  <p className="text-[10px] text-[#848D97] uppercase font-mono">Correlation_Coefficient: {hoveredCell.value.toFixed(4)}</p>
               </div>
            </div>
            <div className="text-right">
               <span className={cn(
                  "text-[10px] font-bold uppercase font-mono tracking-widest px-3 py-1 rounded-full",
                  hoveredCell.value > 0.7 ? "bg-[#32D74B]/10 text-[#32D74B]" : 
                  hoveredCell.value < -0.7 ? "bg-[#FF453A]/10 text-[#FF453A]" : 
                  "bg-white/5 text-[#848D97]"
               )}>
                  {hoveredCell.value > 0.7 ? 'Strong_Positive' : 
                   hoveredCell.value < -0.7 ? 'Strong_Negative' : 
                   hoveredCell.value > 0.3 ? 'Moderate_Positive' :
                   hoveredCell.value < -0.3 ? 'Moderate_Negative' : 'Neutral'}
               </span>
            </div>
         </div>
      )}

      <div className="flex items-start gap-4 p-4 bg-[#00D9FF]/5 border border-[#00D9FF]/20 rounded-xl">
         <Info size={16} className="text-[#00D9FF] mt-0.5" />
         <p className="text-[10px] text-[#00D9FF]/80 uppercase font-mono leading-relaxed">
            Institutional Insight: Low or negative correlation (red/neutral) between assets indicates superior diversification, reducing systemic risk within the portfolio node.
         </p>
      </div>
    </div>
  );
}
