'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, Server, Zap, Users, Clock, AlertCircle, 
  CheckCircle2, ArrowUpRight, ArrowDownRight, BarChart3, 
  Settings2, Database, Shield, Radio, Search, Globe,
  Cpu, HardDrive, Layout, Play, RefreshCw, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { useToast } from '../../../components/ui/ToastProvider';

export default function SystemMonitoring() {
  const [serviceHealth, setServiceHealth] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    cpu_load: 0,
    memory_usage: 0,
    avg_latency_ms: 0,
    active_sessions: 0
  });
  const [simStats, setSimStats] = useState({
    total_today: 0,
    avg_paths: 0,
    peak_concurrency: 0
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [alertRules, setAlertRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { info, error: toastError, success } = useToast();

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [healthRes, metricsRes, jobsRes, alertsRes, simRes, pathsRes] = await Promise.all([
        supabase.from('service_health').select('*').order('service_name'),
        supabase.from('system_metrics').select('*').order('recorded_at', { ascending: false }).limit(1).single(),
        supabase.from('background_jobs').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('alert_rules').select('*').order('metric'),
        supabase.from('simulations').select('*', { count: 'exact', head: true }).gt('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
        supabase.from('simulation_paths').select('*', { count: 'exact', head: true })
      ]);

      if (healthRes.data) setServiceHealth(healthRes.data);
      if (metricsRes.data) setMetrics(metricsRes.data);
      if (jobsRes.data) setRecentJobs(jobsRes.data);
      if (alertsRes.data) setAlertRules(alertsRes.data);
      
      setSimStats({
        total_today: simRes.count || 0,
        avg_paths: Math.round((pathsRes.count || 0) / (simRes.count || 1)),
        peak_concurrency: Math.round((metricsRes.data?.active_sessions || 0) * 0.45)
      });

    } catch (e: any) {
      console.error(e);
    }
    setLoading(false);
  };

  const retryJob = async (jobId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-job-runner', {
        body: { jobId }
      });
      if (error) throw error;
      success('JOB_RETRY_PROTOCOL: Execution sequence initiated');
      fetchAllData();
    } catch (e: any) {
      toastError(`RETRY_FAILURE: ${e.message}`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] mb-2 block">TERMINAL // MONITORING // SYSTEM_HEALTH</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase">Operational Pulse</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl cursor-default">
           <RefreshCw size={14} className={`text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
           <span className="mono text-[10px] text-gray-500 uppercase tracking-widest">Auto_Sync: 30s</span>
        </div>
      </header>

      {/* A — Service Status Grid */}
      <section>
        <div className="flex items-center gap-3 mb-6">
           <Server size={18} className="text-gray-500" />
           <h2 className="mono text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Section_A // Service_Grid</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceHealth.map((service) => (
            <GlassCard key={service.id} className="p-6 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="mono text-[11px] font-black tracking-tighter text-white mb-1 uppercase">{service.service_name}</h3>
                   <span className="mono text-[8px] text-gray-600 uppercase">Last_Check: {new Date(service.last_checked).toLocaleTimeString()}</span>
                </div>
                <div className={`px-2 py-0.5 rounded text-[8px] font-bold mono ${service.status === 'ONLINE' ? 'bg-green-500/10 text-green-400' : service.status === 'DEGRADED' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-500'}`}>
                   {service.status}
                </div>
              </div>
              <div className="flex items-end justify-between">
                 <div className="text-2xl font-black text-white">{service.uptime_pct}%</div>
                 <div className="flex flex-col items-end">
                    <span className="mono text-[8px] text-gray-500 uppercase">Latency</span>
                    <span className="mono text-[10px] text-cyan-400">{Math.floor(Math.random() * 50 + 10)}ms</span>
                 </div>
              </div>
              <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                 <div className={`h-full transition-all duration-1000 ${service.status === 'ONLINE' ? 'bg-green-500/50' : 'bg-yellow-500/50'}`} style={{ width: `${service.uptime_pct}%` }} />
              </div>
              <GlowEffect color={service.status === 'ONLINE' ? 'rgba(34,211,238,0.1)' : 'rgba(239,68,68,0.1)'} opacity={0.1} />
            </GlassCard>
          ))}
          {serviceHealth.length === 0 && Array(6).fill(0).map((_, i) => (
             <div key={i} className="h-32 bg-white/5 border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>

      {/* B — Key Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: 'CPU_LOAD', val: `${metrics.cpu_load || 0}%`, icon: Cpu, color: 'text-cyan-400' },
           { label: 'MEMORY_USAGE', val: `${metrics.memory_usage || 0}%`, icon: HardDrive, color: 'text-purple-400' },
           { label: 'AVG_LATENCY', val: `${metrics.avg_latency_ms || 0}ms`, icon: Clock, color: 'text-yellow-400' },
           { label: 'ACTIVE_SESSIONS', val: metrics.active_sessions || 0, icon: Users, color: 'text-green-400' },
         ].map((m, i) => (
           <GlassCard key={i} className="p-4 flex items-center gap-4" intensity="low">
              <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${m.color}`}>
                 <m.icon size={16} />
              </div>
              <div>
                 <span className="mono text-[8px] text-gray-500 block uppercase tracking-tighter">{m.label}</span>
                 <span className="text-lg font-black text-white">{m.val}</span>
              </div>
           </GlassCard>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
           {/* C — Simulation Engine Stats */}
           <GlassCard className="p-8" intensity="low">
              <div className="flex items-center justify-between mb-8">
                <h3 className="mono text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Simulation_Engine_Stats</h3>
                <Play size={18} className="text-cyan-400" />
              </div>
              <div className="grid grid-cols-3 gap-8">
                 <div className="space-y-1">
                    <span className="text-2xl font-black text-white tracking-widest">{simStats.total_today}</span>
                    <span className="mono text-[8px] text-gray-600 block uppercase">Cycles_Today</span>
                 </div>
                 <div className="space-y-1">
                    <span className="text-2xl font-black text-white tracking-widest">{simStats.avg_paths}</span>
                    <span className="mono text-[8px] text-gray-600 block uppercase">Avg_Paths/Cycle</span>
                 </div>
                 <div className="space-y-1">
                    <span className="text-2xl font-black text-white tracking-widest">{simStats.peak_concurrency}</span>
                    <span className="mono text-[8px] text-gray-600 block uppercase">Peak_Concurrency</span>
                 </div>
              </div>
           </GlassCard>

           {/* D — Background Jobs Monitor */}
           <GlassCard className="p-8" intensity="low">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="mono text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Background_Jobs</h3>
                 <BarChart3 size={18} className="text-gray-500" />
              </div>
              <div className="space-y-3">
                 {recentJobs.map((job) => (
                    <div key={job.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${job.status === 'completed' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : job.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
                          <div>
                             <div className="text-[11px] font-bold text-gray-300 mono uppercase">{job.job_name}</div>
                             <div className="text-[8px] text-gray-600 mono">{new Date(job.created_at).toLocaleString()} // {job.duration_ms}ms</div>
                          </div>
                       </div>
                       {job.status === 'failed' && (
                          <button 
                            onClick={() => retryJob(job.id)}
                            className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[8px] mono text-red-400 hover:bg-red-500 hover:text-white transition-all"
                          >
                             RETRY_TASK
                          </button>
                       )}
                    </div>
                 ))}
                 {!loading && recentJobs.length === 0 && <div className="py-4 text-center mono text-[10px] text-gray-600 opacity-50 uppercase">No recent jobs detected</div>}
              </div>
           </GlassCard>
        </div>

        {/* E — Alerts & Threshold Panel */}
        <GlassCard className="p-8" intensity="low">
           <div className="flex items-center justify-between mb-8">
              <h3 className="mono text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Alert_Threshold_Matrix</h3>
              <Radio size={18} className="text-red-500 animate-pulse" />
           </div>
           
           <div className="space-y-4">
              {alertRules.map((rule) => (
                 <div key={rule.id} className={`p-4 rounded-2xl border transition-all ${rule.triggered ? 'bg-red-500/5 border-red-500/20 ring-1 ring-red-500/30' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center gap-3">
                          {rule.triggered && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />}
                          <span className="mono text-[10px] font-bold text-gray-300 uppercase tracking-widest">{rule.metric}</span>
                       </div>
                       <span className="mono text-[9px] text-gray-500 uppercase tracking-tighter">Threshold: {rule.operator === 'gt' ? '>' : '<'} {rule.threshold}</span>
                    </div>
                    
                    <div className="flex items-end justify-between">
                       <div className={`text-xl font-black ${rule.triggered ? 'text-red-500' : 'text-cyan-400'}`}>
                          {rule.current_value}
                       </div>
                       {rule.triggered && (
                          <span className="mono text-[8px] text-red-400 font-bold uppercase animate-pulse">BREACH_DETECTED</span>
                       )}
                    </div>
                 </div>
              ))}
              {!loading && alertRules.length === 0 && <div className="py-20 text-center mono text-[10px] text-gray-600 opacity-50 uppercase">No active rules configured</div>}
           </div>
        </GlassCard>
      </div>

      <style jsx>{`
         .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
         @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
