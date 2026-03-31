'use client';

import React, { useState } from 'react';
import { X, Save, Sliders, Zap, Cpu, Shield, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/ToastProvider';

interface AdjustmentModalProps {
  user: any;
  onClose: () => void;
  onUpdate: () => void;
}

export function AdjustmentModal({ user, onClose, onUpdate }: AdjustmentModalProps) {
  const [tier, setTier] = useState(user.tier || 'free');
  const [simulationQuota, setSimulationQuota] = useState(user.simulation_quota_override || 0);
  const [aiTokenQuota, setAiTokenQuota] = useState(user.ai_token_quota_override || 0);
  const [isAdmin, setIsAdmin] = useState(user.is_admin || false);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error: err } = await supabase
        .from('user_profiles')
        .update({
          tier,
          simulation_quota_override: simulationQuota === 0 ? null : simulationQuota,
          ai_token_quota_override: aiTokenQuota === 0 ? null : aiTokenQuota,
          is_admin: isAdmin,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (err) throw err;

      // Log the action
      await supabase.from('admin_audit_log').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action_type: 'UPDATE',
        target_resource: 'user_profiles',
        target_id: user.id,
        new_value: { tier, simulationQuota, aiTokenQuota, isAdmin },
        reason: 'Manual administrative adjustment'
      });

      success('ADJUSTMENT_COMMITTED', `Protocol parameters for ${user.email} synchronized.`);
      onUpdate();
      onClose();
    } catch (e: any) {
      error('ADJUSTMENT_FAULT', e.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <GlassCard className="relative w-full max-w-lg overflow-hidden border-white/10 shadow-2xl animate-scale-in" intensity="high">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
           <div>
              <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] block mb-1">Override // Kernel_Parameters</span>
              <h2 className="text-xl font-black text-white tracking-widest uppercase italic">Manual Adjustment</h2>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-500 hover:text-white">
              <X size={20} />
           </button>
        </div>

        <div className="p-8 space-y-8">
           {/* Tier Selection */}
           <div className="space-y-4">
              <label className="mono text-[10px] text-gray-500 uppercase flex items-center gap-2">
                 <Shield size={12} className="text-purple-500" />
                 Clearance_Level_Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                 {['free', 'plus', 'pro', 'student'].map(t => (
                   <button
                     key={t}
                     onClick={() => setTier(t)}
                     className={`py-3 rounded-2xl border mono text-[10px] tracking-widest transition-all ${tier === t ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-white/5 border-white/5 text-gray-600 hover:border-white/10'}`}
                   >
                     {t.toUpperCase()}
                   </button>
                 ))}
              </div>
           </div>

           {/* Quota Overrides */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <label className="mono text-[10px] text-gray-500 uppercase flex items-center gap-2">
                    <Zap size={12} className="text-cyan-500" />
                    Simulation_Limit
                 </label>
                 <div className="relative">
                    <input 
                       type="number"
                       value={simulationQuota}
                       onChange={(e) => setSimulationQuota(parseInt(e.target.value) || 0)}
                       className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs mono text-cyan-400 focus:outline-none focus:border-cyan-500/50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] mono text-gray-700">PATHS</span>
                 </div>
                 <p className="text-[9px] mono text-gray-600 leading-tight">Leave 0 to use tier defaults.</p>
              </div>

              <div className="space-y-4">
                  <label className="mono text-[10px] text-gray-500 uppercase flex items-center gap-2">
                     <Cpu size={12} className="text-purple-500" />
                     Neural_Bandwidth_Cap
                  </label>
                  <div className="relative">
                     <input 
                        type="number"
                        value={aiTokenQuota}
                        onChange={(e) => setAiTokenQuota(parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs mono text-purple-400 focus:outline-none focus:border-purple-500/50"
                     />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] mono text-gray-700">REQ</span>
                  </div>
                  <p className="text-[9px] mono text-gray-600 leading-tight">Daily request limit. 0 for tier defaults.</p>
              </div>
           </div>

           {/* Admin Toggle */}
           <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${isAdmin ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-600'}`}>
                    <AlertTriangle size={14} />
                 </div>
                 <div>
                    <span className="text-[10px] font-black text-gray-200 uppercase tracking-widest">Elevate_Permissions</span>
                    <p className="text-[8px] mono text-gray-500">Grants full administrative oversight.</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsAdmin(!isAdmin)}
                className={`w-12 h-6 rounded-full transition-all relative ${isAdmin ? 'bg-red-500' : 'bg-white/10'}`}
              >
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAdmin ? 'left-7' : 'left-1'}`} />
              </button>
           </div>
        </div>

        <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-4">
           <button 
             onClick={onClose}
             className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] mono text-gray-500 hover:text-white transition-all"
           >
              ABORT_CHANGES
           </button>
           <button 
             onClick={handleSave}
             disabled={loading}
             className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-2xl shadow-lg shadow-cyan-500/20 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
           >
              {loading ? 'SYNCHRONIZING...' : (
                <>
                  <Save size={16} />
                  COMMIT_OVERRIDE
                </>
              )}
           </button>
        </div>
      </GlassCard>

      <style jsx>{`
        .animate-scale-in { animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
