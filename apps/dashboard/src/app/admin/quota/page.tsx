'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Activity, Shield, Zap, Cpu, Database, Search, 
  BarChart3, Clock, AlertTriangle, User, ArrowUpRight,
  Filter, Calendar, RefreshCcw, Layers
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { HoloLoader } from '../../../components/ui/HoloLoader';
import { useToast } from '../../../components/ui/ToastProvider';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar 
} from 'recharts';

export default function AdminQuotaPage() {
  return (
    <Suspense fallback={<div className="loading mono p-24 text-center">INITIALIZING_ANALYTICS_STRATUM...</div>}>
      <QuotaContent />
    </Suspense>
  );
}

function QuotaContent() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests24h: 0,
    totalTokens24h: 0,
    activeUsers24h: 0,
    quotaBreaches24h: 0
  });
  const { error } = useToast();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // 1. Fetch recent sessions (Manual join in JS if needed, but trying Supabase rel first)
      const { data: sessionData, error: sError } = await supabase
        .from('ai_sessions')
        .select(`
          *,
          user_profiles!inner(email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (sError) {
        // Fallback if relationship is missing
        const { data: rawSessions } = await supabase
          .from('ai_sessions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (rawSessions) {
          // Cross-reference user emails manually for robustness
          const userIds = [...new Set(rawSessions.map(rs => rs.user_id))];
          const { data: profiles } = await supabase.from('user_profiles').select('id, email').in('id', userIds);
          const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.email]));
          
          setSessions(rawSessions.map(rs => ({
            ...rs,
            user: { email: profileMap[rs.user_id] || 'UNKNOWN_ENTITY' }
          })));
        }
      } else {
        setSessions(sessionData.map(s => ({ ...s, user: (s as any).user_profiles })));
      }

      // 2. Aggregate stats (24h)
      const { data: stats24h } = await supabase
        .from('ai_sessions')
        .select('id, tokens_in, tokens_out, user_id')
        .gte('created_at', yesterday);

      if (stats24h) {
        const uniqueUsers = new Set(stats24h.map(s => s.user_id));
        const totalTokens = stats24h.reduce((acc, s) => acc + (s.tokens_in || 0) + (s.tokens_out || 0), 0);
        
        setStats({
          totalRequests24h: stats24h.length,
          totalTokens24h: totalTokens,
          activeUsers24h: uniqueUsers.size,
          quotaBreaches24h: 0 // Logic for breaches tracking would go here
        });
      }

      // 3. Top Consumers
      const { data: consumers } = await supabase
        .from('user_profiles')
        .select('id, email, ai_daily_usage_count, ai_token_quota_override, tier')
        .order('ai_daily_usage_count', { ascending: false })
        .limit(10);

      if (consumers) setTopUsers(consumers);

    } catch (e: any) {
      error('TELEMETRY_FAULT', e.message);
    }
    setLoading(false);
  }

  // Trend data for chart
  const trendData = [
    { time: '00:00', requests: 45 },
    { time: '04:00', requests: 30 },
    { time: '08:00', requests: 120 },
    { time: '12:00', requests: 180 },
    { time: '16:00', requests: 150 },
    { time: '20:00', requests: 90 },
    { time: 'NOW', requests: stats.totalRequests24h / 24 }
  ];

  return (
     <div className="space-y-8 animate-fade-in pb-20 p-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] mb-2 block">Governance // AI Quota Matrix</span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase italic">Neural Bandwidth Telemetry</h1>
          <p className="text-gray-500 text-xs mono mt-1 tracking-widest">Real-time monitoring of large language model resource consumption.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <button onClick={fetchData} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all">
              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
           </button>
           <div className="h-10 w-px bg-white/10 mx-2" />
           <div className="flex flex-col items-end">
              <span className="mono text-[8px] text-gray-600 uppercase">System_Load</span>
              <span className="text-sm font-black text-green-500 tracking-tighter">STABLE_OPTIMAL</span>
           </div>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Neural_Requests_24h', value: stats.totalRequests24h, color: 'text-cyan-400', icon: Cpu },
          { label: 'Compute_Tokens_24h', value: `${(stats.totalTokens24h / 1000).toFixed(1)}k`, color: 'text-purple-400', icon: Zap },
          { label: 'Target_Entities_Active', value: stats.activeUsers24h, color: 'text-orange-400', icon: User },
          { label: 'Quota_Breaches', value: stats.quotaBreaches24h, color: 'text-red-400', icon: AlertTriangle },
        ].map((s, i) => (
          <GlassCard key={i} className="p-6 relative overflow-hidden border-white/5" intensity="low">
             <div className="flex justify-between items-start mb-4">
                <s.icon size={18} className={s.color} />
                <span className="text-[10px] mono text-gray-700">LIVE</span>
             </div>
             <span className="mono text-[10px] text-gray-500 uppercase tracking-widest block mb-1">{s.label}</span>
             <span className={`text-3xl font-black ${s.color} tracking-tighter`}>{s.value}</span>
             <GlowEffect color={s.color === 'text-cyan-400' ? 'cyan' : 'purple'} opacity={0.05} />
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Chart */}
         <GlassCard className="lg:col-span-2 p-8 border-white/5" intensity="low">
            <div className="flex justify-between items-center mb-10">
               <div className="flex items-center gap-3">
                  <BarChart3 className="text-cyan-400" size={20} />
                  <h3 className="text-lg font-bold text-white tracking-widest uppercase italic">Usage_Trajectory</h3>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[9px] mono text-gray-500 uppercase">Requests_Per_Interval</span>
               </div>
            </div>
            
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                     <defs>
                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                     <XAxis 
                       dataKey="time" 
                       stroke="#444" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fontFamily: 'monospace' }} 
                     />
                     <YAxis hide />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0b14', border: '1px solid #ffffff10', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ fontSize: '10px', fontFamily: 'monospace', color: '#22d3ee' }}
                        labelStyle={{ fontSize: '10px', marginBottom: '8px', color: '#666', fontFamily: 'monospace' }}
                        cursor={{ stroke: '#22d3ee20', strokeWidth: 2 }}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="requests" 
                        stroke="#22d3ee" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRequests)" 
                        animationDuration={2000}
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </GlassCard>

         {/* Consumer Leaderboard */}
         <GlassCard className="p-8 border-white/5 overflow-hidden" intensity="low">
            <h3 className="text-lg font-bold text-white tracking-widest uppercase italic mb-8 flex items-center gap-3">
               <Database className="text-purple-400" size={20} />
               High_Load_Nodes
            </h3>
            
            <div className="space-y-6">
               {topUsers.map((u, i) => (
                 <div key={i} className="group cursor-pointer">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-gray-300 group-hover:text-cyan-400 transition-colors uppercase truncate max-w-[150px]">{u.email?.split('@')[0]}</span>
                       <span className="text-[10px] mono text-gray-600 font-bold">{Math.round((u.ai_daily_usage_count / (u.ai_token_quota_override || (u.tier === 'pro' ? 100 : 10))) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_currentColor] ${u.ai_daily_usage_count >= (u.ai_token_quota_override || 10) * 0.8 ? 'bg-red-500' : 'bg-cyan-500'}`}
                         style={{ width: `${Math.min(100, (u.ai_daily_usage_count / (u.ai_token_quota_override || (u.tier === 'pro' ? 100 : 10))) * 100)}%` }}
                       />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                       <span className={`text-[8px] mono px-1.5 py-0.5 rounded border ${u.tier === 'pro' ? 'text-purple-400 border-purple-400/20' : 'text-gray-500 border-white/10'}`}>{u.tier?.toUpperCase()}</span>
                       <span className="text-[9px] mono text-cyan-500 font-black tracking-widest">{u.ai_daily_usage_count} REQ</span>
                    </div>
                 </div>
               ))}
               {topUsers.length === 0 && <div className="text-center py-20 mono text-[10px] text-gray-700">NO_ANALYTICS_FOUND</div>}
            </div>
         </GlassCard>
      </div>

      {/* Session Log */}
      <GlassCard className="p-8 border-white/5 overflow-hidden" intensity="low">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
               <Layers className="text-orange-400" size={20} />
               <h3 className="text-lg font-bold text-white tracking-widest uppercase italic">Live_Synapse_Registry</h3>
            </div>
            
            <div className="flex gap-4">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                  <input 
                    type="text" 
                    placeholder="INITIALIZE_FILTER..." 
                    className="bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-[10px] mono text-white focus:outline-none focus:border-cyan-500/50 w-[250px]"
                  />
               </div>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full border-collapse">
               <thead>
                  <tr className="border-b border-white/5 text-left">
                     <th className="p-4 mono text-[9px] text-gray-600 uppercase tracking-[0.2em] font-normal">TIMESTAMP</th>
                     <th className="p-4 mono text-[9px] text-gray-600 uppercase tracking-[0.2em] font-normal">ENTITY_IDENTIFIER</th>
                     <th className="p-4 mono text-[9px] text-gray-600 uppercase tracking-[0.2em] font-normal">MODEL_KERNEL</th>
                     <th className="p-4 mono text-[9px] text-gray-600 uppercase tracking-[0.2em] font-normal text-center">INGEST</th>
                     <th className="p-4 mono text-[9px] text-gray-600 uppercase tracking-[0.2em] font-normal text-center">EMIT</th>
                  </tr>
               </thead>
               <tbody>
                  {sessions.map((s, i) => (
                    <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group">
                       <td className="p-4">
                          <div className="flex items-center gap-2 text-[10px] mono text-gray-500">
                             <Clock size={12} className="text-cyan-500/30" />
                             {new Date(s.created_at).toLocaleTimeString()}
                          </div>
                       </td>
                       <td className="p-4">
                          <div className="flex items-center gap-3">
                             <div className="w-6 h-6 rounded bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center text-[9px] mono text-gray-400 font-bold uppercase">
                                {s.user?.email?.[0] || '?'}
                             </div>
                             <span className="text-[11px] font-bold text-gray-200 tracking-tight">{s.user?.email}</span>
                          </div>
                       </td>
                       <td className="p-4">
                          <span className="inline-block px-2 py-1 bg-white/5 border border-white/5 rounded text-[9px] mono text-gray-400 uppercase tracking-tighter">
                             {s.model_id}
                          </span>
                       </td>
                       <td className="p-4 text-center">
                          <span className="text-[10px] mono text-purple-400 font-bold">{s.tokens_in || 0} <span className="text-[8px] text-gray-700">TK</span></span>
                       </td>
                       <td className="p-4 text-center">
                          <span className="text-[10px] mono text-orange-400 font-bold">{s.tokens_out || 0} <span className="text-[8px] text-gray-700">TK</span></span>
                       </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center mono text-[10px] text-gray-600 uppercase">NO_SESSIONS_RECORDED_BY_ORACLE</td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </GlassCard>

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
