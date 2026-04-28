'use client';

import React, { useState } from 'react';
import { Lock, Zap, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/components/UserContext';
import { UpgradeModal } from './UpgradeModal';
import { createClient } from '@/lib/supabase';

interface FeatureGateProps {
  children: React.ReactNode;
  requiredTier: 'plus' | 'pro';
  featureName: string;
  className?: string;
  blur?: boolean;
}

export function FeatureGate({ children, requiredTier, featureName, className, blur = true }: FeatureGateProps) {
  const { profile } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClient();

  const tierPriority = {
    free: 0,
    student: 1,
    plus: 2,
    pro: 3
  };

  const currentTier = (profile?.tier as 'free' | 'plus' | 'pro' | 'student') || 'free';
  const hasAccess = tierPriority[currentTier] >= tierPriority[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  const handleGateClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
    
    // Log Analytics Event for CTR tracking
    if (profile?.id) {
      try {
        await supabase.from('analytics_events').insert({
          user_id: profile.id,
          event_type: 'feature_gate_triggered',
          properties: {
            feature_name: featureName,
            required_tier: requiredTier,
            current_tier: currentTier,
            location: 'web_dashboard'
          }
        });
      } catch (err) {
        console.error('Failed to log feature gate event', err);
      }
    }
  };

  return (
    <>
      <div 
        className={cn("relative group cursor-pointer", className)}
        onClickCapture={handleGateClick}
      >
        {/* Children with Blur */}
        <div className={cn(
          "transition-all duration-500",
          blur ? "blur-[8px] opacity-40 pointer-events-none select-none" : "opacity-30 grayscale"
        )}>
          {children}
        </div>

        {/* Lock Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 animate-in fade-in zoom-in-95 duration-500">
           <div className={cn(
             "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
             requiredTier === 'pro' ? "bg-[#D4A017]/20 border border-[#D4A017]/40" : "bg-[#00D9FF]/20 border border-[#00D9FF]/40"
           )}>
              <Lock size={20} className={requiredTier === 'pro' ? "text-[#D4A017]" : "text-[#00D9FF]"} />
           </div>
           
           <div className="bg-[#05070A]/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 flex flex-col items-center gap-1 shadow-2xl">
              <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] font-mono leading-none">{featureName}</span>
              <div className="flex items-center gap-2">
                 <span className={cn(
                   "text-[9px] font-bold uppercase px-2 py-0.5 rounded",
                   requiredTier === 'pro' ? "bg-[#D4A017]/20 text-[#D4A017]" : "bg-[#00D9FF]/20 text-[#00D9FF]"
                 )}>
                    {requiredTier.toUpperCase()}_REQUIRED
                 </span>
                 <Zap size={10} className="text-[#32D74B] animate-pulse" />
              </div>
           </div>

           {/* Tooltip hint */}
           <div className="absolute top-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                 <p className="text-[8px] text-[#848D97] uppercase tracking-widest font-mono whitespace-nowrap">Click_To_Upgrade_Node</p>
              </div>
           </div>
        </div>
      </div>

      <UpgradeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        requiredTier={requiredTier}
        featureName={featureName}
      />
    </>
  );
}
