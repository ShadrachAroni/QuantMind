'use client';

import React, { useState, useEffect } from 'react';
import { Database, Layers, Grid3X3, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Sparkline } from '@/components/ui/Sparkline';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { cn } from '@/lib/utils';
import { generateMockHistoricalData } from '@/lib/market-data';

const TIME_RANGES = ['1D', '1W', '1M', '3M', '1Y', 'Custom'];
const SECTORS = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrials', 'Materials', 'Real Estate', 'Utilities', 'Telecom'];

export default function BigDataPage() {
  const [timeRange, setTimeRange] = useState('1M');
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [correlationMatrix, setCorrelationMatrix] = useState<any[]>([]);
  const [sectorData, setSectorData] = useState<any[]>([]);

  useEffect(() => {
    // Generate realistic demo data
    const sectors = SECTORS.map(name => {
      const perf = (Math.random() - 0.45) * 20;
      const vol = Math.random() * 30 + 10;
      const flow = (Math.random() - 0.5) * 1000;
      return { name, performance: perf, volatility: vol, institutionalFlow: flow, sparkline: generateMockHistoricalData(30, 100).map(d => d.close) };
    });
    setSectorData(sectors);

    // Heatmap
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'XOM', 'LLY', 'COST', 'ABBV', 'MRK', 'PEP'];
    setHeatmapData(symbols.map(s => ({ symbol: s, change: (Math.random() - 0.45) * 10, volume: Math.random() * 100 })));

    // Correlation
    const corSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META'];
    const matrix = corSymbols.map(a => ({ symbol: a, correlations: corSymbols.map(b => ({ symbol: b, value: a === b ? 1 : 0.3 + Math.random() * 0.6 })) }));
    setCorrelationMatrix(matrix);
  }, [timeRange]);

  const getHeatColor = (v: number) => {
    if (v > 3) return 'bg-[#32D74B]';
    if (v > 1) return 'bg-[#32D74B]/60';
    if (v > 0) return 'bg-[#32D74B]/30';
    if (v > -1) return 'bg-[#FF453A]/30';
    if (v > -3) return 'bg-[#FF453A]/60';
    return 'bg-[#FF453A]';
  };

  const getCorColor = (v: number) => {
    if (v > 0.8) return 'bg-[#00D9FF]';
    if (v > 0.6) return 'bg-[#00D9FF]/70';
    if (v > 0.4) return 'bg-[#00D9FF]/40';
    return 'bg-[#00D9FF]/20';
  };

  return (
    <FeatureGate requiredTier="pro" featureName="Big Data Analytics">
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="px-2 py-0.5 bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded text-[10px] font-bold text-[#00D9FF] uppercase tracking-widest flex items-center gap-1">
                <Database size={10} /> BigData_Core
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter font-mono">Big Data <span className="text-[#00D9FF]">Analytics</span></h1>
            <p className="text-[#848D97] text-sm font-mono uppercase tracking-widest mt-1">Large-Scale Market Intelligence</p>
          </div>

          {/* Time Range */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1">
            {TIME_RANGES.map(tr => (
              <button key={tr} onClick={() => setTimeRange(tr)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", timeRange === tr ? 'bg-[#00D9FF] text-[#05070A]' : 'text-[#848D97] hover:text-white')}>
                {tr}
              </button>
            ))}
          </div>
        </div>

        {/* Sector Performance */}
        <GlassCard className="p-6">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4 flex items-center gap-2"><Layers size={14} /> Sector Rotation</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {sectorData.map(sector => (
              <div key={sector.name} className={cn("p-3 rounded-xl border transition-all hover:bg-white/[0.03]", sector.performance >= 0 ? 'border-[#32D74B]/10' : 'border-[#FF453A]/10')}>
                <span className="text-[10px] text-[#848D97] block mb-1">{sector.name}</span>
                <span className="text-lg font-mono font-bold" style={{ color: sector.performance >= 0 ? '#32D74B' : '#FF453A' }}>
                  {sector.performance >= 0 ? '+' : ''}{sector.performance.toFixed(1)}%
                </span>
                <div className="mt-2 h-8"><Sparkline data={sector.sparkline} width={120} height={30} color={sector.performance >= 0 ? '#32D74B' : '#FF453A'} /></div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Heatmap */}
        <GlassCard className="p-6">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4 flex items-center gap-2"><Grid3X3 size={14} /> Market Heatmap</h3>
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-1.5">
            {heatmapData.map(stock => (
              <div key={stock.symbol} className={cn("rounded-lg p-2 text-center transition-all hover:scale-105 cursor-default", getHeatColor(stock.change))}>
                <span className="text-[10px] font-mono font-bold text-white block">{stock.symbol}</span>
                <span className="text-[9px] font-mono text-white/80">{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Correlation Matrix */}
        <GlassCard className="p-6 overflow-x-auto">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4 flex items-center gap-2"><Activity size={14} /> Correlation Matrix</h3>
          <div className="min-w-[500px]">
            <div className="flex gap-1 mb-1">
              <div className="w-12" />
              {correlationMatrix.map(row => (
                <div key={row.symbol} className="flex-1 text-center text-[9px] font-mono text-[#848D97]">{row.symbol}</div>
              ))}
            </div>
            {correlationMatrix.map(row => (
              <div key={row.symbol} className="flex gap-1 mb-1">
                <div className="w-12 text-[9px] font-mono text-[#848D97] flex items-center">{row.symbol}</div>
                {row.correlations.map((cor: any) => (
                  <div key={cor.symbol} className={cn("flex-1 rounded h-8 flex items-center justify-center", getCorColor(cor.value))}>
                    <span className="text-[8px] font-mono text-white/80">{cor.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Institutional Flow */}
        <GlassCard className="p-6">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4">Institutional Flow Analysis</h3>
          <div className="space-y-3">
            {sectorData.sort((a, b) => Math.abs(b.institutionalFlow) - Math.abs(a.institutionalFlow)).slice(0, 6).map(s => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-xs text-[#848D97] w-24">{s.name}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden relative">
                  <div className={cn("h-full rounded-full absolute", s.institutionalFlow >= 0 ? 'bg-[#32D74B] left-1/2' : 'bg-[#FF453A] right-1/2')}
                    style={{ width: `${Math.min(Math.abs(s.institutionalFlow) / 10, 50)}%` }} />
                </div>
                <span className="text-xs font-mono w-20 text-right" style={{ color: s.institutionalFlow >= 0 ? '#32D74B' : '#FF453A' }}>
                  {s.institutionalFlow >= 0 ? '+' : ''}{s.institutionalFlow.toFixed(0)}M
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <p className="text-[9px] text-white/20 text-center font-mono uppercase tracking-widest">This is not financial advice. Always do your own research.</p>
      </div>
    </FeatureGate>
  );
}
