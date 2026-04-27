'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, Star, Zap, TrendingUp, TrendingDown, BookMarked } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Sparkline } from '@/components/ui/Sparkline';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { cn } from '@/lib/utils';

const PRESETS = [
  { id: 'high_growth', label: 'High Growth', icon: TrendingUp, color: '#32D74B' },
  { id: 'value_picks', label: 'Value Picks', icon: Star, color: '#00D9FF' },
  { id: 'momentum', label: 'Momentum', icon: Zap, color: '#FFD60A' },
  { id: 'dividend_kings', label: 'Dividend Kings', icon: BookMarked, color: '#7C3AED' },
  { id: 'oversold', label: 'Oversold', icon: TrendingDown, color: '#FF453A' },
];

export default function ScreenerPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState('');
  const [sortField, setSortField] = useState('matchScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [meta, setMeta] = useState({ totalScreened: 0, totalMatched: 0 });

  const runScreener = async (preset?: string) => {
    setLoading(true);
    if (preset) setActivePreset(preset);
    try {
      const res = await fetch('/api/screener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: preset || activePreset || 'high_growth' }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setMeta({ totalScreened: data.totalScreened, totalMatched: data.totalMatched });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const sorted = [...results].sort((a, b) => {
    const va = a[sortField], vb = b[sortField];
    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  return (
    <FeatureGate requiredTier="pro" featureName="AI Stock Screener">
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-[#D4A017]/10 border border-[#D4A017]/20 rounded text-[10px] font-bold text-[#D4A017] uppercase tracking-widest flex items-center gap-1">
              <SlidersHorizontal size={10} /> Screener_AI
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter font-mono">Stock <span className="text-[#D4A017]">Screener</span></h1>
          <p className="text-[#848D97] text-sm font-mono uppercase tracking-widest mt-1">AI-Powered Fundamental & Technical Screening</p>
        </div>

        {/* Preset Templates */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => runScreener(p.id)} className={cn("group p-4 rounded-xl border transition-all text-left", activePreset === p.id ? `bg-[${p.color}]/10 border-[${p.color}]/30` : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]')}>
              <p.icon size={20} style={{ color: p.color }} className="mb-2" />
              <span className="text-xs font-bold text-white block">{p.label}</span>
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" /></div>
        ) : results.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#848D97] font-mono">{meta.totalMatched} matches from {meta.totalScreened} screened</span>
            </div>

            <GlassCard className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/5">
                    {[
                      { key: 'symbol', label: 'Symbol' }, { key: 'price', label: 'Price' },
                      { key: 'change', label: '1W %' }, { key: 'pe', label: 'P/E' },
                      { key: 'rsi', label: 'RSI' }, { key: 'volume', label: 'Avg Vol' },
                      { key: 'matchScore', label: 'Score' }, { key: 'chart', label: '30D' },
                    ].map(h => (
                      <th key={h.key} onClick={() => h.key !== 'chart' && toggleSort(h.key)} className={cn("px-4 py-3 text-[10px] text-[#848D97] uppercase tracking-widest font-mono", h.key !== 'chart' && 'cursor-pointer hover:text-white')}>
                        {h.label} {sortField === h.key && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(stock => (
                    <tr key={stock.symbol} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3">
                        <div><span className="font-mono font-bold text-white text-sm">{stock.symbol}</span></div>
                        <div className="text-[10px] text-[#848D97]">{stock.sector}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-white">${stock.price?.toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: stock.change >= 0 ? '#32D74B' : '#FF453A' }}>
                        {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-[#848D97]">{stock.pe > 0 ? stock.pe.toFixed(1) : '—'}</td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: stock.rsi < 30 ? '#32D74B' : stock.rsi > 70 ? '#FF453A' : '#FFD60A' }}>
                        {stock.rsi?.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-[#848D97]">{(stock.volume / 1000000).toFixed(1)}M</td>
                      <td className="px-4 py-3">
                        <div className="w-8 h-4 bg-[#00D9FF]/10 rounded-full flex items-center justify-center">
                          <span className="text-[8px] font-bold text-[#00D9FF]">{stock.matchScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Sparkline data={stock.sparkline || []} width={80} height={24} color={stock.change >= 0 ? '#32D74B' : '#FF453A'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>

            {/* AI Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sorted.slice(0, 4).map(stock => (
                <GlassCard key={stock.symbol} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono font-bold text-white text-sm">{stock.symbol}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00D9FF]/10 text-[#00D9FF] font-bold">AI INSIGHT</span>
                  </div>
                  <p className="text-xs text-[#848D97] leading-relaxed">{stock.aiSummary}</p>
                </GlassCard>
              ))}
            </div>
          </>
        ) : !loading && (
          <GlassCard className="p-16 text-center">
            <SlidersHorizontal size={40} className="text-[#848D97] mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-bold text-white mb-2">Select a Screener Preset</h3>
            <p className="text-sm text-[#848D97]">Choose from pre-built strategies above to begin screening</p>
          </GlassCard>
        )}

        <p className="text-[9px] text-white/20 text-center font-mono uppercase tracking-widest">This is not financial advice. Always do your own research.</p>
      </div>
    </FeatureGate>
  );
}
