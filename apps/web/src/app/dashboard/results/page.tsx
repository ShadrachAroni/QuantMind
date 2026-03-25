'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  RotateCw, 
  TrendingUp, 
  ShieldAlert, 
  Zap, 
  Activity,
  History,
  FileText,
  ChevronRight,
  Loader2,
  Trash2,
  Table,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { FanChart } from '@/components/simulate/FanChart';
import { Histogram } from '@/components/simulate/Histogram';
import { RiskGauge } from '@/components/simulate/RiskGauge';
import { RiskContributionHeatmap } from '@/components/simulate/RiskContributionHeatmap';
import { formatCurrency, cn } from '@/lib/utils';
import { SimulationResult } from '@/lib/simulation';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { RiskSurface3D } from '@/components/simulate/RiskSurface3D';
import { useUser } from '@/components/UserContext';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [loading, setLoading] = useState(true);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      // Fetch result from Supabase
      const { data, error } = await supabase
        .from('simulations')
        .select('*, portfolios(name, assets)')
        .eq('id', id)
        .single();

      if (data) {
        let rawResult = data.result as any;
        
        // Normalize backend schema to SimulationResult interface
        const normalizedMetrics = {
          expectedValue: rawResult?.metrics?.expected_value || rawResult?.metrics?.expected_shortfall || 0,
          var95: rawResult?.value_at_risk || rawResult?.metrics?.var95 || 0,
          cvar99: rawResult?.metrics?.cvar99 || rawResult?.cvar_99 || rawResult?.expected_shortfall || 0,
          sharpeRatio: rawResult?.metrics?.sharpe_ratio || 0,
          volatility: parseFloat(rawResult?.metrics?.portfolio_volatility || '0') || 0,
          jumpIntensity: rawResult?.metrics?.jump_intensity || 0,
          stressImpact: rawResult?.metrics?.stress_impact || 'N/A',
          riskContribution: rawResult?.risk_contribution || {}
        };

        setSimulationResult({
          paths: rawResult?.paths || [],
          median: rawResult?.median || [],
          upper95: rawResult?.upper95 || [],
          lower95: rawResult?.lower95 || [],
          upper99: rawResult?.upper99 || [],
          lower99: rawResult?.lower99 || [],
          metrics: normalizedMetrics,
          portfolioName: data.portfolios?.name || 'Institutional_Vault',
          portfolioAssets: data.portfolios?.assets || [],
          timestamp: data.created_at
        });
      } else {
        // Fallback to sessionStorage for legacy support during migration
        const stored = sessionStorage.getItem(id);
        if (stored) {
          try {
            setSimulationResult(JSON.parse(stored));
          } catch (e) {
            console.error('Failed to parse cached result', e);
          }
        }
      }

      // Fetch History
      const { data: historyData } = await supabase
        .from('simulations')
        .select('id, created_at, status, portfolios(name)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (historyData) {
        setHistory(historyData);
      }

      setLoading(false);
    }

    loadData();
  }, [id, supabase]);

  const handleExport = () => {
    window.print();
  };

  const handleAnalyzeWithOracle = () => {
    if (!simulationResult) return;
    const { metrics, portfolioName, portfolioAssets } = simulationResult;
    const assetsStr = Array.isArray(portfolioAssets) 
      ? portfolioAssets.map((a: any) => `${a.symbol}: ${a.quantity} units`).join(', ') 
      : 'N/A';

    const context = `Simulation Results for ${portfolioName}:
Portfolio Composition: ${assetsStr}
Expected Value: ${formatCurrency(metrics.expectedValue)}
VaR (95%): -${formatCurrency(metrics.var95)}
CVaR (99%): -${formatCurrency(metrics.cvar99)}
Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}
Volatility: ${(metrics.volatility * 100).toFixed(2)}%

Based on these institutional metrics and the specific portfolio composition, provide a deep-dive analysis. 
Identify exactly which concentrations (e.g., SOL/USD vs others) are the primary drivers of the ${formatCurrency(metrics.var95)} VaR. 
Explain how specific regime shifts (like Developer Activity changes or liquidity droughts) could increase this tail risk by specific percentages (e.g. "tail risk increases by 4%"). 
Provide boardroom-level strategic recommendations.`;
    
    router.push(`/dashboard/oracle?prompt=${encodeURIComponent(context)}`);
  };

  const handleDeleteSimulation = async (e: React.MouseEvent, simulationId: string) => {
    e.stopPropagation(); // Prevent navigation to the simulation we're deleting
    
    if (!confirm('Are you sure you want to PERMANENTLY delete this simulation artifact from the institutional vault?')) return;

    try {
      const { error } = await supabase
        .from('simulations')
        .delete()
        .eq('id', simulationId);

      if (error) throw error;

      // Update local state
      setHistory(prev => prev.filter(h => h.id !== simulationId));
      
      // If we deleted the current simulation, redirect
      if (simulationId === id) {
        router.push('/dashboard/simulate');
      }
    } catch (err) {
      console.error('Failed to delete simulation:', err);
      alert('Vault integrity error: Failed to purge simulation artifact.');
    }
  };

  if (loading) {
    return <LoadingOverlay visible={true} message="DECRYPTING_SIMULATION_DATA..." />;
  }

  if (!simulationResult) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 text-center" intensity="low">
          <h2 className="text-xl font-bold text-white mb-4">No Simulation Data Found</h2>
          <p className="text-[#848D97] mb-6">Simulation ID <span className="font-mono text-white">{id || 'NULL'}</span> does not exist in the institutional vault.</p>
          <button 
            onClick={() => router.push('/dashboard/simulate')}
            className="bg-[#00D9FF] text-[#05070A] px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest"
          >
            Start_New_Modeling
          </button>
        </GlassCard>
      </div>
    );
  }

  const { metrics, portfolioName } = simulationResult;

  const metricCards = [
    { label: 'Expected Value', value: formatCurrency(metrics.expectedValue), icon: TrendingUp, color: 'text-[#00D9FF]' },
    { label: 'VaR (95%)', value: `-${formatCurrency(metrics.var95)}`, icon: ShieldAlert, color: 'text-[#FF453A]' },
    { label: 'CVaR (99%)', value: `-${formatCurrency(metrics.cvar99)}`, icon: Activity, color: 'text-[#FF453A]' },
    { label: 'Sharpe Ratio', value: metrics.sharpeRatio.toFixed(2), icon: Zap, color: 'text-[#FFD60A]' },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
         <button 
           onClick={() => router.back()}
           className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-[#848D97] hover:text-white transition-all print:hidden"
         >
            <ArrowLeft size={18} />
         </button>
         <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="text-[10px] font-bold text-[#848D97] uppercase tracking-widest">Analytics_Node</span>
               <ChevronRight size={10} className="text-white/20" />
               <span className="text-[10px] font-bold text-[#00D9FF] uppercase tracking-widest">Report_{id?.substring(0, 8)}</span>
            </div>
            <h1 className="text-3xl font-bold text-white uppercase font-mono tracking-tight">Modeling_Results</h1>
         </div>

         <div className="ml-auto flex items-center gap-3 print:hidden">
            <button 
               onClick={handleAnalyzeWithOracle}
               className="flex items-center gap-2 bg-[#FFD60A]/10 border border-[#FFD60A]/20 px-4 py-2.5 rounded-xl text-xs font-bold text-[#FFD60A] uppercase tracking-widest hover:bg-[#FFD60A]/20 transition-all"
            >
               <Zap size={14} /> AI_Analyze
            </button>
            <button 
               onClick={handleExport}
               className="flex items-center gap-2 bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all"
            >
               <Download size={14} /> Export_Report
            </button>
            <button 
               onClick={() => router.push('/dashboard/simulate')}
               className="flex items-center gap-2 bg-[#00D9FF] text-[#05070A] px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#00D9FF]/90 transition-all shadow-[0_0_15px_rgba(0,217,255,0.2)]"
            >
               <RotateCw size={14} /> New_Simulation
            </button>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {metricCards.map((m, i) => (
           <GlassCard key={i} className="p-6" intensity="low">
              <div className="flex items-center gap-3 mb-4">
                 <m.icon size={16} className={m.color} />
                 <span className="text-[10px] text-[#848D97] uppercase tracking-widest font-bold">{m.label}</span>
              </div>
              <h3 className="text-2xl font-mono font-bold text-white">{m.value}</h3>
           </GlassCard>
         ))}
      </div>

      {metrics.jumpIntensity > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[#FF453A]/5 border border-[#FF453A]/20 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-[#FF453A] animate-pulse" />
            <div>
              <p className="text-[10px] font-bold text-[#FF453A] uppercase tracking-[0.2em]">Black_Swan_Detected [Jump_Diffusion_Active]</p>
              <p className="text-[9px] text-[#848D97]">Model detected stochastic jumps with {(metrics.jumpIntensity * 100).toFixed(1)}% annual probability. Tail risk significantly non-Gaussian.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#848D97] uppercase font-bold mb-1 tracking-widest">Calculated_Shock</p>
            <p className="text-xs font-mono text-white bg-white/5 px-2 py-0.5 rounded border border-white/5">{metrics.stressImpact}</p>
          </div>
        </motion.div>
      )}

      {/* Main Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard className="lg:col-span-2 p-8 overflow-hidden" intensity="medium">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-xs uppercase font-bold tracking-[0.3em] text-[#848D97] mb-1">Visual_Terminal [Alpha]</h3>
                 <p className="text-[10px] text-white/40 uppercase font-mono">3D_Risk_Surface + Path_Probability_Density</p>
              </div>
              <div className="flex items-center gap-2">
                 <div className="px-3 py-1 bg-white/5 rounded border border-white/5 text-[9px] font-bold text-[#00D9FF] uppercase tracking-widest animate-pulse">Live_Render</div>
              </div>
           </div>

           <div className="space-y-8">
              <RiskSurface3D data={simulationResult} />
              
              <div className="pt-8 border-t border-white/5">
                 <h3 className="text-xs uppercase font-bold tracking-[0.3em] text-[#848D97] mb-6">Path_Distribution</h3>
                 {simulationResult.median?.length > 0 && <FanChart data={simulationResult} />}
              </div>
           </div>

           {simulationResult.median?.length === 0 && (
             <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-white/5 rounded-2xl opacity-30">
               <Activity size={32} className="mb-4" />
               <p className="text-[10px] uppercase tracking-widest font-mono">Telemetry stream incomplete for this artifact</p>
             </div>
           )}
        </GlassCard>

        <div className="space-y-6">
           <GlassCard className="p-6" intensity="medium">
              <h3 className="text-xs uppercase font-bold tracking-[0.3em] text-[#848D97] mb-6">Risk_Exposure_Gauge</h3>
              <RiskGauge 
                var95={metrics.var95} 
                cvar99={metrics.cvar99} 
                initialValue={simulationResult.median?.[0] || 1} 
              />
              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#848D97] uppercase font-bold">Annual_Vol</span>
                    <span className="text-xs font-mono text-white">{(metrics.volatility * 100).toFixed(2)}%</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#848D97] uppercase font-bold">Max_Drawdown_Est</span>
                    <span className="text-xs font-mono text-[#FF453A]">-{((metrics.cvar99 / (simulationResult.median?.[0] || 1)) * 100).toFixed(1)}%</span>
                 </div>
              </div>
           </GlassCard>

           {Object.keys(metrics.riskContribution).length > 0 && (
             <GlassCard className="p-6" intensity="medium">
                <RiskContributionHeatmap 
                  data={metrics.riskContribution} 
                  totalVaR={metrics.var95} 
                />
             </GlassCard>
           )}
        </div>
      </div>

      {/* Detailed Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <GlassCard className="lg:col-span-2 p-8" intensity="low">
            <h3 className="text-xs uppercase font-bold tracking-[0.3em] text-[#848D97] mb-6">Terminal_Value_Distribution (Probability Heatmap)</h3>
            <Histogram data={simulationResult.paths?.map((p: any) => p[p.length - 1]) || []} />
         </GlassCard>

         <div className="space-y-4 print:hidden">
            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4">Historical_Simulations</h3>
            {history.length > 0 ? history.map((h, i) => (
              <div 
                key={i} 
                onClick={() => router.push(`/dashboard/results?id=${h.id}`)}
                className={cn(
                  "w-full p-5 flex items-center gap-4 bg-white/5 border rounded-xl transition-all cursor-pointer group",
                  h.id === id ? "border-[#00D9FF]/50 bg-[#00D9FF]/5" : "border-white/5 hover:border-white/10"
                )}
              >
                 <div className={cn(
                   "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                   h.id === id ? "bg-[#00D9FF] text-[#05070A]" : "bg-white/5 text-[#848D97] group-hover:text-[#00D9FF]"
                 )}>
                    <History size={18} />
                 </div>
                 <div className="flex-1 text-left">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-0.5">
                      Vault_{h.portfolios?.name?.substring(0, 10) || 'ROOT'}
                    </h4>
                    <p className="text-[9px] text-[#848D97] font-mono">{new Date(h.created_at).toLocaleString()}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <div 
                     onClick={(e) => handleDeleteSimulation(e, h.id)}
                     className="p-2 text-[#848D97] hover:text-[#FF453A] hover:bg-[#FF453A]/10 rounded-lg transition-all"
                     title="Purge Artifact"
                   >
                     <Trash2 size={14} />
                   </div>
                   <ChevronRight size={14} className="text-white/20" />
                 </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 text-center opacity-30">
                 <History size={32} className="mb-4" />
                 <p className="text-[10px] uppercase font-mono tracking-widest">No persistent artifacts</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingOverlay visible={true} message="INITIALIZING_ANALYTICS..." />}>
      <ResultsContent />
    </Suspense>
  );
}
