'use client';

import React from 'react';
import { ShieldAlert, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LimitBannerProps {
  currentValue: number;
  maxValue: number;
  unit: string;
  onUpgrade: () => void;
  className?: string;
}

export function LimitBanner({ currentValue, maxValue, unit, onUpgrade, className }: LimitBannerProps) {
  const percentage = Math.min(100, (currentValue / maxValue) * 100);
  const isClose = percentage >= 75;
  const isFull = percentage >= 100;

  return (
    <div className={cn(
      "p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500",
      isFull ? "bg-[#FF453A]/10 border-[#FF453A]/30" : 
      isClose ? "bg-[#FFD60A]/10 border-[#FFD60A]/30" : 
      "bg-white/5 border-white/10",
      className
    )}>
      <div className="flex items-start gap-4 flex-1 w-full">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          isFull ? "bg-[#FF453A]/20 text-[#FF453A]" : 
          isClose ? "bg-[#FFD60A]/20 text-[#FFD60A]" : 
          "bg-[#00D9FF]/20 text-[#00D9FF]"
        )}>
          {isFull ? <ShieldAlert size={18} /> : isClose ? <TrendingUp size={18} /> : <Zap size={18} />}
        </div>
        
        <div className="flex-1 space-y-2">
           <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] font-mono">
                {isFull ? "Protocol_Threshold_Reached" : isClose ? "Capacity_Threshold_Warning" : "Node_Resource_Utilization"}
              </span>
              <span className="text-[10px] font-mono text-[#848D97] uppercase tracking-widest">
                {currentValue.toLocaleString()} / {maxValue.toLocaleString()} {unit}
              </span>
           </div>
           
           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className={cn(
                  "h-full transition-all duration-1000 ease-out rounded-full",
                  isFull ? "bg-[#FF453A]" : isClose ? "bg-[#FFD60A]" : "bg-[#00D9FF]"
                )}
                style={{ width: `${percentage}%` }}
              />
           </div>
           
           <p className="text-[9px] text-[#848D97] uppercase font-mono tracking-wider leading-relaxed">
             {isFull 
               ? "Deployment cycle exhausted. Upgrade to higher tier nodes for immediate processing." 
               : isClose ? "Current resource allocation is nearing capacity. Consider scaling your environment."
               : "Standard utilization levels. Priority nodes available for accelerated compute."}
           </p>
        </div>
      </div>

      <button 
        onClick={onUpgrade}
        className={cn(
          "px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 w-full md:w-auto flex items-center justify-center gap-2",
          isFull ? "bg-[#FF453A] text-white" : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
        )}
      >
        {isFull ? "Upgrade_Node" : "Scale_Resources"}
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
