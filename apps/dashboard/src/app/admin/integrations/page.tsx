'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Zap, Cloud, Database, Lock, Globe, Share2, 
  Settings, Save, RefreshCw, Key, CheckCircle2, 
  AlertCircle, ExternalLink, Box, Terminal, Cpu
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { useToast } from '../../../components/ui/ToastProvider';
import { HoloLoader } from '../../../components/ui/HoloLoader';

export default function AdminIntegrationsPage() {
  return (
    <Suspense fallback={<div className="loading mono p-24 text-center">LINKING_EXTERNAL_SYSTMEMS...</div>}>
      <IntegrationsContent />
    </Suspense>
  );
}

function IntegrationsContent() {
  const [config, setConfig] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error, info } = useToast();

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('system_config')
        .select('*')
        .order('category', { ascending: true });

      if (err) throw err;
      setConfig(data || []);
    } catch (e: any) {
      error('INTEGRATION_FAULT', e.message);
    }
    setLoading(false);
  }

  const updateConfig = async (id: string, value: any) => {
    try {
      const { error: err } = await supabase
        .from('system_config')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (err) throw err;
      success('PARAMETER_SYNCHRONIZED', 'External endpoint configuration updated.');
      fetchConfigs();
    } catch (e: any) {
      error('SYNC_FAILURE', e.message);
    }
  };

  if (loading) return (
    <HoloLoader progress={90} phase="ESTABLISHING_EXTERNAL_HANDSHAKES" isMuted={true} onToggleMute={() => {}} />
  );

  const categories = Array.from(new Set(config.map(c => c.category)));

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] mb-2 block">Governance // Connectors</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase">Integrations</h1>
          <p className="text-gray-500 text-xs mono mt-1 tracking-widest">Management of third-party API keys and external service nodes.</p>
        </div>
        
        <button 
          onClick={fetchConfigs}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] mono text-gray-400 hover:text-white transition-all"
        >
          <RefreshCw size={14} />
          REFRESH_ENDPOINTS
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         {categories.map(cat => (
           <GlassCard key={cat} className="p-8" intensity="low">
              <h3 className="mono text-[10px] font-black tracking-widest text-cyan-400 uppercase mb-8 flex items-center gap-2">
                 <Box size={14} />
                 {cat}_MODULE
              </h3>
              
              <div className="space-y-6">
                 {config.filter(c => c.category === cat).map(item => (
                   <div key={item.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                         <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{item.key.replace(/_/g, ' ')}</label>
                         <span className="text-[8px] mono text-gray-600">ID: {item.id.slice(0, 8)}</span>
                      </div>
                      <div className="flex gap-3">
                         <div className="relative flex-1">
                            <input 
                              type={item.is_secret ? 'password' : 'text'}
                              defaultValue={item.value}
                              onBlur={(e) => updateConfig(item.id, e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[11px] mono text-gray-400 focus:outline-none focus:border-cyan-500/30"
                            />
                            {item.is_secret && <Lock size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700" />}
                         </div>
                         <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-cyan-400 transition-all">
                            <Save size={16} />
                         </button>
                      </div>
                      <p className="text-[9px] mono text-gray-600 leading-tight">{item.description}</p>
                   </div>
                 ))}
              </div>
           </GlassCard>
         ))}

         {config.length === 0 && (
            <GlassCard className="p-20 text-center col-span-full border-dashed border-white/10" intensity="low">
               <Terminal size={48} className="mx-auto mb-6 opacity-20" />
               <p className="mono text-xs text-gray-600 uppercase tracking-widest">No_System_Configs_Initialized</p>
               <button className="mt-6 px-8 py-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-[10px] mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
                  INITIALIZE_DEFAULT_MATRIX
               </button>
            </GlassCard>
         )}

         {/* Monitoring Node Preview */}
         <GlassCard className="p-8 border-cyan-500/10 bg-gradient-to-br from-cyan-500/[0.02] to-transparent" intensity="low">
            <Cpu size={32} className="text-cyan-400 mb-6" />
            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-4">Edge Infrastructure</h3>
            <div className="space-y-4">
               {[
                 { label: 'Supabase Functions', status: 'Operational', color: 'text-green-500' },
                 { label: 'Claude AI Gateway', status: 'Operational', color: 'text-green-500' },
                 { label: 'Paystack Webhook', status: 'Listening', color: 'text-cyan-400' },
                 { label: 'Resend SMTP', status: 'Standby', color: 'text-gray-500' },
               ].map(node => (
                 <div key={node.label} className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-[10px] mono text-gray-400">{node.label}</span>
                    <span className={`text-[10px] mono font-bold ${node.color}`}>{node.status.toUpperCase()}</span>
                 </div>
               ))}
            </div>
         </GlassCard>
      </div>

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
