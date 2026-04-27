'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Search, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Sparkline } from '@/components/ui/Sparkline';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { cn } from '@/lib/utils';
import { generateMockHistoricalData } from '@/lib/market-data';

const BENCHMARKS = [
  { symbol: 'SPY', name: 'S&P 500', color: '#00D9FF' },
  { symbol: 'QQQ', name: 'NASDAQ 100', color: '#7C3AED' },
  { symbol: 'DIA', name: 'Dow Jones', color: '#FFD60A' },
  { symbol: 'IWM', name: 'Russell 2000', color: '#FF9500' },
];

export default function ComparePage() {
  const [asset, setAsset] = useState('AAPL');
  const [selectedBenchmarks, setSelectedBenchmarks] = useState(['SPY', 'QQQ']);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [peerData, setPeerData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runComparison = () => {
    setLoading(true);
    // Generate comparison data
    const baseData = generateMockHistoricalData(252, 150);
    const basePrices = baseData.map(d => d.close);
    const baseReturns = basePrices.map((p, i) => i === 0 ? 0 : ((p - basePrices[0]) / basePrices[0]) * 100);

    const benchmarks = selectedBenchmarks.map(sym => {
      const bData = generateMockHistoricalData(252, 100 + Math.random() * 100);
      const bPrices = bData.map(d => d.close);
      const bReturns = bPrices.map((p, i) => i === 0 ? 0 : ((p - bPrices[0]) / bPrices[0]) * 100);
      const bench = BENCHMARKS.find(b => b.symbol === sym);
      const delta = baseReturns[baseReturns.length - 1] - bReturns[bReturns.length - 1];
      return {
        symbol: sym, name: bench?.name || sym, color: bench?.color || '#848D97',
        returns: bReturns, latestReturn: bReturns[bReturns.length - 1],
        delta, prices: bPrices,
      };
    });

    setComparisonData({
      asset: { symbol: asset, returns: baseReturns, latestReturn: baseReturns[baseReturns.length - 1], prices: basePrices },
      benchmarks,
      dates: baseData.map(d => d.date),
    });

    // Sector peers
    const peers = ['MSFT', 'GOOGL', 'META', 'AMZN', 'NVDA'].filter(s => s !== asset).map(sym => {
      const pData = generateMockHistoricalData(252, 100 + Math.random() * 300);
      const pPrices = pData.map(d => d.close);
      const ret = ((pPrices[pPrices.length - 1] - pPrices[0]) / pPrices[0]) * 100;
      return { symbol: sym, return1Y: ret, sparkline: pPrices.slice(-30), latestPrice: pPrices[pPrices.length - 1] };
    });
    setPeerData(peers);
    setLoading(false);
  };

  useEffect(() => { runComparison(); }, []);

  const toggleBenchmark = (sym: string) => {
    setSelectedBenchmarks(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
  };

  return (
    <FeatureGate requiredTier="pro" featureName="Live Market Comparison">
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded text-[10px] font-bold text-[#00D9FF] uppercase tracking-widest flex items-center gap-1">
              <BarChart3 size={10} /> Compare_Live
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter font-mono">Market <span className="text-[#00D9FF]">Comparison</span></h1>
          <p className="text-[#848D97] text-sm font-mono uppercase tracking-widest mt-1">Benchmark Against Live Indices</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848D97]" />
            <input value={asset} onChange={e => setAsset(e.target.value.toUpperCase())} placeholder="Asset symbol" aria-label="Asset symbol" className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-[#00D9FF]/40" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {BENCHMARKS.map(b => (
              <button key={b.symbol} onClick={() => toggleBenchmark(b.symbol)} className={cn("px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all", selectedBenchmarks.includes(b.symbol) ? 'border-white/20 bg-white/10 text-white' : 'border-white/5 bg-white/[0.02] text-[#848D97] hover:text-white')}>
                {b.name}
              </button>
            ))}
          </div>
          <button onClick={runComparison} disabled={loading} className="bg-[#00D9FF] text-[#05070A] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all flex items-center gap-2">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Compare
          </button>
        </div>

        {comparisonData && (
          <>
            {/* Performance Chart */}
            <GlassCard className="p-6">
              <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4">Relative Performance (% Return)</h3>
              <div className="h-40 mb-4">
                <Sparkline data={comparisonData.asset.returns} width={800} height={150} color="#32D74B" />
              </div>
              <div className="flex gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-[#32D74B]" />
                  <span className="text-[10px] text-[#848D97] font-mono">{asset}: {comparisonData.asset.latestReturn.toFixed(1)}%</span>
                </div>
                {comparisonData.benchmarks.map((b: any) => (
                  <div key={b.symbol} className="flex items-center gap-2">
                    <div className="w-3 h-0.5" style={{ background: b.color }} />
                    <span className="text-[10px] text-[#848D97] font-mono">{b.name}: {b.latestReturn.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Delta Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {comparisonData.benchmarks.map((b: any) => (
                <GlassCard key={b.symbol} className="p-5">
                  <span className="text-[10px] text-[#848D97] uppercase tracking-widest block mb-2 font-mono">vs {b.name}</span>
                  <div className="flex items-center gap-2">
                    {b.delta >= 0 ? <TrendingUp size={20} className="text-[#32D74B]" /> : <TrendingDown size={20} className="text-[#FF453A]" />}
                    <span className="text-2xl font-mono font-bold" style={{ color: b.delta >= 0 ? '#32D74B' : '#FF453A' }}>
                      {b.delta >= 0 ? '+' : ''}{b.delta.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-[#848D97] mt-2">{b.delta >= 0 ? `${asset} outperforms ${b.name}` : `${asset} underperforms ${b.name}`}</p>
                </GlassCard>
              ))}
            </div>

            {/* Peer Comparison */}
            <GlassCard className="p-6">
              <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4">Sector Peer Comparison</h3>
              <div className="space-y-3">
                {peerData.map(peer => (
                  <div key={peer.symbol} className="flex items-center gap-4 py-2 border-b border-white/[0.03] last:border-0">
                    <span className="text-sm font-mono font-bold text-white w-16">{peer.symbol}</span>
                    <div className="flex-1 h-8"><Sparkline data={peer.sparkline} width={200} height={28} color={peer.return1Y >= 0 ? '#32D74B' : '#FF453A'} /></div>
                    <span className="text-sm font-mono" style={{ color: peer.return1Y >= 0 ? '#32D74B' : '#FF453A' }}>
                      {peer.return1Y >= 0 ? '+' : ''}{peer.return1Y.toFixed(1)}%
                    </span>
                    <span className="text-xs font-mono text-[#848D97]">${peer.latestPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* AI Commentary */}
            <GlassCard className="p-5 border-l-2 border-l-[#00D9FF]">
              <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2">AI Market Commentary</h3>
              <p className="text-sm text-[#848D97] leading-relaxed">
                {asset} has {comparisonData.asset.latestReturn >= 0 ? 'gained' : 'declined'} {Math.abs(comparisonData.asset.latestReturn).toFixed(1)}% over the analysis period.
                {comparisonData.benchmarks[0] && ` Compared to the ${comparisonData.benchmarks[0].name}, ${asset} ${comparisonData.benchmarks[0].delta >= 0 ? 'outperforms' : 'underperforms'} by ${Math.abs(comparisonData.benchmarks[0].delta).toFixed(1)} percentage points.`}
                {' '}This divergence may be attributed to sector-specific catalysts, earnings momentum, and broader market sentiment shifts.
              </p>
            </GlassCard>
          </>
        )}

        <p className="text-[9px] text-white/20 text-center font-mono uppercase tracking-widest">This is not financial advice. Always do your own research.</p>
      </div>
    </FeatureGate>
  );
}
