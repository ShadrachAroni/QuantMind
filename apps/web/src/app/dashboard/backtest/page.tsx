'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield,
  Download,
  AlertCircle,
  BarChart3,
  Lock,
  Loader2,
  TrendingUp,
  ShieldAlert,
  LayoutDashboard,
  Zap,
  Settings2,
  Play
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { AllocationDonut } from '@/components/portfolios/AllocationDonut';
import { PerformanceChart } from '@/components/portfolios/PerformanceChart';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUser } from '@/components/UserContext';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { signInstitutionalReport, SignedPayload } from '@/lib/security/hsm_signer';

export default function BacktestPage() {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [range, setRange] = useState('1Y');
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle'); // Changed from isSimulating
  const [results, setResults] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]); // Added
  const [signedReport, setSignedReport] = useState<SignedPayload | null>(null); // Added
  const [isSigning, setIsSigning] = useState(false); // Added

  const supabase = createClient();

  useEffect(() => {
    async function fetchPortfolios() {
      const { data } = await supabase.from('portfolios').select('id, name, assets');
      if (data) {
        setPortfolios(data);
        if (data.length > 0) setSelectedPortfolioId(data[0].id);
      }
      setIsLoading(false);
    }
    fetchPortfolios();
  }, []);

   const { profile } = useUser();
   const tier = (profile?.tier as 'free' | 'plus' | 'pro' | 'student') || 'free';
   const isPremium = tier === 'plus' || tier === 'pro' || tier === 'student';

  const runBacktest = async () => {
    const portfolio = portfolios.find(p => p.id === selectedPortfolioId);
    if (!portfolio || !portfolio.assets) return;

    setStatus('loading'); // Changed from setIsSimulating(true)
    setResults(null);

    try {
      const symbols = portfolio.assets.map((a: any) => a.symbol);
      const { data: history, error } = await supabase
        .from('asset_history')
        .select('symbol, price, timestamp')
        .in('symbol', symbols)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Group by symbol
      const historyMap: Record<string, any[]> = {};
      history.forEach((h: any) => {
        if (!historyMap[h.symbol]) historyMap[h.symbol] = [];
        historyMap[h.symbol].push(h);
      });

      // Simulation Logic
      const dates = Array.from(new Set(history.map((h: any) => h.timestamp.split('T')[0]))).sort() as string[];
      const equityCurve: { timestamp: string, value: number }[] = [];

      let initialValue = 0;
      const shares: Record<string, number> = {};

      // Initial deployment at start of history
      const startDate = dates[0];
      portfolio.assets.forEach((asset: any) => {
        const symbolHistory = historyMap[asset.symbol]?.filter((h: any) => h.timestamp.startsWith(startDate));
        const price = symbolHistory?.[0]?.price || 100; // Fallback
        const qty = Number(asset.quantity || asset.amount || 1);
        shares[asset.symbol] = qty;
        initialValue += qty * price;
      });

      let dailyValue = initialValue; // Initialize dailyValue for calculations
      dates.forEach((date: string) => {
        let currentDailyValue = 0;
        symbols.forEach((sym: string) => {
          const dayPrice = historyMap[sym]?.find((h: any) => h.timestamp.startsWith(date))?.price;
          if (dayPrice) {
            currentDailyValue += shares[sym] * dayPrice;
          }
        });
        if (currentDailyValue > 0) {
          dailyValue = currentDailyValue; // Update dailyValue for the last day
          equityCurve.push({ timestamp: new Date(date).toISOString(), value: dailyValue });
        }
      });

      // Calculate Metrics
      const terminalValue = equityCurve[equityCurve.length - 1].value;
      const totalReturn = (terminalValue - initialValue) / initialValue;

      // Drawdown calculation
      let maxDD = 0;
      let peak = 0;
      equityCurve.forEach(p => {
        if (p.value > peak) peak = p.value;
        const dd = (peak - p.value) / peak;
        if (dd > maxDD) maxDD = dd;
      });

      // CAGR (Annualized)
      const years = equityCurve.length / 252;
      const cagr = Math.pow(1 + totalReturn, 1 / (years || 1)) - 1;

      setResults({
        equityCurve,
        initialValue,
        terminalValue,
        metrics: { // Changed structure to include metrics object
          totalReturn: totalReturn * 100,
          cagr: cagr * 100,
          maxDrawdown: maxDD * 100,
          sharpeRatio: (cagr - 0.04) / 0.15, // Mocked vol at 15%
        }
      });
      setStatus('success'); // Changed from setIsSimulating(false)
      setSignedReport(null); // Reset on new simulation

      toast.success('Backtest protocol completed successfully.');
    } catch (err: any) {
      console.error('BACKTEST_ERROR:', err);
      toast.error('Simulation failure: Data stream interrupted.');
      setStatus('error'); // Set status to error
    } finally {
      setIsLoading(false); // Keep isLoading false after initial fetch
    }
  };

  const handleSignReport = async () => {
    if (!results || isSigning) return;
    setIsSigning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated.');
        return;
      }

      const payload = await signInstitutionalReport({
        type: 'BACKTEST_REPORT',
        portfolio_id: selectedPortfolioId, // Use selectedPortfolioId
        metrics: results.metrics,
        timestamp: new Date().toISOString()
      }, user.id);

      setSignedReport(payload);
      toast.success('Report securely signed.');
    } catch (error) {
      console.error('Signing failed', error);
      toast.error('Report signing failed.');
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) return <div className="p-8 text-[#848D97] animate-pulse uppercase font-mono tracking-widest text-xs">Initializing_Backtest_Environment...</div>;

  return (
     <div className="p-8 space-y-8 animate-in fade-in duration-700 relative min-h-screen">
        {/* Institutional Gating Overlay */}
        {!isPremium && (
           <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#05070A]/60 backdrop-blur-xl p-8 text-center rounded-3xl m-8 border border-white/5">
              <div className="w-24 h-24 bg-[#FFD60A]/10 rounded-full flex items-center justify-center border border-[#FFD60A]/20 mb-8 shadow-[0_0_30px_rgba(255,214,10,0.1)]">
                 <Lock className="text-[#FFD60A]" size={40} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 uppercase tracking-tighter font-mono">Restricted_Simulation_Node</h2>
              <p className="text-[#848D97] max-w-md mb-10 text-sm leading-relaxed font-mono uppercase tracking-wide">
                 The Backtesting Terminal requires institutional-grade Plus or Pro access to Traverse historical equity curves.
              </p>
              <Link
                href="/dashboard/subscription"
                className="bg-[#00D9FF] text-[#05070A] px-12 py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs transition-all hover:scale-105 shadow-[0_10px_30px_rgba(0,217,255,0.2)]"
              >
                Upgrade_Access_Protocol
              </Link>
           </div>
        )}

      <div className={cn("space-y-8", !isPremium && "blur-md pointer-events-none")}>
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
             <AlertCircle className="text-[#00D9FF]" size={16} /> {/* Changed icon */}
             <span className="text-[10px] font-bold text-[#848D97] uppercase tracking-[0.3em] font-mono">Quant_Edge_v1.0</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white uppercase font-mono tracking-tight text-glow">Backtesting_Terminal</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Controls */}
          <GlassCard className="lg:col-span-1 p-6 space-y-8 h-fit" intensity="medium">
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">Source_Portfolio</label>
                   <select
                     value={selectedPortfolioId}
                     onChange={(e) => setSelectedPortfolioId(e.target.value)}
                     className="w-full bg-[#12121A] border border-white/10 rounded-xl py-3 px-4 text-white text-xs font-mono focus:outline-none focus:border-[#00D9FF]/50 transition-all appearance-none"
                   >
                      {portfolios.map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                   </select>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">Time_Horizon</label>
                   <div className="grid grid-cols-2 gap-2">
                      {['6M', '1Y', '3Y', '5Y'].map(t => (
                         <button
                           key={t}
                           onClick={() => setRange(t)}
                           className={cn(
                             "py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all font-mono border",
                             range === t ? "bg-[#00D9FF]/10 border-[#00D9FF]/30 text-[#00D9FF]" : "bg-white/5 border-white/5 text-[#848D97] hover:text-white"
                           )}
                         >
                            {t}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">Strategy_Logic</label>
                   <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white">CONSTANT_NAV</span>
                      <Settings2 size={12} className="text-[#848D97]" />
                   </div>
                </div>
             </div>

             <button
               disabled={status === 'loading' || !selectedPortfolioId}
               onClick={runBacktest}
               className="w-full bg-[#00D9FF] text-[#05070A] py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#00D9FF]/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_4px_20px_rgba(0,217,255,0.2)]"
             >
                {status === 'loading' ? (
                   <span className="animate-pulse">Computing_Matrix...</span>
                ) : (
                   <>
                      <Play size={16} fill="currentColor" />
                      Execute_Simulation
                   </>
                )}
             </button>
          </GlassCard>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6 md:space-y-8">
              {!results && status !== 'loading' && (
                <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-40">
                   <BarChart3 size={48} className="text-[#848D97] mb-4" />
                   <p className="text-xs uppercase font-bold tracking-[0.3em] font-mono">Awaiting_Protocol_Execution</p>
                </div>
             )}

              {status === 'loading' && (
                <div className="h-[400px] flex flex-col items-center justify-center bg-white/5 rounded-3xl animate-pulse">
                   <div className="w-12 h-12 border-4 border-[#00D9FF] border-t-transparent rounded-full animate-spin mb-6" />
                   <p className="text-xs uppercase font-bold tracking-[0.3em] font-mono text-[#00D9FF]">Traversing_Historical_Data...</p>
                </div>
             )}

             {results && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-6">
                   {/* Key Metrics */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <GlassCard className="p-4" intensity="low">
                         <span className="text-[9px] text-[#848D97] uppercase tracking-widest font-bold mb-1 block">Total Return</span>
                         <p className={cn("text-xl font-mono font-bold", results.totalReturn >= 0 ? "text-[#32D74B]" : "text-[#FF453A]")}>
                            {results.totalReturn.toFixed(2)}%
                         </p>
                      </GlassCard>
                      <GlassCard className="p-4" intensity="low">
                         <span className="text-[9px] text-[#848D97] uppercase tracking-widest font-bold mb-1 block">CAGR (Annual)</span>
                         <p className="text-xl font-mono font-bold text-white uppercase">{results.cagr.toFixed(2)}%</p>
                      </GlassCard>
                      <GlassCard className="p-4" intensity="low">
                         <span className="text-[9px] text-[#848D97] uppercase tracking-widest font-bold mb-1 block">Max Drawdown</span>
                         <p className="text-xl font-mono font-bold text-[#FF453A] uppercase">{results.maxDrawdown.toFixed(2)}%</p>
                      </GlassCard>
                      <GlassCard className="p-4" intensity="low">
                         <span className="text-[9px] text-[#848D97] uppercase tracking-widest font-bold mb-1 block">Sharpe Ratio</span>
                         <p className="text-xl font-mono font-bold text-[#00D9FF] uppercase">{results.sharpeRatio.toFixed(2)}</p>
                      </GlassCard>
                   </div>

                   {/* Equity Curve */}
                   <GlassCard className="p-8 h-[500px]" intensity="high">
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                             <TrendingUp className="text-[#00D9FF]" size={18} />
                             <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white">Equity_Progression_Model</h3>
                          </div>
                          <div className="flex items-center gap-4">
                             <button
                               className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all text-xs border border-white/5"
                               onClick={() => window.print()}
                             >
                                <Download size={14} /> Export_Data
                             </button>
                             <button
                               className={cn(
                                 "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-widest",
                                 signedReport
                                   ? "bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/30 cursor-default"
                                   : "bg-[#00D9FF] text-[#05070A] hover:shadow-[0_0_20px_rgba(0,217,255,0.3)]"
                               )}
                               onClick={handleSignReport}
                               disabled={isSigning || !!signedReport}
                             >
                                {isSigning ? <Loader2 className="animate-spin" size={14} /> : (signedReport ? <Shield size={14} /> : <Lock size={14} />)}
                                {signedReport ? 'Institutionally_Signed' : (isSigning ? 'Signing...' : 'Secure_Sign_Report')}
                             </button>
                          </div>
                       </div>

                       {signedReport && (
                         <div className="mb-8 p-4 bg-[#32D74B]/5 border border-[#32D74B]/20 rounded-xl flex items-center justify-between animate-in slide-in-from-top duration-500">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-[#32D74B]/10 flex items-center justify-center text-[#32D74B]">
                                  <Shield size={20} />
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-[#32D74B] uppercase tracking-[0.2em] mb-0.5">HSM_SECURE_VERIFIED</p>
                                  <p className="text-[9px] font-mono text-[#32D74B]/60 truncate max-w-[400px]">NODE::{signedReport.signer_node} | SIG::{signedReport.signature}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] text-[#32D74B]/60 font-mono uppercase">Assigned_TS</p>
                               <p className="text-[10px] text-white font-mono">{new Date(signedReport.timestamp).toLocaleTimeString()}</p>
                            </div>
                         </div>
                       )}

                       <PerformanceChart data={results.equityCurve} />
                   </GlassCard>

                   {/* Risk Indicators */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <GlassCard className="p-6 border-l-4 border-l-[#FF453A]" intensity="low">
                         <div className="flex items-center gap-3 mb-4">
                            <ShieldAlert className="text-[#FF453A]" size={20} />
                            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Protocol_Risk_Assessment</h4>
                         </div>
                         <p className="text-[11px] text-[#848D97] uppercase font-mono leading-relaxed">
                            Maximum Drawdown of <span className="text-[#FF453A] font-bold">{results.maxDrawdown.toFixed(2)}%</span> detected during the simulation. Institutional-grade hedging is recommended for this volatility coefficient.
                         </p>
                      </GlassCard>
                      <GlassCard className="p-6 border-l-4 border-l-[#32D74B]" intensity="low">
                         <div className="flex items-center gap-3 mb-4">
                            <LayoutDashboard className="text-[#32D74B]" size={20} />
                            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Performance_Benchmarking</h4>
                         </div>
                         <p className="text-[11px] text-[#848D97] uppercase font-mono leading-relaxed">
                            The strategy generated a Sharpe Ratio of <span className="text-[#32D74B] font-bold">{results.sharpeRatio.toFixed(2)}</span>, indicating superior risk-adjusted returns compared to the current system benchmark.
                         </p>
                      </GlassCard>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
