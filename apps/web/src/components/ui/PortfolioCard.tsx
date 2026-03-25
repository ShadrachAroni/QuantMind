'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, TrendingUp, MoreVertical, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Sparkline } from '@/components/ui/Sparkline';
import { formatCurrency, cn } from '@/lib/utils';

interface PortfolioCardProps {
  portfolio: {
    id: string;
    name: string;
    total_value: number;
    change_24h: number;
    asset_count: number;
    status: string;
    risk_profile: string;
    history: number[];
  };
}

export function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const isPositive = portfolio.change_24h >= 0;

  return (
    <Link href={`/dashboard/portfolios/${portfolio.id}`} className="block group">
      <GlassCard className="p-6 relative overflow-hidden transition-all group-hover:bg-white/[0.04] group-hover:border-[#00D9FF]/20" intensity="low">
        {/* Status Indicator */}
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px]",
                portfolio.status === 'DIVERSIFIED' ? 'bg-[#32D74B] text-[#32D74B]' : 'bg-[#FFD60A] text-[#FFD60A]'
              )} />
              <span className="text-[10px] font-bold text-[#848D97] uppercase tracking-widest">{portfolio.status}</span>
           </div>
           <button className="text-[#848D97] hover:text-white transition-colors">
              <MoreVertical size={16} />
           </button>
        </div>

        {/* Info */}
        <div className="space-y-1 mb-8">
           <h3 className="text-lg font-bold text-white uppercase font-mono tracking-tight group-hover:text-[#00D9FF] transition-colors">{portfolio.name}</h3>
           <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#848D97] uppercase tracking-widest font-bold">Risk Profile:</span>
              <span className="text-[10px] text-white font-mono">{portfolio.risk_profile}</span>
           </div>
        </div>

        {/* Visual Metric */}
        <div className="flex items-end justify-between gap-4">
           <div>
              <p className="text-[10px] text-[#848D97] uppercase tracking-widest mb-1 font-bold">Tactical Value</p>
              <h4 className="text-2xl font-mono text-white font-bold">{formatCurrency(portfolio.total_value)}</h4>
           </div>
           <div className="h-full flex flex-col items-end gap-2">
              <Sparkline data={portfolio.history} color={isPositive ? '#32D74B' : '#FF453A'} />
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold font-mono",
                isPositive ? 'text-[#32D74B]' : 'text-[#FF453A]'
              )}>
                 {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                 {isPositive ? '+' : ''}{portfolio.change_24h}%
              </div>
           </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 opacity-60">
                 <Briefcase size={12} className="text-[#848D97]" />
                 <span className="text-[10px] font-mono text-white">{portfolio.asset_count} Assets</span>
              </div>
           </div>
           <Tag size={12} className="text-[#848D97] opacity-20" />
        </div>
      </GlassCard>
    </Link>
  );
}
