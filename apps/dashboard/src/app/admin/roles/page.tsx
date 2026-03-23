'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Shield, ShieldAlert, ShieldCheck, Users, Search, 
  Lock, Unlock, Zap, AlertTriangle, Key, ArrowRight
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { useToast } from '../../../components/ui/ToastProvider';
import { HoloLoader } from '../../../components/ui/HoloLoader';

export default function AdminRolesPage() {
  return (
    <Suspense fallback={<div className="loading mono p-24 text-center">SYNCHRONIZING_PERMISSION_NODES...</div>}>
      <RolesContent />
    </Suspense>
  );
}

function RolesContent() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error, info } = useToast();

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_admin', true)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setAdmins(data || []);
    } catch (e: any) {
      error('GOVERNANCE_FAULT', e.message);
    }
    setLoading(false);
  }

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error: err } = await supabase
        .from('user_profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (err) throw err;
      
      success('CLEARANCE_MODIFIED', `Node ${userId.slice(0, 8)} permissions ${!currentStatus ? 'elevated' : 'revoked'}.`);
      fetchAdmins();
    } catch (e: any) {
      error('PERMISSION_PROTOCOL_FAILURE', e.message);
    }
  };

  if (loading) return (
    <HoloLoader progress={80} phase="MAPPING_CLEARANCE_STRATA" isMuted={true} onToggleMute={() => {}} />
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-purple-400 uppercase tracking-[0.3em] mb-2 block">Governance // Permissions</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase">Clearance Levels</h1>
          <p className="text-gray-500 text-xs mono mt-1 tracking-widest">Administrative credential management and protocol audit.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         <div className="xl:col-span-2 space-y-6">
            <GlassCard className="p-6" intensity="low">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="mono text-[10px] font-black tracking-widest text-purple-400 uppercase flex items-center gap-2">
                     <ShieldCheck size={14} />
                     Active_Admins_Registry
                  </h3>
                  <div className="relative w-64">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                     <input 
                       type="text"
                       placeholder="PROBE_ID..."
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2 text-[10px] mono text-white focus:outline-none focus:border-purple-500/50"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
               </div>

               <div className="space-y-4">
                  {admins.filter(a => a.email.includes(searchTerm)).map((admin) => (
                    <div key={admin.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-purple-500/30 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                             {admin.email?.[0].toUpperCase()}
                          </div>
                          <div>
                             <div className="text-xs font-bold text-white">{admin.email}</div>
                             <div className="text-[9px] mono text-gray-600">{admin.id}</div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-4">
                          <div className="hidden md:flex flex-col items-end mr-4">
                             <span className="mono text-[8px] text-gray-600 uppercase">Clearance_Duration</span>
                             <span className="text-[10px] mono text-gray-400">{new Date(admin.updated_at || admin.created_at).toLocaleDateString()}</span>
                          </div>
                          <button 
                            onClick={() => toggleAdmin(admin.id, true)}
                            className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 mono text-[10px] hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          >
                             REVOKE_PROTOCOL
                          </button>
                       </div>
                    </div>
                  ))}
                  {admins.length === 0 && <div className="py-20 text-center mono text-[10px] text-gray-700">NO_ELEVATED_NODES_DETECTED</div>}
               </div>
            </GlassCard>
         </div>

         <div className="space-y-6">
            <GlassCard className="p-8 border-purple-500/20 shadow-lg shadow-purple-500/5" intensity="low">
               <Shield size={40} className="text-purple-500 mb-6" />
               <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">Permission Matrix</h3>
               <p className="text-xs text-gray-500 leading-relaxed mb-8">
                  Superuser status bypasses all Row Level Security (RLS) policies across Simulation, Financial, and Personnel databases. Ensure mandatory two-factor authentication for all elevated nodes.
               </p>
               
               <div className="space-y-4 border-t border-white/5 pt-6">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-green-500" />
                     <span className="text-[10px] mono text-gray-400">READ_ALL_STREAMS</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-red-500" />
                     <span className="text-[10px] mono text-gray-400">WRITE_KERNEL_CONFIG</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-cyan-500" />
                     <span className="text-[10px] mono text-gray-400">OVERRIDE_TIER_LOGIC</span>
                  </div>
               </div>
            </GlassCard>

            <GlassCard className="p-6 border-white/5" intensity="low">
               <h4 className="mono text-[10px] text-gray-600 uppercase mb-4">Elevate_New_Node</h4>
               <div className="relative">
                  <input 
                    type="text"
                    placeholder="ENTER_UUID_OR_EMAIL..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pr-12 text-[10px] mono text-white focus:outline-none focus:border-purple-500/30"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-500 text-white rounded-xl">
                     <ArrowRight size={16} />
                  </button>
               </div>
            </GlassCard>
         </div>
      </div>

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
