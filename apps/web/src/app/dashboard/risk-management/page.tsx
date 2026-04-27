'use client';

import React, { useState } from 'react';
import { Shield, AlertTriangle, Settings, Calculator, Bell } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

import { FeatureGate } from '@/components/subscription/FeatureGate';
import { cn } from '@/lib/utils';

interface Position {
  symbol: string;
  qty: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  trailingStop: number;
  riskReward: number;
}

export default function RiskManagementPage() {
  const [positions, setPositions] = useState<Position[]>([
    { symbol: 'AAPL', qty: 50, entryPrice: 178, currentPrice: 185.2, stopLoss: 170, trailingStop: 180, riskReward: 2.5 },
    { symbol: 'MSFT', qty: 30, entryPrice: 390, currentPrice: 405.8, stopLoss: 375, trailingStop: 395, riskReward: 3.1 },
    { symbol: 'NVDA', qty: 20, entryPrice: 820, currentPrice: 890.5, stopLoss: 780, trailingStop: 860, riskReward: 1.8 },
    { symbol: 'GOOGL', qty: 40, entryPrice: 155, currentPrice: 162.3, stopLoss: 148, trailingStop: 158, riskReward: 2.2 },
  ]);

  const [riskSettings, setRiskSettings] = useState({
    maxRiskPerTrade: 2, // percentage
    minRiskReward: 2, // ratio
    maxPortfolioRisk: 10, // percentage
    trailingStopAtr: 2, // ATR multiplier
    accountSize: 100000,
  });

  const [alerts, setAlerts] = useState([
    { id: '1', type: 'warning', message: 'NVDA trailing stop at $860 — 3.4% from current', time: '2m ago' },
    { id: '2', type: 'info', message: 'Portfolio risk within target at 6.2%', time: '15m ago' },
    { id: '3', type: 'error', message: 'AAPL stop-loss adjusted: $170 → $175 (ATR-based)', time: '1h ago' },
  ]);

  const [showSettings, setShowSettings] = useState(false);

  // Position sizing calculator
  const [calcSymbol, setCalcSymbol] = useState('');
  const [calcEntry, setCalcEntry] = useState(0);
  const [calcStop, setCalcStop] = useState(0);
  const calcRiskAmount = riskSettings.accountSize * (riskSettings.maxRiskPerTrade / 100);
  const calcRiskPerShare = calcEntry - calcStop;
  const calcPositionSize = calcRiskPerShare > 0 ? Math.floor(calcRiskAmount / calcRiskPerShare) : 0;

  // Portfolio metrics
  const totalExposure = positions.reduce((sum, p) => sum + p.qty * p.currentPrice, 0);
  const totalRisk = positions.reduce((sum, p) => sum + p.qty * (p.currentPrice - p.stopLoss), 0);
  const portfolioRiskPct = (totalRisk / riskSettings.accountSize) * 100;
  const avgRiskReward = positions.reduce((sum, p) => sum + p.riskReward, 0) / positions.length;

  return (
    <FeatureGate requiredTier="plus" featureName="Risk Management Automation">
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="px-2 py-0.5 bg-[#FFD60A]/10 border border-[#FFD60A]/20 rounded text-[10px] font-bold text-[#FFD60A] uppercase tracking-widest flex items-center gap-1">
                <Shield size={10} /> Risk_Engine
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter font-mono">Risk <span className="text-[#FFD60A]">Management</span></h1>
            <p className="text-[#848D97] text-sm font-mono uppercase tracking-widest mt-1">Automated Position & Risk Control</p>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10">
            <Settings size={14} /> Risk Settings
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <GlassCard className="p-6 border-l-2 border-l-[#FFD60A]">
            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4">Risk Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Max Risk/Trade (%)', value: riskSettings.maxRiskPerTrade, key: 'maxRiskPerTrade' },
                { label: 'Min R:R Ratio', value: riskSettings.minRiskReward, key: 'minRiskReward' },
                { label: 'Max Portfolio Risk (%)', value: riskSettings.maxPortfolioRisk, key: 'maxPortfolioRisk' },
                { label: 'Trailing Stop (ATR×)', value: riskSettings.trailingStopAtr, key: 'trailingStopAtr' },
              ].map(s => (
                <div key={s.key}>
                  <label htmlFor={`risk-${s.key}`} className="text-[10px] text-[#848D97] uppercase tracking-widest block mb-1">{s.label}</label>
                  <input id={`risk-${s.key}`} type="number" value={s.value} step={0.5} onChange={e => setRiskSettings(prev => ({ ...prev, [s.key]: parseFloat(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#FFD60A]/40" />
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Risk Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Exposure', value: `$${totalExposure.toLocaleString()}`, color: '#00D9FF' },
            { label: 'Portfolio Risk', value: `${portfolioRiskPct.toFixed(1)}%`, color: portfolioRiskPct > riskSettings.maxPortfolioRisk ? '#FF453A' : '#32D74B' },
            { label: 'Avg R:R', value: `1:${avgRiskReward.toFixed(1)}`, color: avgRiskReward >= riskSettings.minRiskReward ? '#32D74B' : '#FFD60A' },
            { label: 'At-Risk Capital', value: `$${totalRisk.toLocaleString()}`, color: '#FF9500' },
          ].map((m, i) => (
            <GlassCard key={i} className="p-5 relative overflow-hidden">
              <span className="block text-[10px] text-[#848D97] uppercase tracking-widest mb-2 font-mono">{m.label}</span>
              <span className="text-2xl font-mono font-bold" style={{ color: m.color }}>{m.value}</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: m.color, opacity: 0.3 }} />
            </GlassCard>
          ))}
        </div>

        {/* Position Table */}
        <GlassCard className="p-6 overflow-x-auto">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4">Open Positions — Risk Monitor</h3>
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5">
                {['Symbol', 'Qty', 'Entry', 'Current', 'Stop-Loss', 'Trail Stop', 'P&L', 'R:R'].map(h => (
                  <th key={h} className="pb-3 text-[10px] text-[#848D97] uppercase tracking-widest font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map(p => {
                const pnl = (p.currentPrice - p.entryPrice) * p.qty;
                const pnlPct = ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100;
                const rrOk = p.riskReward >= riskSettings.minRiskReward;
                return (
                  <tr key={p.symbol} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-3 font-mono font-bold text-white text-sm">{p.symbol}</td>
                    <td className="py-3 font-mono text-sm text-[#848D97]">{p.qty}</td>
                    <td className="py-3 font-mono text-sm text-[#848D97]">${p.entryPrice}</td>
                    <td className="py-3 font-mono text-sm text-white">${p.currentPrice}</td>
                    <td className="py-3 font-mono text-sm text-[#FF453A]">${p.stopLoss}</td>
                    <td className="py-3 font-mono text-sm text-[#FF9500]">${p.trailingStop}</td>
                    <td className="py-3 font-mono text-sm" style={{ color: pnl >= 0 ? '#32D74B' : '#FF453A' }}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(0)} ({pnlPct.toFixed(1)}%)
                    </td>
                    <td className="py-3">
                      <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold", rrOk ? 'bg-[#32D74B]/10 text-[#32D74B]' : 'bg-[#FF453A]/10 text-[#FF453A]')}>
                        1:{p.riskReward.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlassCard>

        {/* Position Sizing Calculator */}
        <GlassCard className="p-6">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4 flex items-center gap-2"><Calculator size={14} /> Position Sizing Calculator</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="calc-symbol" className="text-[10px] text-[#848D97] uppercase tracking-widest block mb-1">Symbol</label>
              <input id="calc-symbol" value={calcSymbol} onChange={e => setCalcSymbol(e.target.value.toUpperCase())} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D9FF]/40" />
            </div>
            <div>
              <label htmlFor="calc-entry" className="text-[10px] text-[#848D97] uppercase tracking-widest block mb-1">Entry Price</label>
              <input id="calc-entry" type="number" value={calcEntry || ''} onChange={e => setCalcEntry(parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D9FF]/40" />
            </div>
            <div>
              <label htmlFor="calc-stop" className="text-[10px] text-[#848D97] uppercase tracking-widest block mb-1">Stop-Loss Price</label>
              <input id="calc-stop" type="number" value={calcStop || ''} onChange={e => setCalcStop(parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D9FF]/40" />
            </div>
            <div className="flex flex-col justify-end">
              <span className="text-[10px] text-[#848D97] uppercase tracking-widest block mb-1">Recommended Size</span>
              <div className="bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded-lg px-3 py-2 text-center">
                <span className="text-lg font-mono font-bold text-[#00D9FF]">{calcPositionSize}</span>
                <span className="text-[9px] text-[#848D97] block">shares (~${(calcPositionSize * calcEntry).toLocaleString()})</span>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-[#848D97] mt-3 font-mono">Risk per trade: ${calcRiskAmount.toFixed(0)} ({riskSettings.maxRiskPerTrade}% of ${riskSettings.accountSize.toLocaleString()})</p>
        </GlassCard>

        {/* Real-time Alerts */}
        <GlassCard className="p-6">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4 flex items-center gap-2"><Bell size={14} /> Risk Alerts</h3>
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className={cn("p-3 rounded-xl border flex items-start gap-3", a.type === 'error' ? 'bg-[#FF453A]/5 border-[#FF453A]/10' : a.type === 'warning' ? 'bg-[#FFD60A]/5 border-[#FFD60A]/10' : 'bg-[#00D9FF]/5 border-[#00D9FF]/10')}>
                <AlertTriangle size={14} className={a.type === 'error' ? 'text-[#FF453A]' : a.type === 'warning' ? 'text-[#FFD60A]' : 'text-[#00D9FF]'} />
                <div className="flex-1">
                  <p className="text-xs text-white">{a.message}</p>
                  <span className="text-[9px] text-[#848D97] font-mono">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <p className="text-[9px] text-white/20 text-center font-mono uppercase tracking-widest">This is not financial advice. Always do your own research.</p>
      </div>
    </FeatureGate>
  );
}
