'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  DollarSign, CreditCard, TrendingUp, TrendingDown, Users,
  BarChart3, PieChart as PieChartIcon, Download, Search, 
  Filter, MoreVertical, X, Check, AlertCircle, 
  ArrowUpRight, ArrowDownRight, Clock, Plus, Tag,
  Zap, Shield, Globe, Landmark
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { useToast } from '../../../components/ui/ToastProvider';
import { HoloLoader } from '../../../components/ui/HoloLoader';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

export default function AdminRevenuePage() {
  return (
    <Suspense fallback={<div className="loading mono p-24 text-center">SYNCHRONIZING_GENERAL_LEDGER...</div>}>
      <RevenueContent />
    </Suspense>
  );
}

function RevenueContent() {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
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
    fetchFinancials();
    fetchCoupons();
  }, []);

  async function fetchFinancials() {
    try {
      const { data: transData } = await supabase
        .from('paystack_transactions')
        .select('*, user_profiles(email)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*, user_profiles(email)')
        .order('created_at', { ascending: false });

      if (transData) setTransactions(transData);
      if (subData) {
        setSubs(subData);
        // Process for MRR Chart (dummy grouping for demo, in prod use aggregate RPC)
        const monthlyData = [
          { name: 'JAN', mrr: 12400, churn: 1.2 },
          { name: 'FEB', mrr: 15600, churn: 1.1 },
          { name: 'MAR', mrr: 19800, churn: 0.9 },
          { name: 'APR', mrr: 24200, churn: 1.4 },
          { name: 'MAY', mrr: 21000, churn: 2.1 },
          { name: 'JUN', mrr: 28500, churn: 0.8 },
        ];
        setRevenueData(monthlyData);
      }
    } catch (e: any) {
      error('LEDGER_FAULT', e.message);
    }
    setLoading(false);
  }

  async function fetchCoupons() {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (data) setCoupons(data);
  }

  const manualTierOverride = async (userId: string, tier: string) => {
    const { error: err } = await supabase
      .from('user_profiles')
      .update({ tier })
      .eq('id', userId);
    
    if (!err) {
      success('TIER_OVERRIDE_ACTIVE', `User upgraded to ${tier.toUpperCase()} via admin command.`);
      fetchFinancials();
    }
  };

  if (loading) return (
    <HoloLoader 
      progress={loaderProgress} 
      phase="DECRYPTING_FINANCIAL_STREAMS" 
      isMuted={isMuted} 
      onToggleMute={() => setIsMuted(!isMuted)} 
    />
  );

  const totalRevenue = transactions.reduce((acc, curr) => acc + (curr.amount || 0), 0) / 100;
  const activeSubs = subs.filter(s => s.status === 'active').length;
  const failedSubs = subs.filter(s => s.status === 'past_due' || s.status === 'unpaid').length;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] mb-2 block">Governance // Revenue_Console</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase font-jetbrains">Financials</h1>
        </div>
        
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] mono text-gray-400 hover:text-white transition-all">
              <Download size={14} />
              REPORT_EXPORT
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-[10px] mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
              <Plus size={14} />
              NEW_ADJUSTMENT
           </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Total_Revenue', value: `$${totalRevenue.toLocaleString()}`, change: '+12.4%', up: true, icon: <DollarSign className="text-green-400" /> },
           { label: 'Active_Subscriptions', value: activeSubs, change: '+5.2%', up: true, icon: <Users className="text-cyan-400" /> },
           { label: 'Churn_Rate', value: '1.2%', change: '-0.3%', up: false, icon: <TrendingDown className="text-red-400" /> },
           { label: 'Failed_Payments', value: failedSubs, change: '+2', up: false, icon: <AlertCircle className="text-yellow-400" /> },
         ].map((stat, i) => (
           <GlassCard key={i} className="p-6 overflow-hidden group" intensity="low">
              <div className="flex justify-between items-start">
                 <div>
                    <span className="mono text-[8px] text-gray-600 block mb-1 uppercase tracking-widest">{stat.label}</span>
                    <span className="text-2xl font-black text-white">{stat.value}</span>
                 </div>
                 <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-white/10 transition-all">
                    {stat.icon}
                 </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                 <span className={`text-[10px] font-black mono flex items-center gap-1 ${stat.up ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {stat.change}
                 </span>
                 <span className="text-[8px] mono text-gray-700 uppercase">vs_last_cycle</span>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-all" />
           </GlassCard>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Chart */}
         <GlassCard className="lg:col-span-2 p-8" intensity="low">
            <div className="flex justify-between items-center mb-8">
               <h3 className="mono text-[10px] font-black tracking-widest text-cyan-400 uppercase flex items-center gap-2">
                  <TrendingUp size={14} />
                  MRR_Expansion_Vector
               </h3>
               <div className="flex gap-2">
                  {['7D', '30D', '90D', '1Y'].map(t => (
                    <button key={t} className={`px-3 py-1.5 rounded-lg text-[8px] mono border ${t === '30D' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-transparent text-gray-600'}`}>
                       {t}
                    </button>
                  ))}
               </div>
            </div>
            
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                     <defs>
                        <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                     <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'monospace' }} 
                     />
                     <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'monospace' }} 
                       tickFormatter={(v) => `$${v/1000}k`}
                     />
                     <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0F1016', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontFamily: 'monospace'
                        }}
                     />
                     <Area type="monotone" dataKey="mrr" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </GlassCard>

         {/* Subscriptions Overrides */}
         <GlassCard className="p-0 border-white/10 overflow-hidden" intensity="low">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
               <h3 className="mono text-[10px] font-black tracking-widest text-purple-400 uppercase flex items-center gap-2">
                  <CreditCard size={14} />
                  Active_Subscriptions
               </h3>
               <button className="text-[9px] mono text-gray-500 hover:text-white transition-colors">VIEW_ALL</button>
            </div>
            <div className="divide-y divide-white/[0.02] max-h-[400px] overflow-y-auto custom-scrollbar">
               {subs.slice(0, 5).map((sub) => (
                 <div key={sub.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-[10px] ${sub.tier === 'pro' ? 'text-purple-400' : 'text-cyan-400'}`}>
                             {sub.tier?.[0].toUpperCase()}
                          </div>
                          <div>
                             <div className="text-[11px] font-bold text-gray-200">{sub.user_profiles?.email?.split('@')[0]}</div>
                             <div className="text-[8px] mono text-gray-600 uppercase tracking-tighter">ENDS: {new Date(sub.current_period_end).toLocaleDateString()}</div>
                          </div>
                       </div>
                       <div className={`px-2 py-0.5 rounded text-[8px] font-black mono tracking-tighter ${sub.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                          {sub.status?.toUpperCase()}
                       </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => manualTierOverride(sub.user_id, 'pro')} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[8px] mono text-gray-400 hover:text-purple-400 hover:border-purple-400/20 transition-all">UPGRADE</button>
                       <button className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-red-400"><X size={12} /></button>
                    </div>
                 </div>
               ))}
               {subs.length === 0 && <div className="p-10 text-center mono text-[10px] text-gray-600">NO_ACTIVE_SUBSCRIPTIONS</div>}
            </div>
         </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Promo Engine */}
         <GlassCard className="p-8" intensity="low">
            <div className="flex justify-between items-center mb-8">
               <h3 className="mono text-[10px] font-black tracking-widest text-pink-400 uppercase flex items-center gap-2">
                  <Tag size={14} />
                  Promo_Engine
               </h3>
               <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                  <Plus size={16} />
               </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {coupons.map((coupon) => (
                 <div key={coupon.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-pink-500/30 transition-all relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                       <div className="px-3 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-lg text-[10px] mono font-bold tracking-widest">
                          {coupon.code}
                       </div>
                       <button className="text-gray-600 hover:text-white"><MoreVertical size={14} /></button>
                    </div>
                    <div className="space-y-1">
                       <div className="text-xl font-black text-white">{coupon.discount_percent}% OFF</div>
                       <div className="text-[9px] mono text-gray-500 uppercase tracking-widest">{coupon.current_redemptions} / {coupon.max_redemptions || '∞'} REDEEMED</div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                       <span className={`text-[8px] mono ${coupon.active ? 'text-green-500' : 'text-gray-600'}`}>{coupon.active ? 'ACTIVE' : 'DISABLED'}</span>
                       <span className="text-[8px] mono text-gray-700">EXPIRES: {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'NEVER'}</span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-pink-500/5 rounded-full blur-xl group-hover:bg-pink-500/10 transition-all" />
                 </div>
               ))}
               {coupons.length === 0 && (
                 <div className="col-span-2 py-10 text-center mono text-[10px] text-gray-700 border border-dashed border-white/10 rounded-3xl">
                    NO_ACTIVE_CAMPAIGNS
                 </div>
               )}
            </div>
         </GlassCard>

         {/* Transaction Ledger */}
         <GlassCard className="p-8" intensity="low">
            <h3 className="mono text-[10px] font-black tracking-widest text-yellow-400 uppercase mb-8 flex items-center gap-2">
               <Globe size={14} />
               Global_Transaction_Ledger
            </h3>
            
            <div className="space-y-4">
               {transactions.map((tx) => (
                 <div key={tx.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-white/20 transition-all group">
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-xl bg-white/5 ${tx.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                          <Landmark size={18} />
                       </div>
                       <div>
                          <div className="text-[11px] font-bold text-gray-200">{tx.user_profiles?.email?.split('@')[0].toUpperCase()}</div>
                          <div className="text-[8px] mono text-gray-600">{tx.reference}</div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-xs font-black text-white">${(tx.amount/100).toLocaleString()}</div>
                       <div className="text-[8px] mono text-gray-500">{new Date(tx.created_at).toLocaleTimeString()}</div>
                    </div>
                 </div>
               ))}
            </div>
         </GlassCard>
      </div>

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
