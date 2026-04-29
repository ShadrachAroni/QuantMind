'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Zap, Play, Square, AlertCircle, BarChart3, Database, 
  Cpu, Activity, Shield, Info, MoreVertical, X,
  Trash2, RefreshCcw, Search, Filter, Sliders,
  ArrowUpRight, Clock, Users, BrainCircuit, Plus
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { useToast } from '../../../components/ui/ToastProvider';
import { HoloLoader } from '../../../components/ui/HoloLoader';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { FeatureGate } from '../../../components/ui/FeatureGate';

export default function AdminSimulationsPage() {
  return (
    <Suspense fallback={<div className="loading mono p-24 text-center">SYNCHRONIZING_CORE_ENGINE...</div>}>
      <SimulationsContent />
    </Suspense>
  );
}

function SimulationsContent() {
  const [activeSims, setActiveSims] = useState<any[]>([]);
  const [aiConsumption, setAiConsumption] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedSim, setSelectedSim] = useState<any | null>(null);
  const [killLoading, setKillLoading] = useState<string | null>(null);
  const { success, error, info } = useToast();

  const [stats, setStats] = useState({
    activeThreads: 0,
    avgCompute: '0.0s',
    loadFactor: '0.00'
  });

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoaderProgress(prev => (prev < 90 ? prev + Math.random() * 10 : prev));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    fetchSimulations();
    fetchAIUsage();
    
    // Subscribe to real-time simulation updates
    const channel = supabase
      .channel('admin_simulations_pulse')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'simulations' }, () => {
        fetchSimulations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchSimulations() {
    const { data } = await supabase
      .from('simulations')
      .select('*, user_profiles(email, tier)')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) {
      setActiveSims(data);
      const running = data.filter(s => s.status === 'running').length;
      const completed = data.filter(s => s.status === 'completed' && s.duration_ms);
      const avgDur = completed.length > 0 
        ? (completed.reduce((acc, curr) => acc + curr.duration_ms, 0) / completed.length / 1000).toFixed(1) + 's'
        : '0.0s';
      
      setStats({
        activeThreads: running,
        avgCompute: avgDur,
        loadFactor: (running / 24).toFixed(2) // Normalized to 24 parallel worker threads
      });
    }
    setLoading(false);
  }

  async function fetchAIUsage() {
    const { data } = await supabase
      .from('ai_sessions')
      .select('model_id, tokens_in, tokens_out, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (data) {
      // Aggregate by model
      const modelStats = data.reduce((acc: any, curr: any) => {
        const key = curr.model_id;
        if (!acc[key]) acc[key] = { name: key, tokens: 0, count: 0 };
        acc[key].tokens += (curr.tokens_in + curr.tokens_out);
        acc[key].count += 1;
        return acc;
      }, {});
      setAiConsumption(Object.values(modelStats));
    }
  }

  const terminateJob = async (id: string) => {
    setKillLoading(id);
    const { error: err } = await supabase
      .from('simulations')
      .update({ 
        status: 'failed', 
        error_message: 'TERMINATED_BY_ADMIN_OVERRIDE',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (!err) {
      success('DANGER_PROTOCOL_ACTIVE', 'Simulation job terminated successfully.');
      fetchSimulations();
    } else {
      error('PROTOCOL_FAULT', err.message);
    }
    setKillLoading(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'running': return 'text-cyan-400 bg-cyan-400/10 animate-pulse';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'failed': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-white/5';
    }
  };

  if (loading) return (
    <HoloLoader 
      progress={loaderProgress} 
      phase="INITIALIZING_CORE_SYSTEMS" 
      isMuted={isMuted} 
      onToggleMute={() => setIsMuted(!isMuted)} 
    />
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      {/* Sovereign Intelligence Overlay */}
      {selectedSim && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={() => setSelectedSim(null)} />
          <GlassCard className="relative w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col border-white/10 shadow-2xl animate-scale-in" intensity="high">
             <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-purple-500/20 rounded-2xl">
                      <BrainCircuit className="text-purple-400" size={24} />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-white italic mono tracking-tighter uppercase">SOVEREIGN_INTELLIGENCE_REPORT</h2>
                      <p className="text-[10px] text-gray-500 mono uppercase tracking-widest">Ensemble Multi-Model Optimization // Job_{selectedSim.id.split('-')[0]}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedSim(null)} 
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  aria-label="Close Sovereign Intelligence Report"
                  title="Close Report"
                >
                   <X size={20} className="text-gray-500" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
                {/* Confidence Meter */}
                <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 flex items-center justify-center">
                         <span className="text-xs font-black text-purple-400">{(selectedSim.sovereign_intelligence?.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                         <span className="text-[10px] font-black text-gray-500 mono uppercase block mb-1">Inference_Confidence</span>
                         <span className="text-xs font-medium text-white italic">Multi-agent consensus achieved.</span>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] mono text-gray-400 uppercase">Minimax-M2.7</span>
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] mono text-gray-400 uppercase">Llama-3.1-70B</span>
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] mono text-gray-400 uppercase">Mixtral-8x22B</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Risk Report (Minimax) */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-pink-400">
                         <Shield size={16} />
                         <span className="text-[11px] font-black mono uppercase tracking-widest">Tail_Risk_Audit // MINIMAX</span>
                      </div>
                      <div className="p-6 bg-pink-500/5 border border-pink-500/10 rounded-3xl min-h-[200px]">
                         <p className="text-xs text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">
                            {selectedSim.sovereign_intelligence?.risk_report || "NO_RISK_DATA_AVAILABLE"}
                         </p>
                      </div>
                   </div>

                   {/* Strategy Report (Llama) */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-cyan-400">
                         <BrainCircuit size={16} />
                         <span className="text-[11px] font-black mono uppercase tracking-widest">Alpha_Strategy // LLAMA_3.1</span>
                      </div>
                      <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-3xl min-h-[200px]">
                         <p className="text-xs text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">
                            {selectedSim.sovereign_intelligence?.strategy_report || "NO_STRATEGY_DATA_AVAILABLE"}
                         </p>
                      </div>
                   </div>
                </div>

                {/* Macro Insight (Mixtral) */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-purple-400">
                      <Activity size={16} />
                      <span className="text-[11px] font-black mono uppercase tracking-widest">Global_Macro_Context // MIXTRAL</span>
                   </div>
                   <div className="p-8 bg-purple-500/5 border border-purple-500/10 rounded-3xl">
                      <p className="text-xs text-gray-300 leading-relaxed font-medium italic">
                         {selectedSim.sovereign_intelligence?.macro_report || "GLOBAL_CORRELATION_NOMINAL"}
                      </p>
                   </div>
                </div>
             </div>

             <div className="p-6 border-t border-white/5 bg-black/40 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] mono text-gray-600">
                   <Info size={12} />
                   Sovereign Intelligence reports are generated using NVIDIA NIM cloud-native ensembles.
                </div>
                <button 
                  onClick={() => setSelectedSim(null)}
                  className="px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all"
                >
                   CLOSE_TERMINAL
                </button>
             </div>
          </GlassCard>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] mb-2 block">Terminal // Simulation_Control</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase font-jetbrains">Core Engine</h1>
        </div>
        
        <div className="flex items-center gap-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
           <div className="flex flex-col border-r border-white/10 pr-6">
              <span className="mono text-[8px] text-gray-500 uppercase">Active_Threads</span>
              <span className="text-xl font-black text-cyan-400 tracking-tighter">{stats.activeThreads}</span>
           </div>
           <div className="flex flex-col border-r border-white/10 pr-6 pl-2">
              <span className="mono text-[8px] text-gray-500 uppercase">Avg_Compute</span>
              <span className="text-xl font-black text-purple-400 tracking-tighter">{stats.avgCompute}</span>
           </div>
           <div className="flex flex-col pl-2">
              <span className="mono text-[8px] text-gray-500 uppercase">Load_Factor</span>
              <span className="text-xl font-black text-white tracking-tighter">{stats.loadFactor}</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Live Monitor Table */}
         <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-0 border-white/10 overflow-hidden" intensity="low">
               <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="mono text-[10px] font-black tracking-widest text-cyan-400 uppercase flex items-center gap-2">
                    <Activity size={14} className="animate-pulse" />
                    Live_Job_Stream
                  </h3>
                  <div className="flex items-center gap-2 text-[8px] mono text-gray-500 uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                    Realtime_Active
                  </div>
               </div>
               
               <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                     <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                           <th className="p-4 text-left mono text-[9px] text-gray-500">ENTITY</th>
                           <th className="p-4 text-left mono text-[9px] text-gray-500">THROUGHPUT</th>
                           <th className="p-4 text-center mono text-[9px] text-gray-500">STATUS</th>
                           <th className="p-4 text-right mono text-[9px] text-gray-500">CONTROL</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/[0.02]">
                        {activeSims.map((sim) => (
                          <tr key={sim.id} className="hover:bg-white/[0.02] transition-colors group">
                             <td className="p-4">
                                <div className="flex items-center gap-3">
                                   <div className="flex flex-col">
                                      <span className="text-[11px] font-bold text-gray-200">{sim.user_profiles?.email || 'SYSTEM'}</span>
                                      <span className="text-[8px] mono text-gray-600">{sim.id.split('-')[0]}</span>
                                   </div>
                                   {sim.sovereign_intelligence && (
                                     <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-400 animate-pulse" title="Sovereign Intelligence Active">
                                        <BrainCircuit size={10} />
                                     </div>
                                   )}
                                </div>
                             </td>
                             <td className="p-4">
                                <div className="flex flex-col">
                                   <span className="text-[11px] font-black text-white">{sim.num_paths?.toLocaleString()} paths</span>
                                   <span className="text-[8px] mono text-gray-600 uppercase">
                                     {sim.duration_ms 
                                       ? `${sim.duration_ms}ms (${Math.round(sim.num_paths / (sim.duration_ms / 1000))} p/s)` 
                                       : 'COMPUTING...'}
                                   </span>
                                </div>
                             </td>
                             <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black mono tracking-tighter uppercase ${getStatusColor(sim.status)}`}>
                                   {sim.status}
                                </span>
                             </td>
                             <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                   {sim.sovereign_intelligence && (
                                     <button 
                                       onClick={() => setSelectedSim(sim)}
                                       className="p-2 border border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white rounded-lg transition-all"
                                       aria-label="View Intelligence Report"
                                       title="View Intelligence Report"
                                     >
                                        <BrainCircuit size={12} />
                                     </button>
                                   )}
                                   {sim.status === 'running' || sim.status === 'pending' ? (
                                     <button 
                                       onClick={() => terminateJob(sim.id)}
                                       disabled={killLoading === sim.id}
                                       className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                       aria-label="Terminate Job"
                                       title="Terminate Job"
                                     >
                                        <Square size={12} fill="currentColor" />
                                     </button>
                                   ) : (
                                     <div className="p-2 text-gray-700 opacity-20">
                                        <RefreshCcw size={12} />
                                     </div>
                                   )}
                                </div>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </GlassCard>
         </div>

         {/* Sidebar Controls & Asset Manager */}
         <div className="space-y-6">
            <GlassCard className="p-6" intensity="low">
               <h3 className="mono text-[10px] font-black tracking-widest text-purple-400 uppercase mb-6 flex items-center gap-2">
                  <Shield size={14} />
                  Resource_Quotas
               </h3>
               
               <div className="space-y-4">
                  {[
                    { tier: 'FREE', limit: '0', color: 'bg-gray-500', current: 0 },
                    { tier: 'PLUS', limit: '10K', color: 'bg-cyan-500', current: 10000 },
                    { tier: 'PRO', limit: '100K', color: 'bg-purple-500', current: 100000 },
                  ].map(q => (
                    <div key={q.tier} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-white/20 transition-all">
                       <div>
                          <span className="mono text-[8px] text-gray-600 block mb-1 uppercase tracking-widest">{q.tier}_TIER</span>
                          <span className="text-xl font-black text-white">{q.limit}</span>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="mono text-[8px] text-gray-600 uppercase mb-1">Override_Status</span>
                          <span className="text-[10px] mono text-gray-400">NOMINAL</span>
                       </div>
                    </div>
                  ))}
               </div>
               
               <button className="w-full mt-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] mono text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  OVERRIDE_USER_IDENTIFIER
               </button>
            </GlassCard>

            <FeatureGate featureName="Advanced Asset Manager" requiredTier="plus">
               <GlassCard className="p-6" intensity="low">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="mono text-[10px] font-black tracking-widest text-pink-400 uppercase flex items-center gap-2">
                        <Database size={14} />
                        Asset_Library
                     </h3>
                     <button 
                        className="p-1.5 bg-white/5 rounded-lg text-gray-400 hover:text-white"
                        aria-label="Add Asset"
                        title="Add Asset"
                     >
                        <Plus size={12} />
                     </button>
                  </div>
                  
                  <div className="space-y-3">
                     {['AAPL', 'TSLA', 'BTC', 'ETH', 'GOLD'].map((ticker, i) => (
                       <div key={ticker} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-300">
                                {ticker[0]}
                             </div>
                             <div>
                                <div className="text-[10px] font-bold text-gray-200">{ticker}</div>
                                <div className="text-[8px] mono text-gray-600 uppercase">TIER_{i < 3 ? 'FREE' : 'PRO'}</div>
                             </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               className="p-1.5 hover:text-cyan-400 transition-colors"
                               aria-label="More Options"
                               title="More Options"
                             >
                               <MoreVertical size={12} />
                             </button>
                          </div>
                       </div>
                     ))}
                  </div>
               </GlassCard>
            </FeatureGate>

            <FeatureGate featureName="AI Oracle Models" requiredTier="pro">
               <GlassCard className="p-6" intensity="low">
                  <h3 className="mono text-[10px] font-black tracking-widest text-yellow-400 uppercase mb-6 flex items-center gap-2">
                     <BrainCircuit size={14} />
                     AI_Oracle_Burn
                  </h3>
                  
                  <div className="h-[200px] w-full mt-4">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={aiConsumption}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="tokens"
                         >
                           {aiConsumption.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={['#06b6d4', '#8b5cf6', '#eab308'][index % 3]} />
                           ))}
                         </Pie>
                         <Tooltip 
                           contentStyle={{ 
                             backgroundColor: '#0F1016', 
                             border: '1px solid rgba(255,255,255,0.1)',
                             borderRadius: '12px',
                             fontSize: '10px',
                             fontFamily: 'monospace'
                           }}
                         />
                       </PieChart>
                     </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                     {aiConsumption.map((m, i) => (
                       <div key={m.name} className="flex justify-between items-center text-[10px] mono">
                          <span className="text-gray-500 uppercase">{m.name}</span>
                          <span className="text-gray-200 font-bold">{m.tokens.toLocaleString()} tokens</span>
                       </div>
                     ))}
                  </div>
               </GlassCard>
            </FeatureGate>
         </div>
      </div>

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
