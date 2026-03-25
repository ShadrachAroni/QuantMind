import React from 'react';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: 'free' | 'plus' | 'pro' | 'student';
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const configs = {
    free: { label: 'EXPLORER', styles: 'bg-white/10 text-[#848D97] border-white/10' },
    plus: { label: 'PLUS', styles: 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/20' },
    pro: { label: 'QUANTMIND_PRO', styles: 'bg-[#D4A017]/20 text-[#D4A017] border-[#D4A017]/20 shadow-[0_0_10px_rgba(212,160,23,0.3)]' },
    student: { label: 'ACADEMIC', styles: 'bg-[#7C3AED]/20 text-[#7C3AED] border-[#7C3AED]/20' },
  };

  const config = configs[tier];

  return (
    <span className={cn(
      'px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-widest',
      config.styles,
      className
    )}>
      {config.label}
    </span>
  );
}
