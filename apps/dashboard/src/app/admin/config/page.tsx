'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Settings, Sliders, ToggleLeft, ToggleRight, Shield, 
  Zap, Database, Globe, Lock, Unlock, AlertTriangle,
  RefreshCcw, Save, Plus, Trash2, Search, Filter,
  Layers, Package, Coins, Cpu, Eye, EyeOff
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { useToast } from '../../../components/ui/ToastProvider';
import { HoloLoader } from '../../../components/ui/HoloLoader';

export default function AdminConfigPage() {
  return (
    <Suspense fallback={<div className="loading mono p-24 text-center">DECRYPTING_SYSTEM_REGISTRY...</div>}>
      <ConfigContent />
    </Suspense>
  );
}

function ConfigContent() {
  const [flags, setFlags] = useState<any[]>([]);
  const [appConfigs, setAppConfigs] = useState<any[]>([]);
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
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const { data: flagData } = await supabase.from('feature_flags').select('*').order('created_at', { ascending: false });
      const { data: configData } = await supabase.from('app_config').select('*').order('key', { ascending: true });

      if (flagData) setFlags(flagData);
      if (configData) setAppConfigs(configData);
    } catch (e: any) {
      error('REGISTRY_FAULT', e.message);
    }
    setLoading(false);
  }

  const toggleFlag = async (id: string, current: boolean) => {
    const { error: err } = await supabase
      .from('feature_flags')
      .update({ enabled: !current, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (!err) {
      success('REGISTRY_UPDATED', `Feature flag state toggled to ${!current ? 'ENABLED' : 'DISABLED'}.`);
      fetchConfigs();
    }
  };

  const updateConfigValue = async (key: string, value: string) => {
    const { error: err } = await supabase
      .from('app_config')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);
    
    if (!err) {
      success('KERNEL_PRAM_SYNCH', `Kernel parameter [${key}] updated.`);
      fetchConfigs();
    }
  };

  if (loading) return (
    <HoloLoader 
      progress={loaderProgress} 
      phase="INIT_KERNEL_CONFIG" 
      isMuted={isMuted} 
      onToggleMute={() => setIsMuted(!isMuted)} 
    />
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] mb-2 block">Governance // Platform_Config</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase font-jetbrains">Kernel</h1>
        </div>
        
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-[10px] mono text-red-500 hover:bg-red-500 hover:text-white transition-all font-black">
              <Lock size={14} />
              GLOBAL_MAINTENANCE_TOGGLE
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-[10px] mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
              <RefreshCcw size={14} />
              REBOOT_SERVICES
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         {/* Feature Flags */}
         <GlassCard className="p-8" intensity="low">
            <div className="flex justify-between items-center mb-8">
               <h3 className="mono text-[10px] font-black tracking-widest text-cyan-400 uppercase flex items-center gap-2">
                  <ToggleRight size={14} />
                  Feature_Flag_Matrix
               </h3>
               <button className="p-2 border border-white/10 rounded-xl text-gray-500 hover:text-white"><Plus size={14} /></button>
            </div>
            
            <div className="space-y-4">
               {flags.map((flag) => (
                 <div key={flag.id} className="group p-5 bg-white/5 border border-white/5 rounded-3xl hover:border-white/10 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-2xl bg-white/5 ${flag.enabled ? 'text-cyan-400' : 'text-gray-600'}`}>
                          <Layers size={18} />
                       </div>
                       <div>
                          <div className="text-[11px] font-bold text-gray-200">{flag.key}</div>
                          <div className="text-[8px] mono text-gray-600 uppercase tracking-widest">ROLLOUT: {flag.rollout_percent}%</div>
                       </div>
                    </div>
                    <button 
                      onClick={() => toggleFlag(flag.id, flag.enabled)}
                      className={`p-1.5 rounded-full transition-all ${flag.enabled ? 'text-cyan-400' : 'text-gray-700 hover:text-gray-400'}`}
                    >
                       {flag.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                 </div>
               ))}
               {flags.length === 0 && <div className="text-center py-20 mono text-[10px] text-gray-700 border border-dashed border-white/10 rounded-3xl">NO_FLAGS_DETECTED</div>}
            </div>
         </GlassCard>

         {/* App Config / Entitlements */}
         <GlassCard className="p-8" intensity="low">
            <h3 className="mono text-[10px] font-black tracking-widest text-purple-400 uppercase mb-8 flex items-center gap-2">
               <Database size={14} />
               Kernel_Parameters_Registry
            </h3>
            
            <div className="space-y-3">
               {appConfigs.map((config) => (
                 <div key={config.key} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-purple-500/20 transition-all">
                    <div className="flex flex-col gap-1">
                       <span className="mono text-[8px] text-gray-600 uppercase tracking-widest font-black">{config.key}</span>
                       <input 
                         type="text"
                         defaultValue={config.value}
                         className="bg-transparent border-none text-[11px] mono text-purple-400 focus:outline-none w-full max-w-[200px]"
                         onBlur={(e) => updateConfigValue(config.key, e.target.value)}
                       />
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2 text-gray-600 hover:text-white"><Eye size={14} /></button>
                       <button className="p-2 text-gray-600 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                 </div>
               ))}
            </div>
            
            <button className="w-full mt-6 py-4 border border-dashed border-white/10 rounded-2xl text-[10px] mono text-gray-600 hover:text-white hover:border-white/20 transition-all">
               REGISTER_NEW_PARAMETER
            </button>
         </GlassCard>
      </div>

      {/* OTA & Deployment Status (Visual only for now) */}
      <GlassCard className="p-8" intensity="low">
         <h3 className="mono text-[10px] font-black tracking-widest text-yellow-500 uppercase mb-8 flex items-center gap-2">
            <Globe size={14} />
            OTA_Release_Vector_Monitor
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { id: 'v2.1.2', status: 'STABLE', healthy: true },
              { id: 'v2.1.3-rc1', status: 'ROLLOUT', healthy: true },
              { id: 'v2.1.3-hotfix', status: 'REJECTED', healthy: false },
            ].map((ota, i) => (
              <div key={ota.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl relative overflow-hidden group hover:border-white/20 transition-all">
                 <div className="flex justify-between items-start mb-6">
                    <div className="p-3 rounded-xl bg-white/5 text-gray-400 group-hover:text-yellow-500 transition-colors">
                       <Package size={20} />
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black mono ${ota.healthy ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                       {ota.status}
                    </span>
                 </div>
                 <div className="text-xl font-black text-white mb-2">{ota.id}</div>
                 <div className="text-[10px] mono text-gray-600 uppercase tracking-widest">Active_Segment: GLOBAL</div>
                 <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-yellow-500/5 rounded-full blur-xl group-hover:bg-yellow-500/10 transition-all" />
              </div>
            ))}
         </div>
      </GlassCard>

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
