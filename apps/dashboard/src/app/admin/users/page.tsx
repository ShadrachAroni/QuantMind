'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  User, Activity, Shield, MoreHorizontal, ChevronLeft, ChevronRight, 
  Search, Database, SlidersHorizontal, Filter, RefreshCcw, Key, X,
  Download, Trash2, Ban, CheckCircle2, AlertTriangle, ExternalLink,
  Mail, Fingerprint, Calendar, Zap, Lock, Unlock, UserPlus, ArrowRight
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { useToast } from '../../../components/ui/ToastProvider';
import { HoloLoader } from '../../../components/ui/HoloLoader';
import { AdjustmentModal } from '../../../components/admin/AdjustmentModal';

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="loading mono p-24 text-center">INITIALIZING_REGISTRY_STRATUM...</div>}>
      <UsersContent />
    </Suspense>
  );
}

function UsersContent() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, activeSubs: 0, flagged: 0 });
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [detailedUser, setDetailedUser] = useState<any>(null);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [adjustingUser, setAdjustingUser] = useState<any>(null);
  const { success, error, info } = useToast();
  const pageSize = 12;

  useEffect(() => {
    fetchUsers();
  }, [page, filterTier]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data: profiles, count, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          subscriptions:subscriptions(status, current_period_end)
        `, { count: 'exact' })
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Stats
      const { count: totalUsers } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
      const { count: activeSubs } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { data: securityLogs } = await supabase.from('security_log').select('user_id');
      const flaggedSet = new Set(securityLogs?.map(f => f.user_id));

      setStats({
        total: totalUsers || 0,
        activeSubs: activeSubs || 0,
        flagged: flaggedSet.size
      });

      if (profiles) {
        setUsers(profiles.map(u => ({
          ...u,
          security_flag: flaggedSet.has(u.id)
        })));
      }
    } catch (e: any) {
      error('REGISTRY_FAULT', e.message);
    }
    setLoading(false);
  }

  async function fetchUserActivity(userId: string) {
    const { data } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    setUserActivity(data || []);
  }

  const handleUserClick = (user: any) => {
    setDetailedUser(user);
    fetchUserActivity(user.id);
  };

  const toggleSelect = (id: string) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const bulkUpdateTier = async (tier: string) => {
    const { error: err } = await supabase
      .from('user_profiles')
      .update({ tier })
      .in('id', selectedUserIds);
    
    if (!err) {
      success('BULK_TIER_SYNCHRONIZED', `Updated ${selectedUserIds.length} users to ${tier.toUpperCase()}`);
      fetchUsers();
      setSelectedUserIds([]);
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'EMAIL', 'TIER', 'CREATED_AT'];
    const rows = users.map(u => [u.id, u.email, u.tier, u.created_at]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantmind_users_${new Date().toISOString()}.csv`;
    a.click();
    info('EXPORT_PROTOCOL', 'User registry downloaded.');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] mb-2 block">Governance // Registry</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase">User Infrastructure</h1>
          <p className="text-gray-500 text-xs mono mt-1 tracking-widest">Management of system clearance and security identifiers.</p>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
              <span className="mono text-[8px] text-gray-600 uppercase">Suspicious_Entities</span>
              <span className="text-xl font-black text-red-500">{stats.flagged}</span>
           </div>
           <button 
             onClick={exportCSV}
             className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] mono text-gray-400 hover:text-white hover:border-white/20 transition-all group"
           >
              <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
              EXPORT_REGISTRY
           </button>
        </div>
      </header>

      {/* Grid Controls */}
      <GlassCard className="p-6" intensity="low">
         <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
               <input 
                 type="text"
                 placeholder="INITIALIZE_SEARCH: INPUT EMAIL OR UUID..."
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-[11px] mono text-white focus:outline-none focus:border-cyan-500/50"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            
            <div className="flex items-center gap-2">
               {['all', 'plus', 'pro', 'student'].map(t => (
                 <button 
                   key={t}
                   onClick={() => setFilterTier(t)}
                   className={`px-4 py-2 rounded-lg text-[9px] mono tracking-[0.2em] transition-all border ${filterTier === t ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-transparent text-gray-500'}`}
                 >
                   {t.toUpperCase()}
                 </button>
               ))}
            </div>
         </div>

         {/* Selection Bar */}
         {selectedUserIds.length > 0 && (
           <div className="mb-6 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center justify-between animate-slide-up">
              <div className="flex items-center gap-4">
                 <span className="mono text-[10px] text-cyan-400 font-bold">{selectedUserIds.length} OBJECTS_SELECTED</span>
                 <div className="h-4 w-px bg-white/10" />
                 <button className="text-[10px] mono text-gray-500 hover:text-white" onClick={() => setSelectedUserIds([])}>DESELECT_ALL</button>
              </div>
              
              <div className="flex items-center gap-2">
                 <span className="mono text-[9px] text-gray-600 uppercase mr-2">Bulk_Action: Tier_Sync</span>
                 {['FREE', 'PLUS', 'PRO', 'STUDENT'].map(tier => (
                    <button 
                       key={tier}
                       onClick={() => bulkUpdateTier(tier.toLowerCase())}
                       className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] mono text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30"
                    >
                       SET_{tier}
                    </button>
                 ))}
              </div>
           </div>
         )}

         {/* Table */}
         <div className="overflow-x-auto">
            <table className="w-full border-collapse">
               <thead>
                  <tr className="border-b border-white/5">
                     <th className="p-4 text-left w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedUserIds.length === users.length && users.length > 0}
                          onChange={() => setSelectedUserIds(selectedUserIds.length === users.length ? [] : users.map(u => u.id))}
                          className="rounded bg-black border-white/10" 
                        />
                     </th>
                     <th className="p-4 text-left mono text-[9px] text-gray-600 uppercase tracking-widest">IDENTIFIER</th>
                     <th className="p-4 text-left mono text-[9px] text-gray-600 uppercase tracking-widest">CLEARANCE</th>
                     <th className="p-4 text-left mono text-[9px] text-gray-600 uppercase tracking-widest">STATUS</th>
                     <th className="p-4 text-left mono text-[9px] text-gray-600 uppercase tracking-widest">SECURITY</th>
                     <th className="p-4 text-right mono text-[9px] text-gray-600 uppercase tracking-widest">ACTIONS</th>
               </tr>
               </thead>
               <tbody>
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      className={`border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group cursor-pointer ${selectedUserIds.includes(user.id) ? 'bg-cyan-500/[0.02]' : ''}`}
                      onClick={() => handleUserClick(user)}
                    >
                       <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => toggleSelect(user.id)}
                            className="rounded bg-black border-white/10"
                          />
                       </td>
                       <td className="p-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center mono text-xs text-gray-400">
                                {user.email?.[0].toUpperCase()}
                             </div>
                             <div>
                                <div className="text-xs font-bold text-gray-200">{user.email}</div>
                                <div className="text-[9px] mono text-gray-600">{user.id}</div>
                             </div>
                          </div>
                       </td>
                       <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[8px] font-black mono border ${user.tier === 'pro' ? 'text-purple-400 bg-purple-400/10 border-purple-400/20' : user.tier === 'plus' ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' : 'text-gray-500 bg-white/5 border-white/10'}`}>
                             {user.tier?.toUpperCase()}
                          </span>
                       </td>
                       <td className="p-4">
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${user.subscriptions?.[0]?.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-700'}`} />
                             <span className="text-[10px] mono text-gray-400">{user.subscriptions?.[0]?.status?.toUpperCase() || 'INACTIVE'}</span>
                          </div>
                       </td>
                       <td className="p-4">
                          {user.security_flag ? (
                             <div className="flex items-center gap-1.5 text-red-500 mono text-[9px] font-black italic animate-pulse">
                                <AlertTriangle size={12} />
                                CRITICAL_RISK
                             </div>
                          ) : (
                             <div className="flex items-center gap-1.5 text-green-500/40 mono text-[9px]">
                                <CheckCircle2 size={12} />
                                SECURE
                             </div>
                          )}
                       </td>
                       <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={(e) => { e.stopPropagation(); setAdjustingUser(user); }}
                               className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-cyan-400" 
                               title="MOD_KERNEL"
                             >
                                <SlidersHorizontal size={14} />
                             </button>
                             <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </GlassCard>

      {/* Side Detail Drawer */}
      {detailedUser && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-fade-in" onClick={() => setDetailedUser(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-[500px] bg-[#0A0B14] border-l border-white/10 z-[201] animate-slide-left p-8 overflow-y-auto custom-scrollbar shadow-2xl">
             <div className="flex justify-between items-center mb-10">
                <div>
                   <span className="mono text-[9px] text-cyan-400 uppercase tracking-widest px-2 py-0.5 bg-cyan-400/10 rounded mb-2 inline-block">Entity_Profile</span>
                   <h2 className="text-2xl font-black text-white tracking-widest">{detailedUser.email?.split('@')[0].toUpperCase()}</h2>
                   <p className="text-[10px] mono text-gray-500 mt-1">{detailedUser.id}</p>
                </div>
                <button onClick={() => setDetailedUser(null)} className="p-3 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all">
                   <X size={20} />
                </button>
             </div>

             <div className="space-y-8">
                {/* Status Strip */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                      <span className="mono text-[8px] text-gray-600 uppercase block mb-1">Clearance_Level</span>
                      <span className="text-lg font-black text-cyan-400 mono tracking-widest">{detailedUser.tier?.toUpperCase()}</span>
                   </div>
                   <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                      <span className="mono text-[8px] text-gray-600 uppercase block mb-1">System_Status</span>
                      <span className="text-lg font-bold text-gray-300 mono">{detailedUser.subscriptions?.[0]?.status?.toUpperCase() || 'NONE'}</span>
                   </div>
                </div>

                {/* Metadata */}
                <div>
                   <h3 className="mono text-[10px] text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Database size={12} />
                       Kernel_Parameters
                   </h3>
                   <div className="space-y-4 p-6 bg-black/40 rounded-3xl border border-white/5">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] mono text-gray-600">Simulation_Cap</span>
                         <span className="text-[10px] mono text-cyan-500">{detailedUser.simulation_quota_override || 'SYSTEM_DEFAULT'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] mono text-gray-600">AI_Bandwidth</span>
                         <span className="text-[10px] mono text-purple-400">{detailedUser.ai_token_quota_override || 'SYSTEM_DEFAULT'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] mono text-gray-600">Security_Score</span>
                         <span className={`text-[10px] mono ${detailedUser.security_flag ? 'text-red-500' : 'text-green-500'}`}>
                            {detailedUser.security_flag ? 'RISK_DETECTED' : 'TRUSTED'}
                         </span>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                         <span className="text-[10px] mono text-gray-600">Registration_Cycle</span>
                         <span className="text-[10px] mono text-gray-400">{new Date(detailedUser.created_at).toLocaleDateString()}</span>
                      </div>
                   </div>
                </div>

                {/* Activity Feed */}
                <div>
                   <h3 className="mono text-[10px] text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Activity size={12} />
                      Activity_Telemetry
                   </h3>
                   <div className="space-y-3 relative">
                      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/5" />
                      {userActivity.map((act, i) => (
                        <div key={i} className="flex gap-4 relative">
                           <div className="w-6 h-6 rounded-full bg-black border border-white/10 flex items-center justify-center shrink-0 z-10">
                              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                           </div>
                           <div className="flex-1 pb-4">
                              <div className="flex justify-between items-start">
                                 <span className="text-[11px] font-bold text-gray-300 mono uppercase">{act.event?.replace(/_/g, ' ')}</span>
                                 <span className="text-[8px] mono text-gray-600">{new Date(act.created_at).toLocaleTimeString()}</span>
                              </div>
                              <div className="text-[9px] mono text-gray-500 mt-0.5 truncate">{JSON.stringify(act.metadata)}</div>
                           </div>
                        </div>
                      ))}
                      {userActivity.length === 0 && <div className="text-center py-8 mono text-[10px] text-gray-600 uppercase">NO_SESSIONS_RECORDED</div>}
                   </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                   <button 
                     onClick={() => setAdjustingUser(detailedUser)}
                     className="flex items-center justify-center gap-2 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-2xl text-[10px] mono text-cyan-400 transition-all border border-cyan-500/20"
                   >
                      <SlidersHorizontal size={14} />
                      OVERRIDE_KERNEL
                   </button>
                   <button className="flex items-center justify-center gap-2 py-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-[10px] mono text-red-500 transition-all">
                      <Ban size={14} />
                      TERMINAL_BAN
                   </button>
                </div>
             </div>
          </div>
        </>
      )}

      {adjustingUser && (
        <AdjustmentModal 
          user={adjustingUser} 
          onClose={() => setAdjustingUser(null)} 
          onUpdate={fetchUsers} 
        />
      )}

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-slide-left { animation: slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-left { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
