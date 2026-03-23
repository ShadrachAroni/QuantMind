'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/ui/AdminLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { 
  Settings, Shield, Bell, Save, RefreshCw, Database, Server, 
  ChevronRight, RotateCcw, Globe, Palette, Link as LinkIcon, 
  Eye, EyeOff, Activity, Cpu, Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/ToastProvider';
import { HoloLoader } from '../../components/ui/HoloLoader';
import { logSystemEvent } from '../../lib/notifications';

type TabType = 'general' | 'security' | 'integrations' | 'engine';

export default function SettingsPage() {
  const [config, setConfig] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [showSecret, setShowSecret] = useState(false);
  const { success, error, info } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    const { data } = await supabase.from('app_config').select('*');
    if (data) setConfig(data);
    setLoading(false);
  }

  const getConfigValue = (key: string, defaultValue: any = '') => {
    const item = config.find(c => c.key === key);
    return item ? item.value : defaultValue;
  };

  const updateConfigValue = (key: string, value: any) => {
    setConfig(prev => {
      const exists = prev.find(c => c.key === key);
      if (exists) {
        return prev.map(item => item.key === key ? { ...item, value } : item);
      }
      return [...prev, { key, value, description: '' }];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Preparation for upsert
    const updates = config.map(item => ({
      key: item.key,
      value: item.value,
      updated_at: new Date().toISOString()
    }));

    const { error: err } = await supabase.from('app_config').upsert(updates);

    if (err) {
      error('UPDATE_FAILED', err.message);
    } else {
      success('CONFIGURATION_SYNCED', 'All system nodes have been updated.');
      await logSystemEvent('System configuration parameters synchronized across all nodes.', 'system');
    }
    
    setSaving(false);
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'general', label: 'SYSTEM_CORE', icon: Globe },
    { id: 'security', label: 'SECURITY_NODE', icon: Lock },
    { id: 'integrations', label: 'EXTERNAL_LINKS', icon: LinkIcon },
    { id: 'engine', label: 'KERNEL_MODS', icon: Cpu },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] relative min-h-[400px]">
          <HoloLoader 
            progress={Math.floor(Math.random() * 40) + 30} 
            phase="RETRIEVING_SYSTEM_PARAMETERS..." 
            isMuted={true} 
            onToggleMute={() => {}} 
            fullScreen={false} 
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <GlowEffect color="#7C3AED" size={800} style={{ top: -200, right: -200, opacity: 0.05 }} />
      
      <div className="settings-container max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <span className="mono text-[10px] text-cyan-500 mb-1 block">USER_MOD // SYSTEM_CONFIG</span>
            <h1 className="text-4xl font-extrabold text-white">Registry Management</h1>
          </div>
          
          <div className="flex gap-4">
            <button 
               onClick={fetchConfig}
               className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-white transition-all"
               title="Revert all unsaved changes"
            >
               <RotateCcw size={20} />
            </button>
            <button 
              className={`flex items-center gap-3 px-6 py-3 bg-cyan-500 text-black font-black uppercase text-xs tracking-widest rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 transition-all active:scale-95 ${saving ? 'opacity-50' : ''}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              Apply Registry Updates
            </button>
          </div>
        </header>

        <div className="flex gap-8">
          {/* Vertical Tabs */}
          <div className="w-64 flex flex-col gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all group ${isActive ? 'bg-white/10 border border-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <Icon size={18} />
                  </div>
                  <span className="mono text-[10px] font-bold tracking-widest uppercase">{tab.label}</span>
                  {isActive && <div className="ml-auto w-1 h-4 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4]" />}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-[600px]">
            <GlassCard className="p-8 h-full">
              {activeTab === 'general' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">Core Identity</h2>
                    <p className="text-xs text-gray-500 mb-6">Manage the public-facing identity of the QuantMind engine.</p>
                    
                    <div className="space-y-6">
                      <div className="grid gap-2">
                        <label className="mono text-[10px] text-gray-400 uppercase tracking-widest">Global Site Title</label>
                        <input 
                          type="text"
                          value={getConfigValue('site_title')}
                          onChange={(e) => updateConfigValue('site_title', e.target.value)}
                          className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-cyan-400 mono focus:border-cyan-500/50 outline-none transition-all"
                        />
                      </div>

                      <div className="grid gap-2">
                        <label className="mono text-[10px] text-gray-400 uppercase tracking-widest">Official Logo Asset (URL)</label>
                        <div className="flex gap-4">
                          <input 
                            type="text"
                            value={getConfigValue('logo_url')}
                            onChange={(e) => updateConfigValue('logo_url', e.target.value)}
                            className="flex-1 bg-black/40 border border-white/5 p-4 rounded-xl text-cyan-400 mono focus:border-cyan-500/50 outline-none transition-all"
                          />
                          <div className="w-14 h-14 bg-black/60 rounded-xl border border-white/5 flex items-center justify-center p-2">
                             <img src={getConfigValue('logo_url')} alt="Preview" className="max-w-full max-h-full object-contain" onError={(e) => e.currentTarget.src = '/assets/logo-full.png'} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-8 border-t border-white/5">
                    <h2 className="text-xl font-bold text-white mb-2">System Notification Channels</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                       {Object.entries(getConfigValue('alert_channels', {})).map(([channel, enabled]) => (
                         <div 
                           key={channel}
                           onClick={() => {
                             const current = getConfigValue('alert_channels', {});
                             updateConfigValue('alert_channels', { ...current, [channel]: !enabled });
                           }}
                           className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center gap-3 ${enabled ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/5 text-gray-500'}`}
                         >
                           <Bell size={20} className={enabled ? 'animate-pulse' : ''} />
                           <span className="mono text-[10px] font-bold uppercase">{channel.replace('Alerts', '')}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">Protocol & Policies</h2>
                    <p className="text-xs text-gray-500 mb-6">Define multi-layer security enforcement rules.</p>
                    
                    <div className="space-y-4">
                       {[
                         { id: 'forceMfa', label: 'FORCE_MFA_ADMINS', desc: 'Require biometric or TOTP for all access.' },
                         { id: 'ipWhitelist', label: 'IP_WHITELIST_STRICT', desc: 'Restrict logins to designated CIDR blocks.' },
                       ].map((policy) => {
                         const policies = getConfigValue('security_policies', {});
                         const isActive = policies[policy.id] === true;
                         return (
                           <div key={policy.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
                             <div className="flex flex-col gap-1">
                               <span className="mono text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">{policy.label}</span>
                               <span className="text-[10px] text-gray-500">{policy.desc}</span>
                             </div>
                             <div 
                               onClick={() => updateConfigValue('security_policies', { ...policies, [policy.id]: !isActive })}
                               className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${isActive ? 'bg-cyan-500' : 'bg-white/10'}`}
                             >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'left-7 shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'left-1'}`} />
                             </div>
                           </div>
                         );
                       })}

                       <div className="p-4 bg-black/40 border border-white/5 rounded-2xl mt-4">
                          <div className="flex justify-between items-center mb-4">
                             <div className="flex flex-col gap-1">
                               <span className="mono text-xs font-bold text-white">AUTO_REVOKE_SESSIONS</span>
                               <span className="text-[10px] text-gray-500">Inactivity timeout before logout (minutes).</span>
                             </div>
                             <div className="flex items-center gap-3">
                               <RefreshCw size={14} className="text-cyan-500" />
                               <span className="mono text-lg font-black text-white">{getConfigValue('security_policies', {}).sessionTimeout || 60}</span>
                             </div>
                          </div>
                          <input 
                            type="range"
                            min="15"
                            max="480"
                            step="15"
                            value={getConfigValue('security_policies', {}).sessionTimeout || 60}
                            onChange={(e) => {
                               const current = getConfigValue('security_policies', {});
                               updateConfigValue('security_policies', { ...current, sessionTimeout: parseInt(e.target.value) });
                            }}
                            className="w-full accent-cyan-500"
                          />
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">External Linkage</h2>
                    <p className="text-xs text-gray-500 mb-6">Configure secure endpoints for financial processing.</p>
                    
                    <div className="space-y-6">
                      <div className="grid gap-4">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                           <div className="flex items-baseline gap-2 mb-4">
                             <span className="px-2 py-0.5 bg-black rounded text-[9px] font-black text-white mono">SERVICE</span>
                             <span className="text-xs font-bold text-white">PAYSTACK_TRANSMISSION_PROTOCOL</span>
                           </div>
                           
                           <div className="space-y-4">
                              <div className="grid gap-2">
                                <label className="mono text-[10px] text-gray-500 uppercase tracking-[2px]">Public Link Key</label>
                                <input 
                                  type="text" 
                                  value={getConfigValue('paystack_public_key')}
                                  onChange={(e) => updateConfigValue('paystack_public_key', e.target.value)}
                                  className="w-full bg-black/60 border border-white/5 p-3 rounded-xl text-cyan-400 mono text-xs outline-none"
                                />
                              </div>
                              <div className="grid gap-2">
                                <div className="flex justify-between">
                                  <label className="mono text-[10px] text-gray-500 uppercase tracking-[2px]">Secret Crypt Key</label>
                                  <button onClick={() => setShowSecret(!showSecret)} className="text-gray-500 hover:text-white transition-colors">
                                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                </div>
                                <input 
                                  type={showSecret ? "text" : "password"} 
                                  value={getConfigValue('paystack_secret_key')}
                                  onChange={(e) => updateConfigValue('paystack_secret_key', e.target.value)}
                                  className="w-full bg-black/60 border border-white/5 p-3 rounded-xl text-purple-400 mono text-xs outline-none tracking-widest"
                                />
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'engine' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">Kernel Modifications</h2>
                    <p className="text-xs text-gray-500 mb-6">Direct access to core plan metadata and tier logic.</p>
                    
                    <div className="space-y-6">
                       <div className="grid gap-2">
                          <div className="flex items-center gap-2 mb-2">
                             <Database size={14} className="text-cyan-500" />
                             <label className="mono text-[10px] text-gray-400 uppercase tracking-widest">TIER_ENTITLEMENT_MATRIX (JSON)</label>
                          </div>
                          <textarea 
                             rows={10}
                             value={JSON.stringify(getConfigValue('tier_config', {}), null, 2)}
                             onChange={(e) => {
                               try {
                                 const parsed = JSON.parse(e.target.value);
                                 updateConfigValue('tier_config', parsed);
                               } catch(e) {}
                             }}
                             className="w-full bg-black/60 border border-white/5 p-4 rounded-xl text-cyan-400 mono text-xs outline-none focus:border-cyan-500/30 resize-none font-mono"
                          />
                       </div>

                       <div className="grid gap-2">
                          <div className="flex items-center gap-2 mb-2">
                             <Server size={14} className="text-purple-500" />
                             <label className="mono text-[10px] text-gray-400 uppercase tracking-widest">PLAN_METADATA_STREAM (JSON)</label>
                          </div>
                          <textarea 
                             rows={6}
                             value={JSON.stringify(getConfigValue('pesapal_plans', []), null, 2)}
                             onChange={(e) => {
                               try {
                                 const parsed = JSON.parse(e.target.value);
                                 updateConfigValue('pesapal_plans', parsed);
                               } catch(e) {}
                             }}
                             className="w-full bg-black/60 border border-white/5 p-4 rounded-xl text-purple-400 mono text-xs outline-none focus:border-purple-500/30 resize-none font-mono"
                          />
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-container {
          padding-bottom: 5rem;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }

        h1 {
          letter-spacing: -1px;
        }
      `}</style>
    </AdminLayout>
  );
}
