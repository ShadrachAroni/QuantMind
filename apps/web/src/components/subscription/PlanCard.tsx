'use client';

import React from 'react';
import { Check, Zap, Shield, Cpu, GraduationCap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Plan } from '@/config/plans';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  onSelect: (planId: string) => void;
  isLoading: boolean;
  isComingSoon?: boolean;
  currentTier?: string;
}

export function PlanCard({ plan, isCurrent, onSelect, isLoading, isComingSoon, currentTier }: PlanCardProps) {
  const tierRank: Record<string, number> = {
    free: 0,
    student: 1,
    plus: 2,
    pro: 3
  };

  const planRank = tierRank[plan.tier] ?? 0;
  const userRank = tierRank[currentTier || 'free'] ?? 0;

  const isUpgrade = planRank > userRank;
  const isDowngrade = planRank < userRank;

  const isBestValue = plan.tier === 'pro';
  
  const icons = {
    free: Shield,
    plus: Zap,
    pro: Cpu,
    student: GraduationCap
  };
  
  const Icon = icons[plan.tier];

  const colors = {
    free: 'text-[#848D97]',
    plus: 'text-[#00D9FF]',
    pro: 'text-[#D4A017]',
    student: 'text-[#7C3AED]'
  };

  return (
    <GlassCard 
      className={cn(
        "p-6 md:p-8 flex flex-col relative overflow-hidden transition-all duration-500",
        isBestValue ? "border-[#D4A017]/30 bg-[#D4A017]/5" : "border-white/5",
        isCurrent ? "ring-2 ring-[#32D74B]/50" : "",
        isComingSoon && "opacity-40 grayscale-[0.5] cursor-not-allowed"
      )}
      intensity={isBestValue ? "high" : "medium"}
    >
      {isBestValue && (
        <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#D4A017] text-[#05070A] text-[9px] font-bold uppercase tracking-widest rounded-bl-xl shadow-[0_4px_10px_rgba(212,160,23,0.3)]">
          Institutional_Choice
        </div>
      )}
      
      {isComingSoon && (
        <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#7C3AED] text-white text-[9px] font-bold uppercase tracking-widest rounded-bl-xl shadow-[0_4px_10px_rgba(124,58,237,0.3)] z-20">
          Coming_Soon
        </div>
      )}

      <div className="mb-6 md:mb-8">
         <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center mb-4 md:mb-6", colors[plan.tier])}>
            <Icon size={20} className="md:w-6 md:h-6" />
         </div>
         <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-tight mb-2 font-mono">{plan.name}</h3>
         <div className="flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-bold font-mono text-white">${plan.price}</span>
            <span className="text-[10px] md:text-xs text-[#848D97] uppercase tracking-widest font-bold">/ Terminal</span>
         </div>
      </div>

      <ul className="flex-1 space-y-3 md:space-y-4 mb-6 md:mb-8">
         {plan.features.map((feature, i) => (
           <li key={i} className="flex items-start gap-3">
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                 <Check size={10} className={cn("md:w-3 md:h-3", colors[plan.tier])} />
              </div>
              <span className="text-[10px] md:text-xs text-[#848D97] leading-relaxed uppercase tracking-tight font-medium">{feature}</span>
           </li>
         ))}
      </ul>

      <button
        disabled={isCurrent || isLoading || isComingSoon}
        onClick={() => onSelect(plan.id)}
        className={cn(
          "w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all",
          isComingSoon
            ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
            : isCurrent 
              ? "bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/30 cursor-default" 
              : isBestValue 
                ? "bg-[#D4A017] text-[#05070A] hover:bg-[#D4A017]/90 shadow-[0_0_20px_rgba(212,160,23,0.2)]"
                : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
        )}
      >
         {isComingSoon 
          ? 'COMING_SOON' 
          : isCurrent 
            ? 'CURRENT_PROTOCOL' 
            : isLoading 
              ? 'INITIALIZING...' 
              : isUpgrade 
                ? `UPGRADE_TO_${plan.tier.toUpperCase()}` 
                : `DOWNGRADE_TO_${plan.tier.toUpperCase()}`}
       </button>

      {/* Decorative Glow */}
      <div className={cn(
        "absolute -bottom-12 -right-12 w-32 h-32 blur-[60px] opacity-20 transition-all duration-700",
        isBestValue ? "bg-[#D4A017]" : "bg-white"
      )} />
    </GlassCard>
  );
}
