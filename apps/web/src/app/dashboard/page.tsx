'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

import { 
   Shield, 
   LucideIcon, 
   Download, 
   RefreshCw, 
   BarChart3, 
   PieChart, 
   Activity, 
   Layers, 
   Bell,
   ArrowUpRight,
   TrendingUp,
   Search,
   Filter,
   DollarSign,
   Cpu,
   PlusCircle,
   ExternalLink,
   ChevronRight,
   Maximize2,
   Database,
   Layout,
   ShieldCheck,
   Lock
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { TierBadge } from '@/components/ui/TierBadge';
import { PromotionTicker } from '@/components/layout/PromotionTicker';
import { InsightFeed, Insight } from '@/components/dashboard/InsightFeed';
import { MarketStatus } from '@/components/dashboard/MarketStatus'; // Added MarketStatus import
import { cn, formatCurrency } from '@/lib/utils';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useUser } from '@/components/UserContext';

export default function DashboardPage() {
   const [userProfile, setUserProfile] = useState<any>(null);
   const [totalAum, setTotalAum] = useState(0);
   const [stats, setStats] = useState({
      activeSims: 0,
      riskScore: 0,
      deployments: 0
   });
   const [isLoading, setIsLoading] = useState(false);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [isFeedOpen, setIsFeedOpen] = useState(false);
    const { profile } = useUser();
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [serviceStatus, setServiceStatus] = useState<'online' | 'offline' | 'checking'>('checking');
    const userTier = profile?.tier || 'free';

   const supabase = useMemo(() => createClient(), []);

   const fetchData = async () => {
      try {
         setIsLoading(true);
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return;

         // Execute independent queries in parallel for performance optimization
         const [
           profileRes,
           portfoliosRes,
           pricesRes,
           insightsRes,
           simsRes,
           miroSimsRes,
           notificationsRes
         ] = await Promise.all([
           supabase.from('user_profiles').select('*').eq('id', user.id).single(),
           supabase.from('portfolios').select('*').eq('user_id', user.id),
           supabase.from('prices').select('*').order('timestamp', { ascending: false }).limit(50),
           supabase.from('system_events').select('*').order('created_at', { ascending: false }).limit(5),
           supabase.from('simulations').select('id, status, result, created_at').eq('user_id', user.id),
           supabase.from('simulation_runs').select('id, status, interaction_graph, created_at').eq('user_id', user.id),
           supabase.from('user_notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
         ]);

         if (profileRes.data) setUserProfile(profileRes.data);
         
         const priceMap: Record<string, number> = {};
         (pricesRes.data || []).forEach(p => {
            if (!priceMap[p.symbol]) priceMap[p.symbol] = Number(p.price);
         });

         if (portfoliosRes.data) {
            let marketSum = 0;
            portfoliosRes.data.forEach(p => {
               if (Array.isArray(p.assets)) {
                  (p.assets as any[]).forEach(a => {
                     marketSum += Number(a.quantity || 0) * (priceMap[a.symbol] || Number(a.avg_price) || 0);
                  });
               } else {
                  marketSum += Number(p.total_value) || 0;
               }
            });
            setTotalAum(marketSum);
         }

         // Aggregate Insights from all sources
         const allInsights: Insight[] = [];

         // 1. System Events
         insightsRes.data?.forEach(e => allInsights.push({
            id: e.id,
            type: (e.event_type as any) || 'info',
            category: (e.category as any) || 'SYSTEM',
            message: e.message,
            time: e.created_at
         }));

         // 2. Simulations
         const combinedSims = [...(simsRes.data || []), ...(miroSimsRes.data || [])].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
         );

         combinedSims.slice(0, 5).forEach(s => allInsights.push({
            id: s.id,
            type: s.status === 'completed' ? 'success' : s.status === 'failed' ? 'error' : 'info',
            category: 'SYSTEM',
            message: ('interaction_graph' in s)
               ? `MiroFish Swarm_${s.id.substring(0, 8)} evolution finalized.`
               : (s.status === 'completed' 
                  ? `Simulation_${s.id.substring(0, 8)} finalized.` 
                  : `Simulation_${s.id.substring(0, 8)} status: ${s.status}.`),
            time: s.created_at
         }));

         // 3. Portfolios
         portfoliosRes.data?.slice(0, 2).forEach(p => allInsights.push({
            id: `p-${p.id}`,
            type: 'success',
            category: 'DEPLOYMENT',
            message: `Vault_${p.name.toUpperCase()} synced.`,
            time: new Date().toISOString(),
            metadata: { label: 'CAPITAL', value: formatCurrency(p.total_value || 0) }
         }));

         // 4. Notifications
         notificationsRes.data?.forEach(n => allInsights.push({
            id: `n-${n.id}`,
            type: n.type === 'error' ? 'error' : n.type === 'warning' ? 'warning' : 'info',
            category: 'SYSTEM',
            message: `${n.title}: ${n.message}`,
            time: n.created_at
         }));

         setInsights(allInsights.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));

         // Stats Calculation
         if (simsRes.data) {
            const allSims = [...simsRes.data, ...(miroSimsRes.data || [])];
            const active = allSims.filter(s => s.status === 'pending' || s.status === 'running').length;
            const completed = simsRes.data.filter(s => s.status === 'completed');
            let recentRisk = 0;
            if (completed.length > 0) {
               const varValue = (completed[0].result as any)?.value_at_risk || (completed[0].result as any)?.metrics?.var95;
               if (varValue) recentRisk = Math.min(Math.round(varValue * 100), 100);
            }

            setStats({
               riskScore: recentRisk || 15,
               activeSims: active,
               deployments: allSims.length
            });
         }
      } catch (error) {
         console.error('Registry Sync Failure:', error);
      } finally {
         setIsLoading(false);
      }
   };

      const checkHealth = async () => {
         try {
            const res = await fetch('/api/simulation/health');
            const data = await res.json();
            setServiceStatus(data.status);
         } catch {
            setServiceStatus('offline');
         }
      };

    useEffect(() => {
       fetchData();
       checkHealth();
       const healthInterval = setInterval(checkHealth, 30000); // Check every 30s

       // Subscribe to realtime changes
       const channel = supabase
          .channel('dashboard-sync')
          .on(
             'postgres_changes',
             { event: '*', schema: 'public', table: 'portfolios' },
             () => fetchData()
          )
          .on(
             'postgres_changes',
             { event: '*', schema: 'public', table: 'simulations' },
             () => fetchData()
          )
          .on(
             'postgres_changes',
             { event: '*', schema: 'public', table: 'simulation_runs' },
             () => fetchData()
          )
          .on(
             'postgres_changes',
             { event: '*', schema: 'public', table: 'prices' },
             () => fetchData()
          )
          .on(
             'postgres_changes',
             { event: '*', schema: 'public', table: 'user_notifications' },
             () => fetchData()
          )
          .on(
             'postgres_changes',
             { event: '*', schema: 'public', table: 'user_profiles' },
             () => fetchData()
          )
          .subscribe();

       return () => {
          supabase.removeChannel(channel);
          clearInterval(healthInterval);
       };
    }, [supabase]);

   const modules = [
      { title: 'STATION', sub: 'Asset Management', icon: Database, route: '/dashboard/assets', tier: 'free' },
      { title: 'VAULT', sub: 'Secure Holdings', icon: Shield, route: '/dashboard/portfolios', tier: 'free' },
      { title: 'STRAT', sub: 'Strategy Builder', icon: Layout, route: '/dashboard/portfolios/new', tier: 'free' },
      { title: 'MODEL', sub: 'Simulate Reality', icon: Activity, route: '/dashboard/simulate', tier: 'free' },
      { title: 'ORACLE', sub: 'AI Intelligence', icon: Cpu, route: '/dashboard/oracle', tier: 'plus' },
      { title: 'RISK', sub: 'Risk Assessment', icon: ShieldCheck, route: '/dashboard/risk', tier: 'pro' },
      { title: 'NEWS', sub: 'Financial News', icon: Bell, route: '/dashboard/news', tier: 'plus' },
      { title: 'SCREEN', sub: 'AI Screener', icon: Search, route: '/dashboard/screener', tier: 'pro' },
      { title: 'EARN', sub: 'Earnings AI', icon: BarChart3, route: '/dashboard/earnings', tier: 'pro' },
      { title: 'BIGDATA', sub: 'Market Analytics', icon: PieChart, route: '/dashboard/analytics/big-data', tier: 'pro' },
      { title: 'COMPARE', sub: 'Live Benchmark', icon: TrendingUp, route: '/dashboard/analytics/compare', tier: 'pro' },
      { title: 'AUTOMATE', sub: 'n8n Workflows', icon: Layers, route: '/dashboard/automations', tier: 'free' },
      { title: 'GUARD', sub: 'Risk Manager', icon: Lock, route: '/dashboard/risk-management', tier: 'plus' },
      { title: 'MIRO', sub: 'MiroFish Engine', icon: Layers, route: '/dashboard/mirofish', tier: 'pro' },
   ];

   const operatorName = userProfile?.first_name?.toUpperCase() || 'OPERATOR';

   return (
      <div className="flex flex-col min-h-full">
         <PromotionTicker />

         <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div className="space-y-2">
                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2 px-2 py-0.5 bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded text-[10px] font-bold text-[#00D9FF] uppercase tracking-widest">
                        <Activity size={10} />
                        Terminal_Active
                     </div>
                     <div className={cn(
                        "flex items-center gap-2 px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-widest",
                        serviceStatus === 'online' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                        serviceStatus === 'offline' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                        "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                     )}>
                        <Cpu size={10} />
                        Compute_{serviceStatus.toUpperCase()}
                     </div>
                     <MarketStatus />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter font-mono truncate max-w-[90vw]">
                     Console_<span className="text-[#00D9FF]">{operatorName}</span>
                  </h1>
                  <p className="text-[#848D97] text-sm font-mono uppercase tracking-widest">Institutional Portfolio Command & Control</p>
               </div>
               
               <Link 
                  href="/dashboard/portfolios/new"
                  className="group flex items-center justify-center gap-3 bg-white text-[#05070A] px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:bg-[#00D9FF] hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] w-full md:w-auto"
               >
                  <PlusCircle size={18} />
                  Initialize Portfolio
               </Link>
            </div>

            {/* Global Summary & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Global Allocation Card (Section 6.2) */}
               <GlassCard className="lg:col-span-2 p-8 relative overflow-hidden" intensity="high">
                  <div className="absolute top-8 right-8 z-20">
                     <button 
                       onClick={() => {
                          setIsLoading(true);
                          fetchData().finally(() => setIsLoading(false));
                       }}
                       disabled={isLoading}
                       className={cn(
                          "p-2 rounded-lg bg-white/5 border border-white/10 text-[#848D97] hover:text-[#00D9FF] hover:bg-white/10 transition-all",
                          isLoading && "animate-spin"
                       )}
                       title="Force Registry Refresh"
                     >
                        <RefreshCw size={16} />
                     </button>
                  </div>
                  
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                     <div className="w-48 h-48 border-[12px] border-white rounded-full flex items-center justify-center">
                        <div className="w-24 h-24 border-[8px] border-white rounded-full opacity-50" />
                     </div>
                  </div>

                  <div className="relative z-10">
                     <p className="text-[10px] uppercase tracking-[0.3em] text-[#848D97] font-bold mb-4">Total Assets Under Management</p>
                     <h2 className="text-3xl sm:text-4xl md:text-6xl font-mono font-bold text-white tracking-tighter mb-8 flex items-baseline gap-2 overflow-hidden">
                        <span className="text-[#00D9FF] text-xl sm:text-2xl md:text-4xl">$</span>
                        <span className="truncate">
                           {totalAum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                     </h2>

                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 pt-8 border-t border-white/5">
                        <div>
                           <span className="block text-[10px] text-[#848D97] uppercase tracking-widest mb-1">Risk Intensity</span>
                           <span className="text-lg font-mono font-bold text-[#FFD60A] uppercase tracking-wider">{stats.riskScore}% <span className="text-[10px] text-white/40">NOMINAL</span></span>
                        </div>
                        <div>
                           <span className="block text-[10px] text-[#848D97] uppercase tracking-widest mb-1">Active Sims</span>
                           <span className="text-lg font-mono text-white font-bold">{stats.activeSims} <span className="text-[10px] text-white/40">JOBS</span></span>
                        </div>
                        <div>
                           <span className="block text-[10px] text-[#848D97] uppercase tracking-widest mb-1">Deployments</span>
                           <span className="text-lg font-mono text-white font-bold">{stats.deployments} <span className="text-[10px] text-white/40">TOTAL</span></span>
                        </div>
                     </div>
                  </div>
               </GlassCard>

               {/* Real-time Feed / Achievements (Section 6.2) */}
               <GlassCard className="p-8 flex flex-col" intensity="medium">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97]">Vault_Insights</h3>
                     <div className="flex items-center gap-3">
                        <button 
                           onClick={() => setIsFeedOpen(true)}
                           className="p-1.5 rounded-lg hover:bg-white/5 text-[#848D97] hover:text-white transition-all"
                           title="Expand Insight Feed"
                           aria-label="Expand Insight Feed"
                        >
                           <Maximize2 size={14} />
                        </button>
                        <TrendingUp size={16} className="text-[#00D9FF]" />
                     </div>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                     <InsightFeed insights={insights.slice(0, 4)} />
                  </div>

                  <FeatureGate 
                    requiredTier="plus" 
                    featureName="Advanced Market Stream"
                    className="mt-6"
                  >
                     <button 
                        onClick={() => setIsFeedOpen(true)}
                        className="w-full py-3 rounded-xl border border-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#848D97] hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                     >
                        Access Full Data Stream
                        <ChevronRight size={14} />
                     </button>
                  </FeatureGate>
               </GlassCard>
            </div>

            {/* Expanded Feed Modal */}
            {isFeedOpen && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                  <div className="absolute inset-0 bg-[#05070A]/90 backdrop-blur-md" onClick={() => setIsFeedOpen(false)} />
                  <div className="relative w-full max-w-4xl h-full max-h-[80vh] animate-in zoom-in-95 duration-200">
                     <InsightFeed 
                        insights={insights} 
                        isExpanded 
                        onClose={() => setIsFeedOpen(false)} 
                     />
                  </div>
               </div>
            )}

            {/* Module Grid (Section 6.2) */}
             <div>
               <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-6">Functional_Modules</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {modules.map((m, i) => (
                    <div key={i}>
                      {m.tier !== 'free' ? (
                        <FeatureGate 
                          requiredTier={m.tier as any} 
                          featureName={m.title}
                          blur={false}
                        >
                          <Link href={m.route} className="block group h-full">
                            <GlassCard className="h-full p-6 transition-all group-hover:border-[#00D9FF]/30 group-hover:bg-[#00D9FF]/5" intensity="low">
                               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 transition-all group-hover:bg-[#00D9FF] group-hover:text-[#05070A]">
                                  <m.icon size={20} />
                               </div>
                               <h4 className="text-sm font-bold text-white mb-1 uppercase font-mono group-hover:text-[#00D9FF]">{m.title}</h4>
                               <p className="text-[10px] text-[#848D97] mb-3">{m.sub}</p>
                               
                               <div className="flex items-center justify-between">
                                  <TierBadge tier={m.tier as any} className="scale-75 origin-left" />
                                  <ArrowUpRight size={14} className="text-white/20 group-hover:text-[#00D9FF] transition-colors" />
                               </div>
                            </GlassCard>
                          </Link>
                        </FeatureGate>
                      ) : (
                        <Link href={m.route} className="block group h-full">
                          <GlassCard className="h-full p-6 transition-all group-hover:border-[#00D9FF]/30 group-hover:bg-[#00D9FF]/5" intensity="low">
                             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 transition-all group-hover:bg-[#00D9FF] group-hover:text-[#05070A]">
                                <m.icon size={20} />
                             </div>
                             <h4 className="text-sm font-bold text-white mb-1 uppercase font-mono group-hover:text-[#00D9FF]">{m.title}</h4>
                             <p className="text-[10px] text-[#848D97] mb-3">{m.sub}</p>
                             
                             <div className="flex items-center justify-between">
                                <TierBadge tier={m.tier as any} className="scale-75 origin-left" />
                                <ArrowUpRight size={14} className="text-white/20 group-hover:text-[#00D9FF] transition-colors" />
                             </div>
                          </GlassCard>
                        </Link>
                      )}
                    </div>
                  ))}
               </div>
            </div>

            {/* 2FA Banner (Section 6.2) */}
            {!userProfile?.mfa_enabled && (
               <div className="bg-gradient-to-r from-[#7C3AED]/20 to-transparent border border-[#7C3AED]/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                  <div className="absolute -right-12 -top-12 opacity-5 text-[#7C3AED]">
                     <Lock size={120} />
                  </div>
                  
                  <div className="flex items-center gap-6 relative z-10">
                     <div className="w-12 h-12 rounded-full bg-[#7C3AED] flex items-center justify-center text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                        <ShieldCheck size={24} />
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-white mb-1 uppercase tracking-tight">Security Upgrade Recommended</h4>
                        <p className="text-sm text-[#848D97]">Enable Two-Factor Authentication (2FA) to secure your institutional vault assets.</p>
                     </div>
                  </div>
                  
                  <Link href="/dashboard/settings/mfa" className="relative z-10 px-6 py-2.5 bg-[#7C3AED] text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-[#6D28D9] transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] shrink-0">
                  Enable 2FA Protocol
                  </Link>
               </div>
            )}
         </div>
        <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        requiredTier="plus"
        featureName="Institutional Modules"
      />
    </div>
  );
}
