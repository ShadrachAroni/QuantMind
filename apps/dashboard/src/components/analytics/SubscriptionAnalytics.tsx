'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../ui/GlassCard';
import { BarChart3, TrendingUp, Users, DollarSign, Activity, X, ExternalLink, SlidersHorizontal } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis, AreaChart, Area, PieChart, Pie, Legend } from 'recharts';
import { AdjustmentModal } from '../admin/AdjustmentModal';

export function SubscriptionAnalytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    mrr: 0,
    tierDistribution: {
      free: 0,
      plus: 0,
      pro: 0,
      student: 0,
      admin: 0
    },
    mrrTrend: [] as any[],
    recentEvents: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [showRegistry, setShowRegistry] = useState(false);
  const [registryData, setRegistryData] = useState<any[]>([]);
  const [adjustingUser, setAdjustingUser] = useState<any>(null);

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('analytics_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchStats() {
    setLoading(true);
    
    // Fetch user profiles for tier distribution
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('tier');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return;
    }

    // Fetch active subscriptions for MRR calculation
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('status', 'active');

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return;
    }

    const distribution = { free: 0, plus: 0, pro: 0, student: 0, admin: 0 };
    profiles?.forEach(p => {
      const tier = (p.tier || 'free').toLowerCase();
      if (distribution.hasOwnProperty(tier)) {
        distribution[tier as keyof typeof distribution]++;
      }
    });

    // Approximate MRR (Monthly Recurring Revenue)
    const PRICE_MAP = { free: 0, plus: 9.99, pro: 19.99, student: 4.99, admin: 0 };
    let totalMRR = 0;
    subscriptions?.forEach(s => {
      const tier = (s.tier || 'free').toLowerCase();
      totalMRR += PRICE_MAP[tier as keyof typeof PRICE_MAP] || 0;
    });

    // Mock trend data
    const mrrTrend = [
      { month: 'JAN', mrr: totalMRR * 0.7 },
      { month: 'FEB', mrr: totalMRR * 0.8 },
      { month: 'MAR', mrr: totalMRR * 0.85 },
      { month: 'APR', mrr: totalMRR * 0.95 },
      { month: 'MAY', mrr: totalMRR }
    ];

    // Fetch recent events
    const { data: events } = await supabase
      .from('system_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    setStats({
      totalUsers: profiles?.length || 0,
      activeSubscriptions: subscriptions?.length || 0,
      mrr: totalMRR,
      tierDistribution: distribution,
      mrrTrend,
      recentEvents: events || []
    });
    setLoading(false);
  }

  async function fetchRegistry() {
    const { data } = await supabase
      .from('user_profiles')
      .select(`
        *,
        subscriptions:subscriptions(*)
      `)
      .not('subscriptions', 'is', null);
    
    const active = data?.filter(u => u.subscriptions?.some((s: any) => s.status === 'active')) || [];
    setRegistryData(active);
    setShowRegistry(true);
  }

  if (loading) return <div className="loading mono p-24 text-center">CALCULATING_METRICS...</div>;

  return (
    <div className="analytics-container space-y-8 animate-fade-in pb-20">
      <div className="metrics-pulse-bar flex gap-8 p-4 bg-white/5 border border-white/10 rounded-xl">
         <div className="pulse-item flex items-center gap-2">
            <span className="mono text-[10px] text-gray-500 uppercase">Engine_Status</span>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
            <span className="mono text-[10px] text-green-400 font-bold">OPTIMAL</span>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <GlassCard intensity="high" className="p-8 h-full">
            <div className="card-header border-b border-white/5 pb-4 mb-6">
              <div className="header-title flex items-center gap-3">
                <TrendingUp size={18} className="text-green-400" />
                <h2 className="text-sm font-bold text-white mono uppercase">REVENUE_EXPANSION_VECTOR</h2>
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.mrrTrend}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Area type="monotone" dataKey="mrr" stroke="#10B981" fillOpacity={1} fill="url(#colorMrr)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <div>
          <GlassCard intensity="high" className="p-8 h-full">
            <div className="card-header border-b border-white/5 pb-4 mb-6">
              <div className="header-title flex items-center gap-3">
                <Users size={18} className="text-purple-400" />
                <h2 className="text-sm font-bold text-white mono uppercase">USER_SEGMENTATION</h2>
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'FREE', value: stats.tierDistribution.free },
                      { name: 'PLUS', value: stats.tierDistribution.plus },
                      { name: 'PRO', value: stats.tierDistribution.pro },
                      { name: 'STUDENT', value: stats.tierDistribution.student },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#6b7280" />
                    <Cell fill="#06b6d4" />
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <GlassCard intensity="medium" className="p-8 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-green-500/10 transition-all" />
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <DollarSign size={24} />
            </div>
            <div>
              <span className="mono text-[10px] text-gray-500 uppercase tracking-widest">MONTHLY_RECURRING_REV</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white">${stats.mrr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className="text-[10px] mono text-green-500 font-bold">+12.4%</span>
              </div>
              <p className="text-[10px] text-gray-600 mono mt-2 leading-relaxed">Aggregated signal from active tiers.</p>
            </div>
        </GlassCard>

        <GlassCard intensity="medium" className="p-8 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-cyan-500/10 transition-all" />
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Users size={24} />
            </div>
            <div>
              <span className="mono text-[10px] text-gray-500 uppercase tracking-widest">REGISTRY_ENTRIES</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white">{stats.totalUsers.toLocaleString()}</span>
                <span className="text-[10px] mono text-cyan-500 font-bold">+4.2%</span>
              </div>
              <p className="text-[10px] text-gray-600 mono mt-2 leading-relaxed">Total identities convolved in kernel.</p>
            </div>
        </GlassCard>

        <GlassCard intensity="medium" className="p-8 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-purple-500/10 transition-all" />
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Activity size={24} />
            </div>
            <div>
              <span className="mono text-[10px] text-gray-500 uppercase tracking-widest">ACTIVE_SUBS_SIGNAL</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white">{stats.activeSubscriptions.toLocaleString()}</span>
                <span className="text-[10px] mono text-purple-500 font-bold">+2.1%</span>
              </div>
              <button 
                onClick={fetchRegistry}
                className="mt-4 flex items-center gap-2 text-[10px] mono text-cyan-400 hover:text-white transition-all uppercase tracking-widest"
              >
                 <ExternalLink size={12} />
                 VIEW_COMPLETE_REGISTRY
              </button>
            </div>
        </GlassCard>

        <div className="lg:col-span-3">
          <GlassCard intensity="high" className="p-8">
            <div className="card-header border-b border-white/5 pb-4 mb-8 flex justify-between items-center">
              <div className="header-title flex items-center gap-3">
                <BarChart3 size={18} className="text-cyan-400" />
                <h2 className="text-sm font-bold text-white mono uppercase">SUBSCRIPTION_MATRIX_DISTRIBUTION</h2>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'FREE', value: stats.tierDistribution.free, color: '#6b7280' },
                    { name: 'STUDENT', value: stats.tierDistribution.student, color: '#f59e0b' },
                    { name: 'PLUS', value: stats.tierDistribution.plus, color: '#06b6d4' },
                    { name: 'PRO', value: stats.tierDistribution.pro, color: '#8b5cf6' },
                    { name: 'ADMIN', value: stats.tierDistribution.admin, color: '#10B981' },
                  ]}
                >
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {[{color:'#6b7280'}, {color:'#f59e0b'}, {color:'#06b6d4'}, {color:'#8b5cf6'}, {color:'#10B981'}].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>

      {showRegistry && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-12 animate-fade-in">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowRegistry(false)} />
           <GlassCard className="relative w-full max-w-6xl h-full flex flex-col border-white/10" intensity="high">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                 <div>
                    <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] block mb-1">Registry // Active_Signals</span>
                    <h2 className="text-2xl font-black text-white tracking-widest uppercase italic">Subscription Matrix</h2>
                 </div>
                 <button onClick={() => setShowRegistry(false)} className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all">
                    <X size={24} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                 <table className="w-full border-collapse">
                    <thead>
                       <tr className="border-b border-white/5 text-left">
                          <th className="p-4 mono text-[10px] text-gray-600 uppercase">Entity_Identifier</th>
                          <th className="p-4 mono text-[10px] text-gray-600 uppercase">Tier_Level</th>
                          <th className="p-4 mono text-[10px] text-gray-600 uppercase text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody>
                       {registryData.map(user => (
                         <tr key={user.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                            <td className="p-4">
                               <div className="text-sm font-bold text-gray-200">{user.email}</div>
                               <div className="text-[9px] mono text-gray-600 truncate max-w-[200px]">{user.id}</div>
                            </td>
                            <td className="p-4">
                               <span className={`px-2 py-1 rounded text-[9px] font-black mono border ${user.tier === 'pro' ? 'text-purple-400 bg-purple-400/10 border-purple-400/20' : 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'}`}>
                                  {user.tier?.toUpperCase()}
                               </span>
                            </td>
                            <td className="p-4 text-right">
                               <button 
                                 onClick={() => setAdjustingUser(user)}
                                 className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-cyan-400 transition-all"
                               >
                                  <SlidersHorizontal size={14} />
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </GlassCard>
        </div>
      )}

      {adjustingUser && (
        <AdjustmentModal 
          user={adjustingUser} 
          onClose={() => setAdjustingUser(null)} 
          onUpdate={() => { fetchStats(); fetchRegistry(); }} 
        />
      )}

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
