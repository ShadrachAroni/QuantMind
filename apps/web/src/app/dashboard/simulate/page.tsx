'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Play, 
  RotateCw, 
  Settings, 
  Database, 
  LineChart as LineChartIcon,
  Activity,
  ChevronRight,
  Info,
  ShieldAlert,
  History,
  Trash2,
  ExternalLink,
  Zap,
  Lock,
  ArrowUpCircle,
  MousePointer2,
  Settings2
} from 'lucide-react';
import { TierBadge } from '@/components/ui/TierBadge';
import { createClient } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn, formatCurrency } from '@/lib/utils';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { generateGBMPaths } from '@/lib/simulation';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { LimitBanner } from '@/components/subscription/LimitBanner';
import { useUser } from '@/components/UserContext';

export default function SimulatePage() {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [userTier, setUserTier] = useState('free');
  const [iterations, setIterations] = useState(1000);
  const [timeHorizon, setTimeHorizon] = useState(252); // 1 year of trading days
  const [initialValue, setInitialValue] = useState(100000);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState<number[]>([]);
  const [modelType, setModelType] = useState<'gbm' | 'jump_diffusion' | 'fat_tails' | 'random_forest_regressor' | 'lstm_forecast'>('gbm');
  const [history, setHistory] = useState<any[]>([]);
  const [simulationCount, setSimulationCount] = useState(0);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [modalRequiredTier, setModalRequiredTier] = useState<'plus' | 'pro'>('plus');
  const [modalFeatureName, setModalFeatureName] = useState('');

  // PRO Parameters
  const [jumpIntensity, setJumpIntensity] = useState(0.05);
  const [jumpMean, setJumpMean] = useState(-0.15);
  const [jumpVol, setJumpVol] = useState(0.1);
  const [stressTest, setStressTest] = useState<{ asset: string; magnitude: number } | null>(null);
  const [optimizationParams, setOptimizationParams] = useState<any>(null);
  const [modelConfig, setModelConfig] = useState<any>({});
  const [backtestConfig, setBacktestConfig] = useState<any>(null);

  const supabase = createClient();

  const TIER_CONFIG: Record<string, { maxPaths: number }> = {
    free: { maxPaths: 2000 },
    plus: { maxPaths: 10000 },
    pro: { maxPaths: 100000 },
    student: { maxPaths: 10000 },
  };

  const currentTierConfig = TIER_CONFIG[userTier] || TIER_CONFIG.free;

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tier')
        .eq('id', user.id)
        .single();
      if (profile) setUserTier(profile.tier);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [supabase]);

  // Ensure iterations doesn't exceed new tier limit if tier changes
  useEffect(() => {
    if (iterations > currentTierConfig.maxPaths) {
      setIterations(currentTierConfig.maxPaths);
    }
  }, [userTier]);

  // Generate a preview path whenever inputs change
  useEffect(() => {
    const generatePreview = () => {
      const dt = 1 / 252;
      const drift = 0.08; // 8% nominal preview drift
      const vol = 0.15;   // 15% nominal preview vol
      const dailyDrift = (drift - 0.5 * Math.pow(vol, 2)) * dt;
      const dailyVol = vol * Math.sqrt(dt);

      const path = [initialValue];
      let current = initialValue;

      // Seeded random for stable preview (so it doesn't jump while typing)
      let seed = 42;
      const seededRandom = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      // Box-Muller for better normal dist
      const nextGaussian = () => {
        const u = seededRandom();
        const v = seededRandom();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      };

      const step = Math.max(1, Math.floor(timeHorizon / 100));
      for (let t = 1; t < timeHorizon; t++) {
        const z = nextGaussian();
        current = current * Math.exp(dailyDrift + dailyVol * z);
        if (t % step === 0 || t === timeHorizon - 1) {
          path.push(current);
        }
      }
      setPreviewPath(path);
    };
    generatePreview();
  }, [initialValue, timeHorizon]);

  useEffect(() => {
    const fetchPortfolios = async () => {
      const { data } = await supabase.from('portfolios').select('id, name, assets');
      if (data) {
        setPortfolios(data);
        if (data.length > 0) setSelectedPortfolioId(data[0].id);
      }
    };
    fetchPortfolios();
    fetchHistory();
  }, [supabase]);

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, count } = await supabase
      .from('simulations')
      .select('id, created_at, status, portfolios(name)', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (data) setHistory(data.slice(0, 3));
    if (count !== null) setSimulationCount(count);
  };

  const handleDeleteSimulation = async (e: React.MouseEvent, simulationId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to purge this simulation artifact?')) return;

    try {
      const { error } = await supabase
        .from('simulations')
        .delete()
        .eq('id', simulationId);

      if (error) throw error;
      setHistory(prev => prev.filter(h => h.id !== simulationId));
    } catch (err) {
      console.error('Failed to purge simulation:', err);
      alert('Vault integrity error: Failed to purge artifact.');
    }
  };

  const handleRunSimulation = async () => {
    if (!selectedPortfolioId) return;

    // Tier Checks
    if (iterations > currentTierConfig.maxPaths) {
      setModalRequiredTier(iterations > 10000 ? 'pro' : 'plus');
      setModalFeatureName(`High-Iteration Simulation (${iterations.toLocaleString()} paths)`);
      setIsUpgradeModalOpen(true);
      return;
    }

    if (modelType !== 'gbm' && userTier !== 'pro') {
      setModalRequiredTier('pro');
      setModalFeatureName(`${modelType === 'jump_diffusion' ? 'Jump Diffusion' : 'Fat Tails'} Model`);
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsSimulating(true);
    setProgress(10);

    let jobId: string | null = null;

    try {
      // 1. Try the Edge Function (which handles HF + Edge Fallback)
      const { data, error: invokeError } = await supabase.functions.invoke('simulate', {
        body: {
          portfolio_id: selectedPortfolioId,
          num_paths: iterations,
          time_horizon_years: timeHorizon / 252,
          model_type: modelType,
          initial_value: initialValue,
          risk_free_rate: 0.04,
          jump_lambda: jumpIntensity,
          jump_size: jumpMean,
          jump_vol: jumpVol,
          stress_test: stressTest ? [{ symbol: stressTest.asset, shock_pct: stressTest.magnitude }] : [],
          optimization_params: optimizationParams,
          advanced_model_config: modelConfig,
          backtest_config: backtestConfig
        },
      });

      if (!invokeError && data?.jobId) {
        jobId = data.jobId;
        setProgress(30);

        // Subscribe to server-side updates
        const channel = supabase
          .channel(`job-${jobId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'simulations',
              filter: `id=eq.${jobId}`,
            },
            (payload) => {
              const updated = payload.new as any;
              if (updated.status === 'completed') {
                setProgress(100);
                setTimeout(() => {
                  setIsSimulating(false);
                  window.location.href = `/dashboard/results?id=${jobId}`;
                }, 800);
                supabase.removeChannel(channel);
              } else if (updated.status === 'failed') {
                setIsSimulating(false);
                alert(`Simulation Pipeline Error: ${updated.error_message}`);
                supabase.removeChannel(channel);
              } else {
                setProgress(prev => Math.min(prev + 10, 95));
              }
            }
          )
          .subscribe();
      } else {
        throw new Error(invokeError?.message || 'Edge Function unavailable');
      }

    } catch (error) {
      console.warn('Edge Simulation Failed, falling back to client-side compute:', error);

      try {
        // --- Client-Side Fallback ---
        setProgress(20);

        // 1. Fetch Portfolio details manually
        const { data: portfolio } = await supabase
          .from('portfolios')
          .select('*')
          .eq('id', selectedPortfolioId)
          .single();

        if (!portfolio) throw new Error('Portfolio not found');

        // 2. Create Simulation Record marked as 'running'
        const { data: { user } } = await supabase.auth.getUser();
        const seed = Math.floor(Math.random() * 2_147_483_647);
        const paramsHash = btoa(JSON.stringify({
          portfolio_id: selectedPortfolioId,
          num_paths: iterations,
          time_horizon_years: timeHorizon / 252,
          model_type: modelType,
          seed
        })).slice(0, 64);

        const { data: simRecord, error: simError } = await supabase
          .from('simulations')
          .insert({
            user_id: user?.id,
            portfolio_id: selectedPortfolioId,
            params: { iterations, timeHorizon, model: modelType, seed },
            params_hash: paramsHash,
            status: 'running',
            num_paths: iterations,
            time_horizon_years: timeHorizon / 252,
            seed
          })
          .select()
          .single();

        if (simError || !simRecord) {
          console.error('Database Error creating simulation record:', simError);
          throw new Error(`Failed to create simulation record: ${simError?.message || 'Unknown DB error'}`);
        }
        jobId = simRecord.id;
        setProgress(40);

        // 3. Perform Simulation using lib/simulation
        const result = generateGBMPaths(
          initialValue,
          0.10,
          0.20,
          timeHorizon,
          iterations
        );
        setProgress(80);

        // 4. Update Record to 'completed'
        await supabase
          .from('simulations')
          .update({
            status: 'completed',
            result: {
              ...result,
              metrics: {
                expected_value: result.metrics.expectedValue,
                portfolio_volatility: result.metrics.volatility,
                sharpe_ratio: result.metrics.sharpeRatio,
                var95: result.metrics.var95,
                cvar99: result.metrics.cvar99
              }
            }
          })
          .eq('id', jobId);

        setProgress(100);
        setTimeout(() => {
          setIsSimulating(false);
          window.location.href = `/dashboard/results?id=${jobId}`;
        }, 800);

      } catch (fallbackError) {
        console.error('All simulation paths failed:', fallbackError);
        setIsSimulating(false);
        alert('Simulation failed. Please check your network connection.');

        if (jobId) {
          await supabase
            .from('simulations')
            .update({ status: 'failed', error_message: 'Client-side fallback failed' })
            .eq('id', jobId);
        }
      }
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <LoadingOverlay
        visible={isSimulating}
        message={`DEPLOYING_MONTE_CARLO... ${Math.round(progress)}%`}
      />

      {/* Top Navigation & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
           <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-[#00D9FF] uppercase tracking-widest">Simulation_Terminal</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-pulse" />
           </div>
           <h1 className="text-3xl font-bold text-white uppercase font-mono tracking-tight text-glow">Strategy_Modeling</h1>
           <p className="text-[#848D97] text-sm mt-1">Initialize non-deterministic path analysis and tail-risk forecasting.</p>
        </div>

        <div className="hidden md:block flex-1 max-w-sm">
           <LimitBanner
             currentValue={simulationCount}
             maxValue={userTier === 'pro' ? 1000 : userTier === 'plus' ? 100 : 10}
             unit="Simulations"
             onUpgrade={() => {
                setModalRequiredTier('plus');
                setModalFeatureName('Unlimited Simulation Capacity');
                setIsUpgradeModalOpen(true);
             }}
           />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-[#848D97] tracking-widest">Subscription_Tier</span>
            <TierBadge tier={userTier as any} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
         {/* Parameters Panel */}
         <div className="lg:col-span-4 space-y-6">
            <GlassCard className="p-6" intensity="medium">
               <div className="flex items-center gap-3 mb-8">
                  <Settings size={18} className="text-[#00D9FF]" />
                  <h3 className="text-xs uppercase font-bold tracking-[0.3em] text-white">Model_Parameters</h3>
               </div>

               <div className="space-y-6">
                  <div>
                     <label htmlFor="source-portfolio" className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">Source_Portfolio</label>
                     <select
                       id="source-portfolio"
                       aria-label="Select source portfolio"
                       className="w-full bg-[#12121A] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono appearance-none"
                       value={selectedPortfolioId}
                       onChange={(e) => setSelectedPortfolioId(e.target.value)}
                     >
                        {portfolios.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                     </select>
                  </div>

                  <div>
                     <label htmlFor="initial-capital" className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">Initial_Capital ($)</label>
                     <input
                       id="initial-capital"
                       type="number"
                       aria-label="Initial capital in dollars"
                       className="w-full bg-[#12121A] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono"
                       value={initialValue}
                       onChange={(e) => setInitialValue(Number(e.target.value))}
                     />
                  </div>

                  <div>
                     <label htmlFor="iteration-count" className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">Iteration_Count (n)</label>
                     <input
                       id="iteration-count"
                       type="range" min="100" max={currentTierConfig.maxPaths} step={userTier === 'pro' ? 1000 : 100}
                       aria-label="Number of simulation iterations"
                       className="w-full accent-[#00D9FF]"
                       value={iterations}
                       onChange={(e) => setIterations(Number(e.target.value))}
                     />
                     <div className="flex justify-between mt-2 text-[10px] font-mono text-[#848D97]">
                        <span>100</span>
                        <span className="text-[#00D9FF] font-bold">{iterations.toLocaleString()} ITERATIONS</span>
                        <span>{currentTierConfig.maxPaths.toLocaleString()}</span>
                     </div>
                  </div>

                  <div>
                     <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">Model_Dynamics</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'gbm', name: 'GBM (Standard)', requiredTier: 'free' },
                          { id: 'jump_diffusion', name: 'Jump Diffusion', requiredTier: 'pro' },
                          { id: 'fat_tails', name: 'Fat Tails (Stable)', requiredTier: 'pro' },
                          { id: 'random_forest_regressor', name: 'Random Forest Forecast', requiredTier: 'pro' },
                          { id: 'lstm_forecast', name: 'LSTM (Neural Network)', requiredTier: 'pro' },
                        ].map((m) => (
                          <div key={m.id}>
                            {m.requiredTier !== 'free' ? (
                              <FeatureGate
                                requiredTier={m.requiredTier as any}
                                featureName={m.name}
                                blur={false}
                              >
                                <button
                                  onClick={() => setModelType(m.id as any)}
                                  className={cn(
                                    "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all",
                                    modelType === m.id
                                      ? "bg-[#00D9FF]/10 border-[#00D9FF]/50 text-white"
                                      : "bg-[#12121A] border-white/5 text-[#848D97] hover:border-white/10"
                                  )}
                                >
                                  <span className="text-xs font-mono">{m.name}</span>
                                </button>
                              </FeatureGate>
                            ) : (
                              <button
                                onClick={() => setModelType(m.id as any)}
                                className={cn(
                                  "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all",
                                  modelType === m.id
                                    ? "bg-[#00D9FF]/10 border-[#00D9FF]/50 text-white"
                                    : "bg-[#12121A] border-white/5 text-[#848D97] hover:border-white/10"
                                )}
                              >
                                <span className="text-xs font-mono">{m.name}</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                  </div>

                  <div>
                     <label htmlFor="time-horizon" className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">Time_Horizon (Days)</label>
                     <input
                       id="time-horizon"
                       type="range" min="30" max="756" step="30"
                       aria-label="Simulation time horizon in days"
                       className="w-full accent-[#7C3AED]"
                       value={timeHorizon}
                       onChange={(e) => setTimeHorizon(Number(e.target.value))}
                     />
                     <div className="flex justify-between mt-2 text-[10px] font-mono text-[#848D97]">
                        <span>30</span>
                        <span className="text-[#7C3AED] font-bold">{timeHorizon} DAYS</span>
                        <span>756</span>
                     </div>
                  </div>

                  <FeatureGate
                    requiredTier="pro"
                    featureName="Portfolio Optimization"
                    className="mt-4"
                  >
                    <div className="p-4 bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-xl space-y-4">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                             <ArrowUpCircle size={14} className="text-[#7C3AED]" />
                             <span className="text-[10px] font-bold text-white uppercase tracking-widest">Strategy_Optimizer</span>
                          </div>
                          <button
                            onClick={() => setOptimizationParams(optimizationParams ? null : { algorithm: 'mean_variance', risk_tolerance: 0.1, target_return: 0.08 })}
                            className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded transition-all",
                              optimizationParams ? "bg-[#7C3AED] text-white" : "bg-white/10 text-[#848D97]"
                            )}
                          >
                            {optimizationParams ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                       </div>

                       {optimizationParams && (
                          <div className="space-y-4 animate-in fade-in zoom-in-95">
                             <div>
                                <label htmlFor="opt-algorithm" className="text-[8px] uppercase font-bold text-[#848D97] mb-1 block">Algorithm</label>
                                <select
                                  id="opt-algorithm"
                                  aria-label="Selection optimization algorithm"
                                  className="w-full bg-[#0F1113] border border-white/5 rounded-lg py-2 px-3 text-white text-[10px] font-mono"
                                  value={optimizationParams.algorithm}
                                  onChange={(e) => setOptimizationParams({ ...optimizationParams, algorithm: e.target.value })}
                                >
                                   <option value="mean_variance">Mean-Variance (MVO)</option>
                                   <option value="risk_parity">Risk Parity</option>
                                   <option value="hierarchical_risk_parity">Hierarchical Risk Parity</option>
                                </select>
                             </div>
                             <div>
                                <label htmlFor="opt-risk-tolerance" className="text-[8px] uppercase font-bold text-[#848D97] mb-1 block">Risk_Tolerance</label>
                                <input
                                  id="opt-risk-tolerance"
                                  type="range" min="0" max="1" step="0.1"
                                  aria-label="Risk tolerance level"
                                  className="w-full h-1 accent-[#7C3AED]"
                                  value={optimizationParams.risk_tolerance}
                                  onChange={(e) => setOptimizationParams({ ...optimizationParams, risk_tolerance: Number(e.target.value) })}
                                />
                             </div>
                          </div>
                       )}
                    </div>
                  </FeatureGate>

                  {modelType === 'jump_diffusion' && userTier === 'pro' && (
                    <div className="p-4 bg-[#00D9FF]/5 border border-[#00D9FF]/20 rounded-xl space-y-4 animate-in slide-in-from-top-2">
                       <div className="flex items-center gap-2 mb-2">
                          <Zap size={14} className="text-[#00D9FF]" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Jump_Diffusion_Params</span>
                       </div>

                       <div className="space-y-4">
                          <div>
                             <label htmlFor="jump-intensity" className="text-[8px] uppercase font-bold text-[#848D97] mb-1 block">Jump_Intensity (λ)</label>
                             <input
                               id="jump-intensity"
                               type="range" min="0" max="0.5" step="0.01"
                               aria-label="Jump intensity lambda"
                               className="w-full h-1 accent-[#00D9FF]"
                               value={jumpIntensity}
                               onChange={(e) => setJumpIntensity(Number(e.target.value))}
                             />
                             <div className="flex justify-between text-[8px] font-mono text-[#848D97]">
                                <span>{Math.round(jumpIntensity * 100)}% PROBABILITY/YR</span>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="jump-mean" className="text-[8px] uppercase font-bold text-[#848D97] mb-1 block">Mean_Jump (µj)</label>
                                <input
                                  id="jump-mean"
                                  type="number" step="0.01"
                                  aria-label="Jump mean mu-j"
                                  className="w-full bg-[#0F1113] border border-white/5 rounded-lg py-1 px-2 text-white text-[10px] font-mono"
                                  value={jumpMean}
                                  onChange={(e) => setJumpMean(Number(e.target.value))}
                                />
                             </div>
                             <div>
                                <label htmlFor="jump-vol" className="text-[8px] uppercase font-bold text-[#848D97] mb-1 block">Jump_Vol (σj)</label>
                                <input
                                  id="jump-vol"
                                  type="number" step="0.01"
                                  aria-label="Jump volatility sigma-j"
                                  className="w-full bg-[#0F1113] border border-white/5 rounded-lg py-1 px-2 text-white text-[10px] font-mono"
                                  value={jumpVol}
                                  onChange={(e) => setJumpVol(Number(e.target.value))}
                                />
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  <FeatureGate
                    requiredTier="pro"
                    featureName="Scenario Stress Testing"
                    className="mt-4"
                  >
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                             <ShieldAlert size={14} className="text-[#FF453A]" />
                             <span className="text-[10px] font-bold text-white uppercase tracking-widest">Scenario_Stress_Test</span>
                          </div>
                          <button
                            onClick={() => setStressTest(stressTest ? null : { asset: portfolios.find(p => p.id === selectedPortfolioId)?.assets?.[0]?.symbol || 'BTC', magnitude: -0.20 })}
                            className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded transition-all",
                              stressTest ? "bg-[#FF453A] text-white" : "bg-white/10 text-[#848D97]"
                            )}
                          >
                            {stressTest ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                       </div>

                       {stressTest && (
                          <div className="space-y-4 animate-in fade-in zoom-in-95">
                             <div>
                                <label htmlFor="stress-target-asset" className="text-[8px] uppercase font-bold text-[#848D97] mb-1 block">Target_Asset</label>
                                <select
                                  id="stress-target-asset"
                                  aria-label="Select target asset for stress test"
                                  className="w-full bg-[#0F1113] border border-white/5 rounded-lg py-2 px-3 text-white text-[10px] font-mono"
                                  value={stressTest.asset}
                                  onChange={(e) => setStressTest({ ...stressTest, asset: e.target.value })}
                                >
                                   {portfolios.find(p => p.id === selectedPortfolioId)?.assets?.map((a: any) => (
                                     <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                                   ))}
                                </select>
                             </div>
                             <div>
                                <label htmlFor="stress-shock-magnitude" className="text-[8px] uppercase font-bold text-[#848D97] mb-1 block">Shock_Magnitude (Δ Price)</label>
                                <input
                                  id="stress-shock-magnitude"
                                  type="range" min="-0.99" max="0.99" step="0.01"
                                  aria-label="Stress test shock magnitude"
                                  className="w-full h-1 accent-[#FF453A]"
                                  value={stressTest.magnitude}
                                  onChange={(e) => setStressTest({ ...stressTest, magnitude: Number(e.target.value) })}
                                />
                                <div className="flex justify-between text-[8px] font-mono text-[#848D97]">
                                   <span className={stressTest.magnitude < 0 ? 'text-[#FF453A]' : 'text-[#34C759]'}>
                                      {Math.round(stressTest.magnitude * 100)}% PRICE SHOCK
                                   </span>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  </FeatureGate>
               </div>

               <div className="mt-8 pt-8 border-t border-white/5">
                  <button
                    onClick={handleRunSimulation}
                    className="w-full bg-[#00D9FF] text-[#05070A] py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:bg-[#00D9FF]/90 shadow-[0_0_20px_rgba(0,217,255,0.2)] flex items-center justify-center gap-3"
                  >
                     <Play size={18} fill="currentColor" /> Initialize_Simulation
                  </button>
               </div>
            </GlassCard>

            <GlassCard className="p-6 bg-[#FF453A]/5 border-[#FF453A]/20" intensity="low">
               <div className="flex gap-4">
                  <ShieldAlert className="text-[#FF453A] shrink-0 mt-0.5" size={20} />
                  <div>
                     <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Compute_Warning</h4>
                     <p className="text-[10px] text-[#FF453A]/80 leading-relaxed font-mono">
                        High-iteration simulations (n &gt; 5000) may exhaust local terminal resources. Proceed with caution on non-Pro accounts.
                     </p>
                  </div>
               </div>
            </GlassCard>

            {/* Recent History */}
            {history.length > 0 && (
              <GlassCard className="p-6" intensity="low">
                <div className="flex items-center gap-3 mb-6">
                  <History size={16} className="text-[#848D97]" />
                  <h3 className="text-xs uppercase font-bold tracking-[0.3em] text-[#848D97]">Recent_Artifacts</h3>
                </div>
                <div className="space-y-3">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="group flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-white font-bold truncate">Vault_{h.portfolios?.name?.substring(0, 10) || 'ROOT'}</p>
                        <p className="text-[9px] text-[#848D97] font-mono">{new Date(h.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => window.location.href = `/dashboard/results?id=${h.id}`}
                          className="p-1.5 text-[#00D9FF] hover:bg-[#00D9FF]/10 rounded"
                          title="View Simulation Results"
                          aria-label="View history item"
                        >
                          <ExternalLink size={12} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSimulation(e, h.id)}
                          className="p-1.5 text-[#848D97] hover:text-[#FF453A] hover:bg-[#FF453A]/10 rounded"
                          title="Purge Artifact"
                          aria-label="Delete history item"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
         </div>

         {/* Visual Terminal */}
         <div className="lg:col-span-8 flex flex-col gap-6">
            <GlassCard className="h-[460px] relative overflow-hidden group" intensity="high">
               <div className="absolute inset-0 bg-[#06060A]">
                  {/* Grid Lines Overlay */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                  }} />
                  
                  {/* Real-time Path Preview */}
                  <div className="absolute inset-0 flex items-center justify-center p-12">
                     <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <defs>
                           <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="rgba(0, 217, 255, 0)" />
                              <stop offset="50%" stopColor="rgba(0, 217, 255, 0.4)" />
                              <stop offset="100%" stopColor="rgba(0, 217, 255, 1)" />
                           </linearGradient>
                           <filter id="glow">
                              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                              <feMerge>
                                 <feMergeNode in="coloredBlur"/>
                                 <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                           </filter>
                        </defs>
                        
                        {/* Reference Line */}
                        <line 
                          x1="0" y1="50%" x2="100%" y2="50%" 
                          stroke="white" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4,4" 
                        />

                        {/* The Path */}
                        <path 
                           d={`M ${previewPath.map((v, i) => {
                             const x = (i / (previewPath.length - 1)) * 100;
                             // Normalize Y: map [0.5 * initialValue, 1.5 * initialValue] to [100%, 0%]
                             const minY = initialValue * 0.5;
                             const maxY = initialValue * 1.5;
                             const y = 100 - ((v - minY) / (maxY - minY)) * 100;
                             return `${x}% ${y}%`;
                           }).join(' L ')}`}
                           fill="none"
                           stroke="url(#pathGradient)"
                           strokeWidth="3"
                           filter="url(#glow)"
                           className="transition-all duration-300"
                        />
                        
                        {/* Endpoint indicator */}
                        {previewPath.length > 0 && (
                          <circle 
                            cx="100%" 
                            cy={`${100 - ((previewPath[previewPath.length - 1] - (initialValue * 0.5)) / (initialValue)) * 100}%`}
                            r="4" 
                            fill="#00D9FF" 
                            filter="url(#glow)"
                          />
                        )}
                      </svg>
                  </div>

                  <div className="absolute top-8 left-8 space-y-2 pointer-events-none">
                     <p className="text-[10px] font-mono text-white/40 select-none">LIVE_PATH_PREVIEW_V4</p>
                     <p className="text-[18px] font-mono text-[#00D9FF] font-bold select-none tabular-nums">
                        {formatCurrency(previewPath[previewPath.length -1] || initialValue)}
                     </p>
                     <p className="text-[10px] font-mono text-white/20 select-none uppercase">
                        Projected_Terminal_Value (est)
                     </p>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                     <LineChartIcon size={240} className="text-white" />
                  </div>
               </div>

               <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between gap-4 overflow-hidden">
                  <div className="flex items-center gap-2 md:gap-4">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-[#848D97] uppercase tracking-widest mb-1">Compute_Node</span>
                        <span className="text-xs font-mono text-white truncate max-w-[80px] md:max-w-none">EDGE_NODE_BETA</span>
                     </div>
                     <div className="w-px h-8 bg-white/10" />
                     <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-[#848D97] uppercase tracking-widest mb-1">Forecast_Engine</span>
                        <span className="text-xs font-mono text-[#00D9FF]">STOCHASTIC_V1</span>
                     </div>
                  </div>
                  
                  <div className="flex gap-2">
                     <div className="w-2 h-2 rounded-full bg-[#00D9FF] animate-pulse" />
                     <div className="w-2 h-2 rounded-full bg-white/5" />
                     <div className="w-2 h-2 rounded-full bg-white/5" />
                  </div>
               </div>
            </GlassCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <GlassCard className="p-6 flex items-start gap-4 hover:border-white/10 transition-all cursor-help group" intensity="low">
                  <Activity size={20} className="text-[#00D9FF] group-hover:scale-110 transition-transform" />
                  <div>
                     <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Monte_Carlo_Engine</h4>
                     <p className="text-[10px] text-[#848D97] leading-relaxed">Generates thousands of hypothetical market paths using Geometric Brownian Motion.</p>
                  </div>
               </GlassCard>

               <GlassCard className="p-6 flex items-start gap-4 hover:border-white/10 transition-all cursor-help group" intensity="low">
                  <Database size={20} className="text-[#7C3AED] group-hover:scale-110 transition-transform" />
                  <div>
                     <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Historical_Bootstrap</h4>
                     <p className="text-[10px] text-[#848D97] leading-relaxed">Resamples from historical returns to capture "fat-tail" risk events accurately.</p>
                  </div>
               </GlassCard>
            </div>
         </div>
      </div>
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        requiredTier={modalRequiredTier}
        featureName={modalFeatureName}
      />
    </div>
  );
}
