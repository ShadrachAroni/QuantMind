'use client';

import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Zap, ChevronDown, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Sparkline } from '@/components/ui/Sparkline';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useUser } from '@/components/UserContext';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';

const RISK_COLORS = { LOW: '#32D74B', MEDIUM: '#FFD60A', HIGH: '#FF9500', CRITICAL: '#FF453A' };

export default function RiskAssessmentPage() {
  const { profile } = useUser();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState({ symbol: '', changePercent: -20 });
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const supabase = createClient();

  const fetchRisk = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: portfolios } = await supabase.from('portfolios').select('assets').eq('user_id', user.id);
      const symbols = new Set<string>();
      portfolios?.forEach(p => {
        if (Array.isArray(p.assets)) (p.assets as any[]).forEach(a => a.symbol && symbols.add(a.symbol));
      });
      const symbolList = symbols.size > 0 ? Array.from(symbols) : ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
      const res = await fetch('/api/risk-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: symbolList, scenario: scenario.symbol ? scenario : undefined }),
      });
      setData(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchRisk(); }, []);

  return (
    <FeatureGate requiredTier="pro" featureName="Risk Assessment Module">
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="px-2 py-0.5 bg-[#FF453A]/10 border border-[#FF453A]/20 rounded text-[10px] font-bold text-[#FF453A] uppercase tracking-widest flex items-center gap-1">
                <Shield size={10} /> Risk_Protocol
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter font-mono">Risk <span className="text-[#FF453A]">Assessment</span></h1>
            <p className="text-[#848D97] text-sm font-mono uppercase tracking-widest mt-1">Portfolio Risk Analysis & What-If Scenarios</p>
          </div>
          <button onClick={fetchRisk} disabled={loading} className={cn("flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all", loading && "animate-pulse")}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Recalculate
          </button>
        </div>

        {data?.portfolio && (
          <>
            {/* Score Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Risk Score', value: `${data.portfolio.riskScore}/100`, color: RISK_COLORS[data.portfolio.riskLevel as keyof typeof RISK_COLORS] },
                { label: 'VaR (95%)', value: `${(data.portfolio.var95 * 100).toFixed(2)}%`, color: '#FF9500' },
                { label: 'Sharpe Ratio', value: data.portfolio.sharpeRatio.toFixed(2), color: data.portfolio.sharpeRatio > 1 ? '#32D74B' : '#FFD60A' },
                { label: 'Max Drawdown', value: `${(data.portfolio.maxDrawdown * 100).toFixed(1)}%`, color: '#FF453A' },
                { label: 'Risk Level', value: data.portfolio.riskLevel, color: RISK_COLORS[data.portfolio.riskLevel as keyof typeof RISK_COLORS] },
              ].map((card, i) => (
                <GlassCard key={i} className="p-5 relative overflow-hidden">
                  <span className="block text-[10px] text-[#848D97] uppercase tracking-widest mb-2 font-mono">{card.label}</span>
                  <span className="text-2xl font-mono font-bold" style={{ color: card.color }}>{card.value}</span>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: card.color, opacity: 0.4 }} />
                </GlassCard>
              ))}
            </div>

            {/* Portfolio Returns Chart */}
            {data.historicalReturns && (
              <GlassCard className="p-6">
                <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4">Historical Portfolio Returns (60D)</h3>
                <div className="h-24">
                  <Sparkline data={data.historicalReturns.map((r: number) => (r + 1) * 100)} width={800} height={90} color="#00D9FF" />
                </div>
              </GlassCard>
            )}

            {/* Per-Asset Risk Table */}
            <GlassCard className="p-6 overflow-x-auto">
              <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4">Per-Asset Risk Breakdown</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Asset', 'VaR (95%)', 'Sharpe', 'Max DD', 'Beta', 'Risk'].map(h => (
                      <th key={h} className="pb-3 text-[10px] text-[#848D97] uppercase tracking-widest font-mono">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.perAssetRisk?.map((asset: any) => (
                    <tr key={asset.symbol} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-mono font-bold text-white text-sm">{asset.symbol}</td>
                      <td className="py-3 font-mono text-sm text-[#FF9500]">{(asset.var95 * 100).toFixed(2)}%</td>
                      <td className="py-3 font-mono text-sm" style={{ color: asset.sharpeRatio > 1 ? '#32D74B' : '#FFD60A' }}>{asset.sharpeRatio.toFixed(2)}</td>
                      <td className="py-3 font-mono text-sm text-[#FF453A]">{(asset.maxDrawdown * 100).toFixed(1)}%</td>
                      <td className="py-3 font-mono text-sm text-white">{asset.beta.toFixed(2)}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" style={{ background: `${RISK_COLORS[asset.riskLevel as keyof typeof RISK_COLORS]}20`, color: RISK_COLORS[asset.riskLevel as keyof typeof RISK_COLORS] }}>
                          {asset.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>

            {/* What-If Scenario */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97]">What-If Scenario Engine</h3>
                <button onClick={() => setScenarioOpen(!scenarioOpen)} className="text-[#00D9FF] text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                  <Zap size={12} /> Configure <ChevronDown size={12} className={cn('transition-transform', scenarioOpen && 'rotate-180')} />
                </button>
              </div>
              {scenarioOpen && (
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <input value={scenario.symbol} onChange={e => setScenario(p => ({ ...p, symbol: e.target.value.toUpperCase() }))} placeholder="Symbol (e.g. AAPL)" aria-label="Scenario symbol" className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder:text-white/20 flex-1 focus:outline-none focus:border-[#00D9FF]/40" />
                  <input type="number" value={scenario.changePercent} onChange={e => setScenario(p => ({ ...p, changePercent: parseFloat(e.target.value) }))} placeholder="% Change" aria-label="Scenario percentage change" className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono w-32 focus:outline-none focus:border-[#00D9FF]/40" />
                  <button onClick={fetchRisk} className="bg-[#00D9FF] text-[#05070A] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all">Simulate</button>
                </div>
              )}
              {data.scenarioResult && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-[#FFD60A]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Scenario Result</span>
                  </div>
                  <p className="text-sm text-[#848D97]">{data.scenarioResult.description}</p>
                  <div className="mt-2 flex gap-4 text-xs font-mono">
                    <span className="text-[#FF9500]">Portfolio Impact: {(data.scenarioResult.portfolioImpact * 100).toFixed(2)}%</span>
                    <span className="text-[#FF453A]">New VaR: {(data.scenarioResult.newVar95 * 100).toFixed(2)}%</span>
                  </div>
                </div>
              )}
            </GlassCard>
          </>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#00D9FF] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <p className="text-[9px] text-white/20 text-center font-mono uppercase tracking-widest">This is not financial advice. Always do your own research.</p>
      </div>
    </FeatureGate>
  );
}
