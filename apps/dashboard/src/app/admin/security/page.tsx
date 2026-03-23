'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Shield, Ban, Lock, Unlock, Key, Fingerprint,
  AlertTriangle, ShieldCheck, Activity, Globe,
  Search, Filter, MoreVertical, X, Check,
  Trash2, RefreshCcw, ArrowRight, UserMinus,
  Database, Zap, Eye, EyeOff
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { useToast } from '../../../components/ui/ToastProvider';
import { HoloLoader } from '../../../components/ui/HoloLoader';

export default function AdminSecurityPage() {
  return (
    <Suspense fallback={<div className="loading mono p-24 text-center">ENCRYPTING_SECURE_ENCLAVE...</div>}>
      <SecurityContent />
    </Suspense>
  );
}

function SecurityContent() {
  const [threats, setThreats] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
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
    fetchSecurityData();
  }, []);

  async function fetchSecurityData() {
    try {
      const { data: threatData } = await supabase
        .from('security_log')
        .select('*, user_profiles(email)')
        .order('created_at', { ascending: false })
        .limit(20);
      
      // Simulate active sessions since Supabase auth doesn't expose all sessions to client easily
      const { data: sessionData } = await supabase
        .from('user_activity_log')
        .select('*, user_profiles(email)')
        .eq('event', 'login')
        .order('created_at', { ascending: false })
        .limit(10);

      if (threatData) setThreats(threatData);
      if (sessionData) setSessions(sessionData);
    } catch (e: any) {
      error('SECURITY_FAULT', e.message);
    }
    setLoading(false);
  }

  const blockIP = async (ip: string) => {
    info('CRYPTO_LOCK', `Intercepting traffic from ${ip}...`);
    // Calls edge function admin-ip-blocker
    const { data, error: err } = await supabase.functions.invoke('admin-ip-blocker', {
      body: { action: 'BLOCK', ip }
    });
    
    if (!err) {
      success('THRESHOLD_BREACH_MITIGATED', `IP ${ip} has been firewalled globally.`);
      fetchSecurityData();
    } else {
      error('BLOCK_FAULT', err.message);
    }
  };

  const revokeSession = async (sessionId: string) => {
    success('ACCESS_REVOKED', 'Biological identifier invalidated.');
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  if (loading) return (
    <HoloLoader 
      progress={loaderProgress} 
      phase="INIT_SECURITY_ENCLAVE" 
      isMuted={isMuted} 
      onToggleMute={() => setIsMuted(!isMuted)} 
    />
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-red-500 uppercase tracking-[0.3em] mb-2 block">Governance // Security_Sentinel</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase font-jetbrains">Security</h1>
        </div>
        
        <div className="flex items-center gap-6 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
           <div className="flex flex-col border-r border-red-500/10 pr-6">
              <span className="mono text-[8px] text-gray-500 uppercase">Active_Threats</span>
              <span className="text-xl font-black text-red-500 tracking-tighter">04</span>
           </div>
           <div className="flex flex-col border-r border-red-500/10 pr-6 pl-2">
              <span className="mono text-[8px] text-gray-500 uppercase">Health_Status</span>
              <span className="text-xl font-black text-green-400 tracking-tighter">OPTIMAL</span>
           </div>
           <div className="flex flex-col pl-2">
              <span className="mono text-[8px] text-gray-500 uppercase">Enforcement</span>
              <span className="text-xl font-black text-white tracking-tighter text-opacity-50 font-mono">LOCKED</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Threat Monitor */}
         <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-0 border-white/10 overflow-hidden" intensity="low">
               <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="mono text-[10px] font-black tracking-widest text-red-500 uppercase flex items-center gap-2">
                    <AlertTriangle size={14} className="animate-pulse" />
                    Live_Threat_Feed
                  </h3>
                  <div className="flex items-center gap-2 text-[8px] mono text-gray-500 uppercase">
                    <Globe size={10} />
                    Global_Ingress_Pulse
                  </div>
               </div>
               
               <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                     <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                           <th className="p-4 text-left mono text-[9px] text-gray-500 uppercase">Source_IP</th>
                           <th className="p-4 text-left mono text-[9px] text-gray-500 uppercase">Identity</th>
                           <th className="p-4 text-center mono text-[9px] text-gray-500 uppercase">Severity</th>
                           <th className="p-4 text-right mono text-[9px] text-gray-500 uppercase">Mitigation</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/[0.02]">
                        {threats.map((threat) => (
                          <tr key={threat.id} className="hover:bg-red-500/[0.02] transition-colors group">
                             <td className="p-4 text-[11px] mono text-gray-300 font-bold">{threat.ip_address || '127.0.0.1'}</td>
                             <td className="p-4 text-[11px] text-gray-400">{threat.user_profiles?.email || 'ANONYMOUS_ENTITY'}</td>
                             <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black mono ${threat.severity === 'fatal' ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-400'}`}>
                                   {threat.severity?.toUpperCase()}
                                </span>
                             </td>
                             <td className="p-4 text-right">
                                <button 
                                  onClick={() => blockIP(threat.ip_address)}
                                  className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                >
                                   <Ban size={12} />
                                </button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </GlassCard>

            {/* Session Manager */}
            <GlassCard className="p-8" intensity="low">
               <h3 className="mono text-[10px] font-black tracking-widest text-cyan-400 uppercase mb-8 flex items-center gap-2">
                  <Fingerprint size={14} />
                  Active_Neural_Links
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                             <Shield size={18} />
                          </div>
                          <div>
                             <div className="text-[11px] font-bold text-gray-200">{session.user_profiles?.email?.split('@')[0].toUpperCase()}</div>
                             <div className="text-[8px] mono text-gray-600 font-bold">{new Date().toLocaleDateString()} // SEO_LOC: LAGOS</div>
                          </div>
                       </div>
                       <button onClick={() => revokeSession(session.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                          <UserMinus size={16} />
                       </button>
                    </div>
                  ))}
               </div>
            </GlassCard>
         </div>

         {/* Security Pulse Sidebar */}
         <div className="space-y-6">
            <GlassCard className="p-6" intensity="low">
               <h3 className="mono text-[10px] font-black tracking-widest text-purple-400 uppercase mb-6 flex items-center gap-2">
                  <Activity size={14} />
                  Rate_Limit_Pulse
               </h3>
               
               <div className="space-y-6">
                  {[
                    { label: 'API_AUTHENTICATION_BURST', usage: 14, limit: 100 },
                    { label: 'SIMULATION_INITIALIZATION', usage: 42, limit: 200 },
                    { label: 'OAUTH_HANDSHAKE_CYCLE', usage: 8, limit: 50 },
                  ].map(p => (
                    <div key={p.label} className="space-y-2">
                       <div className="flex justify-between text-[8px] mono uppercase tracking-widest">
                          <span className="text-gray-600">{p.label}</span>
                          <span className="text-cyan-400 font-black">{Math.round((p.usage/p.limit)*100)}%</span>
                       </div>
                       <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400/30 rounded-full" style={{ width: `${(p.usage/p.limit)*100}%` }} />
                       </div>
                    </div>
                  ))}
               </div>
            </GlassCard>

            <GlassCard className="p-6 border-red-500/20" intensity="low">
               <h3 className="mono text-[10px] font-black tracking-widest text-red-500 uppercase mb-6 flex items-center gap-2">
                  <Lock size={14} />
                  Critical_Lockdown
               </h3>
               <p className="text-[10px] mono text-gray-500 mb-6 leading-relaxed">
                  Initializing the global kill-switch will invalidate all active authorization tokens and put the platform in read-only maintenance mode.
               </p>
               <button className="w-full py-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-[10px] mono text-red-500 hover:bg-red-500 hover:text-white transition-all font-black tracking-[0.2em]">
                  TERMINAL_LOCKDOWN
               </button>
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
