'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Cpu, Zap, Globe, Activity, History as LucideHistory, Play, 
  Settings, Sliders, RefreshCcw, CheckCircle2, 
  XCircle, AlertTriangle, Clock, Plus, Trash2,
  ExternalLink, Search, Filter, MoreVertical,
  Terminal, Database, Radio, Share2, Send
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { useToast } from '../../../components/ui/ToastProvider';
import { HoloLoader } from '../../../components/ui/HoloLoader';

export default function AdminAutomationPage() {
  return (
    <Suspense fallback={<div className="loading mono p-24 text-center">SYNCHRONIZING_AUTOMATION_NODES...</div>}>
      <AutomationContent />
    </Suspense>
  );
}

function AutomationContent() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const { success, error, info } = useToast();

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoaderProgress(prev => (prev < 90 ? prev + Math.random() * 10 : prev));
      }, 150);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    fetchAutomationData();
  }, []);

  async function fetchAutomationData() {
    try {
      const { data: jobData } = await supabase.from('background_jobs').select('*').order('created_at', { ascending: false }).limit(20);
      const { data: hookData } = await supabase.from('webhooks').select('*').order('created_at', { ascending: false });

      if (jobData) setJobs(jobData);
      if (hookData) setWebhooks(hookData);
    } catch (e: any) {
      error('AUTOMATION_FAULT', e.message);
    }
    setLoading(false);
  }

  const toggleWebhook = async (id: string, current: boolean) => {
    const { error: err } = await supabase
      .from('webhooks')
      .update({ active: !current, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (!err) {
      success('INTEGRATION_SYNCED', `Webhook integration ${!current ? 'ACTIVATED' : 'DEACTIVATED'}.`);
      fetchAutomationData();
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'running': return 'text-cyan-400 bg-cyan-400/10 animate-pulse';
      case 'failed': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-white/5';
    }
  };

  if (loading) return (
    <HoloLoader 
      progress={loaderProgress} 
      phase="INIT_AUTOMATION_GUT" 
      isMuted={isMuted} 
      onToggleMute={() => setIsMuted(!isMuted)} 
    />
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] mb-2 block">Terminal // Automation_Gateway</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase font-jetbrains">Operations</h1>
        </div>
        
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] mono text-gray-400 hover:text-white transition-all">
              <LucideHistory size={14} />
              JOB_HISTORY
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-[10px] mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
              <Share2 size={14} />
              NEW_INTEGRATION
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Background Jobs Monitor */}
         <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-0 border-white/10 overflow-hidden" intensity="low">
               <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="mono text-[10px] font-black tracking-widest text-cyan-400 uppercase flex items-center gap-2">
                    <Activity size={14} className="animate-pulse" />
                    Cron_Pulse_Monitor
                  </h3>
                  <div className="flex items-center gap-2 text-[8px] mono text-gray-500 uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                    Engine_Operational
                  </div>
               </div>
               
               <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                     <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                           <th className="p-4 text-left mono text-[9px] text-gray-500 uppercase">Process_Node</th>
                           <th className="p-4 text-left mono text-[9px] text-gray-500 uppercase">Frequency</th>
                           <th className="p-4 text-center mono text-[9px] text-gray-500 uppercase">Status</th>
                           <th className="p-4 text-right mono text-[9px] text-gray-500 uppercase">Control</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/[0.02]">
                        {jobs.map((job) => (
                          <tr key={job.id} className="hover:bg-white/[0.02] transition-colors group">
                             <td className="p-4">
                                <div className="flex flex-col">
                                   <span className="text-[11px] font-bold text-gray-200">{job.name || 'CRON_JOB_UNRESOLVED'}</span>
                                   <span className="text-[8px] mono text-gray-600 font-bold uppercase tracking-tighter">ID: {job.id.split('-')[0]}</span>
                                </div>
                             </td>
                             <td className="p-4">
                                <div className="flex items-center gap-2 text-[10px] mono text-gray-400">
                                   <Clock size={12} />
                                   {job.schedule || 'ONCE'}
                                </div>
                             </td>
                             <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black mono uppercase ${getJobStatusColor(job.status)}`}>
                                   {job.status}
                                </span>
                             </td>
                             <td className="p-4 text-right">
                                <button className="p-2 text-gray-600 hover:text-cyan-400 transition-colors">
                                   <RefreshCcw size={14} />
                                </button>
                             </td>
                          </tr>
                        ))}
                        {jobs.length === 0 && <tr className="text-center py-10 mono text-[10px] text-gray-700 uppercase"><td>NO_ACTIVE_PROCESSES</td></tr>}
                     </tbody>
                  </table>
               </div>
            </GlassCard>

            {/* Integration Gateway */}
            <GlassCard className="p-8" intensity="low">
               <h3 className="mono text-[10px] font-black tracking-widest text-purple-400 uppercase mb-8 flex items-center gap-2">
                  <Share2 size={14} />
                  Outbound_Integrations
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {webhooks.map((hook) => (
                    <div key={hook.id} className="p-5 bg-white/5 border border-white/10 rounded-3xl group hover:border-purple-500/30 transition-all flex flex-col gap-4">
                       <div className="flex justify-between items-start">
                          <div className="p-3 rounded-2xl bg-white/5 text-gray-400 group-hover:text-purple-400 transition-all">
                             <Globe size={18} />
                          </div>
                          <button 
                            onClick={() => toggleWebhook(hook.id, hook.active)}
                            className={`p-1 rounded-full border border-white/10 transition-all ${hook.active ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-700'}`}
                          >
                             {hook.active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          </button>
                       </div>
                       <div>
                          <div className="text-[11px] font-bold text-white truncate max-w-[180px]">{hook.url}</div>
                          <div className="flex flex-wrap gap-1 mt-2">
                             {hook.event_types?.map((e: string) => (
                               <span key={e} className="px-1.5 py-0.5 bg-white/5 rounded text-[7px] mono text-gray-500">{e}</span>
                             ))}
                          </div>
                       </div>
                    </div>
                  ))}
                  {webhooks.length === 0 && (
                    <div className="col-span-2 py-10 text-center mono text-[10px] text-gray-700 border border-dashed border-white/10 rounded-3xl">
                       GATEWAY_IS_ISOLATED
                    </div>
                  )}
               </div>
            </GlassCard>
         </div>

         {/* Operational Health Sidebar */}
         <div className="space-y-6">
            <GlassCard className="p-6" intensity="low">
               <h3 className="mono text-[10px] font-black tracking-widest text-yellow-500 uppercase mb-6 flex items-center gap-2">
                  <Zap size={14} />
                  Realtime_Engine_Load
               </h3>
               
               <div className="space-y-6">
                  {[
                    { label: 'WORKER_CLUSTER_A', usage: 78, status: 'HIGH' },
                    { label: 'MESSAGE_BROKER', usage: 12, status: 'OPTIMAL' },
                    { label: 'DATABASE_POOL', usage: 45, status: 'NOMINAL' },
                  ].map(h => (
                    <div key={h.label} className="space-y-2">
                       <div className="flex justify-between text-[8px] mono uppercase tracking-widest">
                          <span className="text-gray-600">{h.label}</span>
                          <span className={`${h.usage > 70 ? 'text-red-400' : 'text-cyan-400'} font-black`}>{h.usage}%</span>
                       </div>
                       <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${h.usage > 70 ? 'bg-red-500/50' : 'bg-cyan-400/30'} rounded-full`} style={{ width: `${h.usage}%` }} />
                       </div>
                    </div>
                  ))}
               </div>
            </GlassCard>

            <GlassCard className="p-6 border-cyan-500/20" intensity="low">
               <h3 className="mono text-[10px] font-black tracking-widest text-cyan-400 uppercase mb-6 flex items-center gap-2">
                  <Terminal size={14} />
                  Admin_Accountability
               </h3>
               <p className="text-[10px] mono text-gray-500 mb-6 leading-relaxed">
                  Platform automation periodically generates system-wide accountability reports. Configure the weekly digest distribution parameters below.
               </p>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between mb-4">
                  <span className="text-[10px] mono text-gray-400 uppercase">Weekly_Digest</span>
                  <div className="w-8 h-4 bg-cyan-500/50 rounded-full relative">
                     <div className="absolute right-0 w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]" />
                  </div>
               </div>
               <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] mono text-gray-400 hover:text-white transition-all">
                  MODIFY_DISTRIBUTION_LIST
               </button>
            </GlassCard>
            
            <GlassCard className="p-6 border-red-500/20" intensity="low">
               <h3 className="mono text-[10px] font-black tracking-widest text-red-500 uppercase mb-6 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Dead_Letter_Queue
               </h3>
               <div className="flex justify-between items-center p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                  <div>
                     <div className="text-xl font-black text-red-500">12</div>
                     <div className="text-[8px] mono text-gray-600 uppercase">FAILED_TASK_SYNCS</div>
                  </div>
                  <button className="p-2 bg-red-500/10 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all">
                     <RefreshCcw size={16} />
                  </button>
               </div>
            </GlassCard>
         </div>
      </div>

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
