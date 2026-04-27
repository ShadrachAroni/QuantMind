'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, Server, Layers, BarChart3, Shield, 
  Activity, Play, AlertTriangle, RefreshCw,
  Cpu, Database, Globe, Network, ArrowUp,
  Settings2, Sliders, Monitor
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { useToast } from '../../../components/ui/ToastProvider';

export default function ScalabilityCommandCenter() {
  const [scalingMode, setScalingMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [clusterState, setClusterState] = useState<any>({
    active_pods: 12,
    desired_pods: 12,
    cpu_utilization: 45,
    memory_utilization: 62,
    queue_depth: 154
  });
  const [dbStatus, setDbStatus] = useState({
    primary: 'ONLINE',
    replicas: [
      { id: 'replica-1', region: 'US-EAST', status: 'ONLINE', lag: '12ms' },
      { id: 'replica-2', region: 'EU-WEST', status: 'ONLINE', lag: '45ms' },
      { id: 'replica-3', region: 'AP-SOUTH', status: 'DEGRADED', lag: '240ms' }
    ]
  });
  const [loading, setLoading] = useState(false);
  const { info, error: toastError, success } = useToast();

  const triggerStressTest = async () => {
    setLoading(true);
    try {
      // Logic to trigger synthetic load test via Edge Function
      const { data, error } = await supabase.functions.invoke('admin-stress-test', {
        body: { concurrency: 5000, duration: '5m' }
      });
      if (error) throw error;
      info('STRESS_TEST_INITIATED: Injecting 5,000 synthetic operators...');
    } catch (e: any) {
      toastError(`TEST_FAILURE: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateScalingPolicy = async (pods: number) => {
    success(`ORCHESTRATION_UPDATE: Target cluster size adjusted to ${pods} units.`);
    setClusterState({ ...clusterState, desired_pods: pods });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-purple-400 uppercase tracking-[0.3em] mb-2 block">ADMIN // INFRASTRUCTURE // SCALABILITY</span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase">Scalability Command</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setScalingMode('AUTO')}
              className={`px-4 py-1.5 rounded-lg mono text-[10px] transition-all ${scalingMode === 'AUTO' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              AUTO_SCALE
            </button>
            <button 
              onClick={() => setScalingMode('MANUAL')}
              className={`px-4 py-1.5 rounded-lg mono text-[10px] transition-all ${scalingMode === 'MANUAL' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              MANUAL_CONTROL
            </button>
          </div>
        </div>
      </header>

      {/* Primary Metrics Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6">
           <div className="flex items-center justify-between mb-4">
              <span className="mono text-[10px] text-gray-500 uppercase">Compute_Units</span>
              <Cpu size={14} className="text-purple-400" />
           </div>
           <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{clusterState.active_pods}</span>
              <span className="mono text-[10px] text-gray-600">/ {clusterState.desired_pods} PODS</span>
           </div>
           <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-purple-500" style={{ width: '100%' }} />
              </div>
              <span className="mono text-[9px] text-purple-400">HEALTHY</span>
           </div>
        </GlassCard>

        <GlassCard className="p-6">
           <div className="flex items-center justify-between mb-4">
              <span className="mono text-[10px] text-gray-500 uppercase">Queue_Depth</span>
              <Layers size={14} className="text-cyan-400" />
           </div>
           <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{clusterState.queue_depth}</span>
              <span className="mono text-[10px] text-gray-600">TASKS_WAITING</span>
           </div>
           <div className="mt-4 flex items-center gap-1">
              <ArrowUp size={10} className="text-orange-400" />
              <span className="mono text-[9px] text-orange-400">+12% vs last_hour</span>
           </div>
        </GlassCard>

        <GlassCard className="p-6">
           <div className="flex items-center justify-between mb-4">
              <span className="mono text-[10px] text-gray-500 uppercase">Network_Ingress</span>
              <Globe size={14} className="text-green-400" />
           </div>
           <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">4.2</span>
              <span className="mono text-[10px] text-gray-600">GB/S</span>
           </div>
           <div className="mt-4 text-[9px] mono text-gray-500">PEAK_EXPECTED: 8.0 GB/S</div>
        </GlassCard>

        <GlassCard className="p-6">
           <div className="flex items-center justify-between mb-4">
              <span className="mono text-[10px] text-gray-500 uppercase">System_Load</span>
              <Activity size={14} className="text-red-500" />
           </div>
           <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{clusterState.cpu_utilization}%</span>
              <span className="mono text-[10px] text-gray-600">AVG_CPU</span>
           </div>
           <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-red-500/50" style={{ width: `${clusterState.cpu_utilization}%` }} />
           </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column — Cluster Orchestration */}
        <div className="lg:col-span-2 space-y-8">
           <GlassCard className="p-8" intensity="low">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-tight">Active Replicas & Scaling</h3>
                    <p className="text-xs text-gray-500 mono uppercase tracking-widest">Manual_Override_Active</p>
                 </div>
                 <Sliders size={20} className="text-gray-600" />
              </div>
              
              <div className="space-y-8">
                 <div>
                    <div className="flex justify-between mb-4">
                       <span className="mono text-[11px] text-gray-400 uppercase">Target_Replica_Count: {clusterState.desired_pods}</span>
                       <span className="mono text-[11px] text-purple-400 uppercase">Current: {clusterState.active_pods}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="50" 
                      aria-label="Target Replica Count"
                      value={clusterState.desired_pods}
                      onChange={(e) => updateScalingPolicy(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />

                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                       <h4 className="mono text-[10px] text-gray-500 uppercase mb-4">Scaling_Policy</h4>
                       <div className="space-y-3">
                          <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer">
                             <span className="mono text-[10px] text-white uppercase">Aggressive_Growth</span>
                             <input type="checkbox" defaultChecked aria-label="Enable Aggressive Growth Policy" className="accent-purple-500" />

                          </label>
                          <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer">
                             <span className="mono text-[10px] text-white uppercase">Predictive_Preload</span>
                             <input type="checkbox" aria-label="Enable Predictive Preload" className="accent-purple-500" />
                          </label>
                       </div>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                       <h4 className="mono text-[10px] text-gray-500 uppercase mb-4">Auto_Healing</h4>
                       <div className="space-y-3">
                          <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer">
                             <span className="mono text-[10px] text-white uppercase">Instant_Restart</span>
                             <input type="checkbox" defaultChecked aria-label="Enable System Management" className="accent-purple-500" />
                          </label>
                          <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer">
                             <span className="mono text-[10px] text-white uppercase">Zombie_Kill_Switch</span>
                             <input type="checkbox" defaultChecked aria-label="Enable Zombie Kill Switch" className="accent-purple-500" />
                          </label>
                       </div>
                    </div>
                 </div>
              </div>
           </GlassCard>

           {/* Stress Test Console */}
           <GlassCard className="p-8 relative overflow-hidden" intensity="high">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <AlertTriangle size={120} />
              </div>
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-500">
                    <Zap size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-white uppercase">Resilience Simulation</h3>
                    <p className="text-[10px] text-gray-500 mono uppercase tracking-widest">Chaos_Engineering // Stress_Testing</p>
                 </div>
              </div>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-xl font-mono text-[11px]">
                 Initiate a synthetic traffic surge to validate auto-scaling policies and database shard resilience. 
                 <span className="text-red-500/80 block mt-2">WARNING: This will consume substantial infra resources.</span>
              </p>
              <div className="flex flex-wrap gap-4">
                 <button 
                   onClick={triggerStressTest}
                   disabled={loading}
                   className="px-8 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-black mono text-[12px] uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all flex items-center gap-3"
                 >
                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                    ENGAGE_STRESS_TEST
                 </button>
                 <button className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-black mono text-[12px] uppercase tracking-widest transition-all">
                    CONFIG_PARAMETERS
                 </button>
              </div>
           </GlassCard>
        </div>

        {/* Right Column — Database & Caching Status */}
        <div className="space-y-8">
           <GlassCard className="p-8" intensity="low">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="mono text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Database_Replication</h3>
                 <Database size={18} className="text-cyan-400" />
              </div>
              
              <div className="space-y-6">
                 <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl border-l-2 border-l-green-500">
                    <div>
                       <span className="mono text-[8px] text-gray-500 uppercase block mb-1">Primary_Node</span>
                       <span className="mono text-[11px] font-bold text-white uppercase">US-EAST-1 // RW</span>
                    </div>
                    <span className="mono text-[9px] text-green-400 uppercase font-black tracking-tighter">ONLINE</span>
                 </div>

                 {dbStatus.replicas.map((replica) => (
                    <div key={replica.id} className={`p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between ${replica.status === 'DEGRADED' ? 'border-orange-500/30' : ''}`}>
                       <div>
                          <span className="mono text-[8px] text-gray-500 uppercase block mb-1">Replica // {replica.id}</span>
                          <span className="mono text-[11px] font-bold text-gray-300 uppercase">{replica.region} // RO</span>
                       </div>
                       <div className="text-right">
                          <span className={`mono text-[9px] uppercase font-black block ${replica.status === 'ONLINE' ? 'text-cyan-400' : 'text-orange-500'}`}>{replica.status}</span>
                          <span className="mono text-[8px] text-gray-600 block uppercase">Lag: {replica.lag}</span>
                       </div>
                    </div>
                 ))}
              </div>

              <button className="w-full mt-8 py-3 bg-white/5 border border-white/5 rounded-xl mono text-[10px] text-gray-400 uppercase hover:text-white hover:bg-white/10 transition-all">
                 PROVISION_NEW_REPLICA
              </button>
           </GlassCard>

           <GlassCard className="p-8" intensity="low">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="mono text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Cache_Mesh_Performance</h3>
                 <Zap size={18} className="text-yellow-400" />
              </div>
              
              <div className="space-y-4">
                 <div className="flex justify-between items-baseline">
                    <span className="mono text-[10px] text-gray-500 uppercase">HIT_RATE</span>
                    <span className="text-xl font-black text-white">94.2%</span>
                 </div>
                 <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: '94.2%' }} />
                 </div>
                 <div className="flex justify-between items-baseline mt-4">
                    <span className="mono text-[10px] text-gray-500 uppercase">EVICTION_RATE</span>
                    <span className="text-xl font-black text-white">0.4%</span>
                 </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/5">
                 <div className="flex items-center gap-3 text-[10px] text-gray-500 mono uppercase tracking-widest">
                    <Network size={14} className="text-gray-600" />
                    <span>Distribution: 8 NODES // 4 REGIONS</span>
                 </div>
              </div>
           </GlassCard>
        </div>
      </div>

      <style jsx>{`
         .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
         @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
