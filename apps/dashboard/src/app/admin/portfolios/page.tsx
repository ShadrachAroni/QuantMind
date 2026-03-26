'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Wallet, Search, Filter, MoreVertical, Trash2, 
  ExternalLink, Calendar, User, Database, Shield,
  ArrowRight, Activity, Clock, RefreshCcw, Tag
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { useToast } from '../../../components/ui/ToastProvider';
import { LoadingOverlay } from '../../../components/ui/LoadingOverlay';

export default function AdminPortfoliosPage() {
  return (
    <Suspense fallback={<div className="loading mono p-24 text-center">ACCESSING_PORTFOLIO_STRATUM...</div>}>
      <PortfoliosContent />
    </Suspense>
  );
}

function PortfoliosContent() {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({ total: 0, distinctUsers: 0, avgAssets: 0 });
  const { success, error, info } = useToast();

  useEffect(() => {
    fetchPortfolios();
    
    const channel = supabase
      .channel('admin_portfolios_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolios' }, () => {
        fetchPortfolios();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPortfolios() {
    try {
      const { data, error: err } = await supabase
        .from('portfolios')
        .select(`
          *,
          user_profiles(email, tier)
        `)
        .order('updated_at', { ascending: false });

      if (err) throw err;

      if (data) {
        setPortfolios(data);
        
        // Calculate Statistics
        const userSet = new Set(data.map(p => p.user_id));
        const totalAssets = data.reduce((acc, p) => acc + (p.assets?.length || 0), 0);
        
        setStats({
          total: data.length,
          distinctUsers: userSet.size,
          avgAssets: data.length > 0 ? Math.round(totalAssets / data.length * 10) / 10 : 0
        });
      }
    } catch (e: any) {
      error('REGISTRY_FAULT', e.message);
    } finally {
      setLoading(false);
    }
  }

  const deletePortfolio = async (id: string) => {
    if (!confirm('ARCHIVE_COMMAND_CONFIRMED? This operation cannot be reversed.')) return;
    
    const { error: err } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', id);
    
    if (err) {
      error('ARCHIVE_FAULT', err.message);
    } else {
      success('DECOMMISSION_CORE', 'Portfolio successfully archived from system registry.');
      fetchPortfolios();
    }
  };

  const filteredPortfolios = portfolios.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                          (filterType === 'pro' && p.user_profiles?.tier === 'pro') ||
                          (filterType === 'multi-asset' && (p.assets?.length || 0) > 3);
    return matchesSearch && matchesFilter;
  });

  if (loading) return <LoadingOverlay visible={true} message="SYNCING_GLOBAL_LEDGER..." />;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] mb-2 block">Governance // Asset_Registry</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase">Portfolio Suite</h1>
          <p className="text-gray-500 text-xs mono mt-1 tracking-widest">Management of decentralized investment nodes across the ecosystem.</p>
        </div>
        
        <div className="flex items-center gap-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
           <div className="flex flex-col border-r border-white/10 pr-6">
              <span className="mono text-[8px] text-gray-500 uppercase">Total_Portfolios</span>
              <span className="text-xl font-black text-cyan-400">{stats.total}</span>
           </div>
           <div className="flex flex-col border-r border-white/10 pr-6 pl-2">
              <span className="mono text-[8px] text-gray-500 uppercase">Active_Owners</span>
              <span className="text-xl font-black text-purple-400">{stats.distinctUsers}</span>
           </div>
           <div className="flex flex-col pl-2">
              <span className="mono text-[8px] text-gray-500 uppercase">Asset_Density</span>
              <span className="text-xl font-black text-white">{stats.avgAssets}</span>
           </div>
        </div>
      </header>

      {/* Grid Controls */}
      <GlassCard className="p-6" intensity="low">
         <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
               <input 
                 type="text"
                 placeholder="INITIALIZE_SEARCH: NAME, EMAIL, OR UUID..."
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-[11px] mono text-white focus:outline-none focus:border-cyan-500/50"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            
            <div className="flex items-center gap-2">
               {['all', 'pro', 'multi-asset'].map(t => (
                 <button 
                   key={t}
                   onClick={() => setFilterType(t)}
                   className={`px-4 py-2 rounded-lg text-[9px] mono tracking-[0.2em] transition-all border ${filterType === t ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-transparent text-gray-500'}`}
                 >
                   {t.toUpperCase().replace('-', '_')}
                 </button>
               ))}
               <button 
                 onClick={fetchPortfolios}
                 className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                 title="REFRESH_PROTOCOL"
               >
                 <RefreshCcw size={16} />
               </button>
            </div>
         </div>
      </GlassCard>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredPortfolios.map((p) => (
           <GlassCard key={p.id} className="p-6 relative group overflow-hidden" intensity="low">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                      <Wallet className="text-cyan-400" size={20} />
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-white tracking-widest uppercase">{p.name || 'UNNAMED_NODE'}</h4>
                      <p className="text-[9px] mono text-gray-500 uppercase tracking-tighter">{p.user_profiles?.email || 'SYSTEM_OWNED'}</p>
                   </div>
                 </div>
                 <div className="relative">
                    <button className="p-2 bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                       <MoreVertical size={14} />
                    </button>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <span className="text-[10px] mono text-gray-600 uppercase">Asset_Count</span>
                    <span className="text-[11px] font-black text-white">{p.assets?.length || 0} MODULES</span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                       <span className="text-[8px] mono text-gray-700 block uppercase mb-1">Owner_Tier</span>
                       <span className={`text-[9px] font-black mono ${p.user_profiles?.tier === 'pro' ? 'text-purple-400' : 'text-gray-500'}`}>
                          {p.user_profiles?.tier?.toUpperCase() || 'FREE'}
                       </span>
                    </div>
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                       <span className="text-[8px] mono text-gray-700 block uppercase mb-1">Status</span>
                       <span className="text-[9px] font-black mono text-green-500">SYNCED</span>
                    </div>
                 </div>

                 <div className="flex items-center gap-2 pt-2">
                    <button 
                      onClick={() => deletePortfolio(p.id)}
                      className="flex-1 py-2.5 bg-red-500/5 border border-red-500/20 rounded-xl text-[10px] mono text-red-500 hover:bg-red-500/10 transition-all opacity-40 group-hover:opacity-100"
                    >
                       DELETE_NODE
                    </button>
                    <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-cyan-400 transition-all">
                       <ExternalLink size={14} />
                    </button>
                 </div>
              </div>

              {/* Created Date Strip */}
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-[8px] mono text-gray-700">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
           </GlassCard>
         ))}

         {filteredPortfolios.length === 0 && (
           <div className="col-span-full py-32 text-center mono text-xs text-gray-700 uppercase italic tracking-widest">
              NO_NODES_ALLOCATED_IN_SCOPE
           </div>
         )}
      </div>

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
