'use client';

import React, { useState } from 'react';
import { FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Search, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Sparkline } from '@/components/ui/Sparkline';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { cn } from '@/lib/utils';

export default function EarningsPage() {
  const [data, setData] = useState<any>(null);
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const res = await fetch('/api/earnings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.toUpperCase() }),
      });
      setData(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <FeatureGate requiredTier="pro" featureName="Earnings Interpreter">
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest flex items-center gap-1">
              <FileText size={10} /> Earnings_AI
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter font-mono">Earnings <span className="text-[#7C3AED]">Interpreter</span></h1>
          <p className="text-[#848D97] text-sm font-mono uppercase tracking-widest mt-1">AI-Powered Earnings Report Analysis</p>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848D97]" />
            <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && analyze()} placeholder="Enter ticker (e.g. AAPL)" aria-label="Ticker symbol" className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-[#7C3AED]/40" />
          </div>
          <button onClick={analyze} disabled={loading || !symbol} className="bg-[#7C3AED] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#6D28D9] transition-all disabled:opacity-40">
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {data && !data.error && (
          <>
            {/* Summary Card */}
            <GlassCard className="p-6 border-l-2 border-l-[#7C3AED]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-mono font-bold text-white">{data.symbol}</span>
                <span className="text-sm text-[#848D97]">— {data.companyName}</span>
                <span className="text-[9px] px-2 py-0.5 bg-[#7C3AED]/10 text-[#7C3AED] rounded font-bold ml-auto">{data.sector}</span>
              </div>
              <p className="text-sm text-[#848D97] leading-relaxed">{data.summary}</p>
              {data.sparkline && (
                <div className="mt-4 h-16">
                  <Sparkline data={data.sparkline} width={600} height={60} color="#7C3AED" />
                </div>
              )}
            </GlassCard>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'EPS Actual', value: `$${data.keyMetrics.epsActual?.toFixed(2) || 'N/A'}`, color: '#00D9FF' },
                { label: 'EPS Estimate', value: `$${data.keyMetrics.epsEstimate?.toFixed(2) || 'N/A'}`, color: '#848D97' },
                { label: 'Surprise', value: `${data.keyMetrics.epsSurprise > 0 ? '+' : ''}${data.keyMetrics.epsSurprise?.toFixed(2) || '0'}`, color: data.keyMetrics.epsSurprise >= 0 ? '#32D74B' : '#FF453A' },
                { label: 'Gross Margin', value: `${((data.keyMetrics.grossMargin || 0) * 100).toFixed(1)}%`, color: '#FFD60A' },
              ].map((m, i) => (
                <GlassCard key={i} className="p-4">
                  <span className="block text-[10px] text-[#848D97] uppercase tracking-widest mb-1 font-mono">{m.label}</span>
                  <span className="text-xl font-mono font-bold" style={{ color: m.color }}>{m.value}</span>
                </GlassCard>
              ))}
            </div>

            {/* Earnings History */}
            <GlassCard className="p-6">
              <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4">Earnings History</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.earnings?.map((e: any, i: number) => (
                  <div key={i} className={cn("p-3 rounded-xl border", e.beat ? 'bg-[#32D74B]/5 border-[#32D74B]/20' : 'bg-[#FF453A]/5 border-[#FF453A]/20')}>
                    <span className="text-[10px] text-[#848D97] font-mono block mb-1">{e.period}</span>
                    <div className="flex items-center gap-1">
                      {e.beat ? <ArrowUp size={12} className="text-[#32D74B]" /> : <ArrowDown size={12} className="text-[#FF453A]" />}
                      <span className="text-sm font-mono font-bold text-white">${e.actual}</span>
                    </div>
                    <span className="text-[9px] text-[#848D97] font-mono">Est: ${e.estimate}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Signals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard className="p-5">
                <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#32D74B] mb-3 flex items-center gap-2"><CheckCircle size={14} /> Positive Signals</h3>
                <ul className="space-y-2">
                  {(data.positives || []).map((s: string, i: number) => (
                    <li key={i} className="text-sm text-[#848D97] flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#32D74B] mt-2 shrink-0" />
                      {s}
                    </li>
                  ))}
                  {(!data.positives || data.positives.length === 0) && <li className="text-sm text-[#848D97]">No strong positives detected</li>}
                </ul>
              </GlassCard>
              <GlassCard className="p-5">
                <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#FF453A] mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Red Flags</h3>
                <ul className="space-y-2">
                  {(data.redFlags || []).map((s: string, i: number) => (
                    <li key={i} className="text-sm text-[#848D97] flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#FF453A] mt-2 shrink-0" />
                      {s}
                    </li>
                  ))}
                  {(!data.redFlags || data.redFlags.length === 0) && <li className="text-sm text-[#848D97]">No red flags detected</li>}
                </ul>
              </GlassCard>
            </div>

            {/* Price Impact */}
            {data.priceImpact && (
              <GlassCard className="p-5 border-l-2" style={{ borderLeftColor: data.priceImpact.direction === 'up' ? '#32D74B' : '#FF453A' }}>
                <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 flex items-center gap-2"><BarChart3 size={14} /> Price Impact Prediction</h3>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-mono font-bold" style={{ color: data.priceImpact.direction === 'up' ? '#32D74B' : '#FF453A' }}>
                    {data.priceImpact.direction === 'up' ? '↑' : '↓'} {data.priceImpact.magnitude.toFixed(1)}%
                  </span>
                  <span className="text-xs text-[#848D97] font-mono">Confidence: {data.priceImpact.confidence}%</span>
                </div>
                <p className="text-sm text-[#848D97]">{data.priceImpact.description}</p>
              </GlassCard>
            )}

            {/* Comparison */}
            {data.comparison && (
              <GlassCard className="p-5">
                <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-3">Quarter-over-Quarter</h3>
                <div className="flex items-center gap-4">
                  <div className="text-center flex-1">
                    <span className="text-[10px] text-[#848D97] font-mono block mb-1">Previous</span>
                    <span className="text-lg font-mono font-bold text-white">${data.comparison.previous?.actual || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {data.comparison.direction === 'improving' ? <TrendingUp size={20} className="text-[#32D74B]" /> : <TrendingDown size={20} className="text-[#FF453A]" />}
                    <span className={cn("text-xs font-bold uppercase", data.comparison.direction === 'improving' ? 'text-[#32D74B]' : 'text-[#FF453A]')}>{data.comparison.direction}</span>
                  </div>
                  <div className="text-center flex-1">
                    <span className="text-[10px] text-[#848D97] font-mono block mb-1">Current</span>
                    <span className="text-lg font-mono font-bold text-white">${data.comparison.current?.actual || 'N/A'}</span>
                  </div>
                </div>
              </GlassCard>
            )}
          </>
        )}

        {!data && !loading && (
          <GlassCard className="p-16 text-center">
            <FileText size={40} className="text-[#848D97] mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-bold text-white mb-2">Enter a Ticker Symbol</h3>
            <p className="text-sm text-[#848D97]">Analyze any company&apos;s latest earnings report with AI-powered insights</p>
          </GlassCard>
        )}

        <p className="text-[9px] text-white/20 text-center font-mono uppercase tracking-widest">{data?.disclaimer || 'This is not financial advice. Always do your own research.'}</p>
      </div>
    </FeatureGate>
  );
}
