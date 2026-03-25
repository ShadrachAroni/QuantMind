'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Shield, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  Play, 
  X,
  Maximize2,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface Insight {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  category: 'RISK' | 'SYSTEM' | 'MARKET' | 'DEPLOYMENT';
  message: string;
  time: string;
  metadata?: any;
}

interface InsightFeedProps {
  insights: Insight[];
  isExpanded?: boolean;
  onClose?: () => void;
}

export function InsightFeed({ insights, isExpanded, onClose }: InsightFeedProps) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | Insight['category']>('ALL');

  const filteredInsights = activeFilter === 'ALL' 
    ? insights 
    : insights.filter(i => i.category === activeFilter);

  const getIcon = (type: Insight['type'], category: Insight['category']) => {
    switch (category) {
      case 'RISK': return <Shield className="w-4 h-4" />;
      case 'MARKET': return <TrendingUp className="w-4 h-4" />;
      case 'DEPLOYMENT': return <Briefcase className="w-4 h-4" />;
      case 'SYSTEM': return <Zap className="w-4 h-4" />;
      default:
        switch (type) {
          case 'success': return <ShieldCheck className="w-4 h-4" />;
          case 'error': return <Shield className="w-4 h-4" />;
          default: return <Activity className="w-4 h-4" />;
        }
    }
  };

  const getCategoryColor = (category: Insight['category']) => {
    switch (category) {
      case 'RISK': return 'text-[#FFD60A] bg-[#FFD60A]/10 border-[#FFD60A]/20';
      case 'MARKET': return 'text-[#00D9FF] bg-[#00D9FF]/10 border-[#00D9FF]/20';
      case 'DEPLOYMENT': return 'text-[#32D74B] bg-[#32D74B]/10 border-[#32D74B]/20';
      case 'SYSTEM': return 'text-[#7C3AED] bg-[#7C3AED]/10 border-[#7C3AED]/20';
      default: return 'text-[#848D97] bg-white/5 border-white/10';
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-[#0A0C14] border border-white/5",
      isExpanded ? "rounded-3xl shadow-2xl" : "bg-transparent border-none"
    )}>
      {/* Header if expanded */}
      {isExpanded && (
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight uppercase font-mono">Vault_Insights_Stream</h2>
            <p className="text-[10px] text-[#848D97] uppercase tracking-[0.2em] font-bold mt-1">Live Institutional Telemetry Feed</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-[#848D97]">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className={cn(
        "flex items-center gap-2 p-4 overflow-x-auto no-scrollbar border-b border-white/5",
        !isExpanded && "pt-0 border-none px-0 mb-4"
      )}>
        <Filter size={12} className="text-[#848D97] mr-1 shrink-0" />
        {['ALL', 'RISK', 'MARKET', 'DEPLOYMENT', 'SYSTEM'].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f as any)}
            className={cn(
              "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all shrink-0",
              activeFilter === f 
                ? "bg-white text-[#05070A]" 
                : "bg-white/5 text-[#848D97] hover:bg-white/10"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {filteredInsights.length > 0 ? (
          filteredInsights.map((insight) => (
            <div 
              key={insight.id}
              className="group flex gap-4 p-4 rounded-2xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                insight.type === 'success' ? "bg-[#32D74B]/10 text-[#32D74B] border-[#32D74B]/20" : 
                insight.type === 'error' ? "bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/20" : 
                insight.type === 'warning' ? "bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20" :
                "bg-[#00D9FF]/10 text-[#00D9FF] border-[#00D9FF]/20"
              )}>
                {getIcon(insight.type, insight.category)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-0.5">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-widest",
                    getCategoryColor(insight.category)
                  )}>
                    {insight.category}
                  </span>
                  <span className="text-[9px] font-mono text-[#848D97]">
                    {format(new Date(insight.time), 'HH:mm:ss')}
                  </span>
                </div>
                <p className="text-xs font-medium text-white/90 leading-relaxed mb-1">
                  {insight.message}
                </p>
                {insight.metadata?.value && (
                  <p className="text-[10px] font-mono font-bold text-[#00D9FF] uppercase tracking-wider">
                    {insight.metadata.label}: {insight.metadata.value}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-48 opacity-20">
            <Activity className="w-8 h-8 text-[#848D97] mb-2 animate-pulse" />
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97]">Awaiting_Telemetry...</p>
          </div>
        )}
      </div>

      {/* Footer if expanded */}
      {isExpanded && (
        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          <p className="text-[9px] font-mono text-[#848D97]/50 uppercase text-center tracking-widest">
            Mission_Critical_Protocol_v4.5.2_Active
          </p>
        </div>
      )}
    </div>
  );
}
