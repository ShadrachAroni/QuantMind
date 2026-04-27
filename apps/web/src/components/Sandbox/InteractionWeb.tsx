'use client';
import React, { useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Network } from 'lucide-react';

export function InteractionWeb({ data }: { data: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In a real implementation, we would initialize D3.js here.
    // For now, we mock the visualization.
  }, [data]);

  return (
    <GlassCard className="w-full flex flex-col gap-4 min-h-[400px]">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-mono text-white flex items-center gap-2">
          <Network size={20} className="text-[#00D9FF]" />
          Interaction Web
        </h3>
        <span className="text-xs text-[#848D97] font-mono uppercase">
          Agent Reflexivity Network
        </span>
      </div>

      <div 
        className="flex-1 bg-[#05070A]/80 border border-white/5 rounded-xl flex flex-col items-center justify-center overflow-hidden relative p-4"
      >
        {data.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
              <Network size={32} className="text-[#848D97]" />
            </div>
            <div className="text-[#848D97] font-mono text-sm uppercase tracking-widest">
              Awaiting_Simulation_Seed
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <svg width="100%" height="100%" viewBox="0 0 800 400" className="drop-shadow-[0_0_15px_rgba(0,217,255,0.2)]">
              {/* Force-directed style layout (static for now but using data) */}
              {data[data.length - 1]?.agent_actions.map((action: any, i: number, arr: any[]) => {
                const angle = (i / arr.length) * 2 * Math.PI;
                const r = 120;
                const x = 400 + r * Math.cos(angle);
                const y = 200 + r * Math.sin(angle);
                const color = action.action === 'BUY' ? '#32D74B' : action.action === 'SELL' ? '#FF453A' : '#00D9FF';
                
                return (
                  <g key={action.agent}>
                    {/* Connections to center */}
                    <line x1="400" y1="200" x2={x} y2={y} stroke="white" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="4 2" />
                    
                    {/* Agent Node */}
                    <circle cx={x} cy={y} r="25" fill="#05070A" stroke={color} strokeWidth="2" />
                    <text x={x} y={y + 5} textAnchor="middle" fontSize="8" fill="white" fontStyle="bold" className="pointer-events-none">
                      {action.agent.substring(0, 3)}
                    </text>
                    
                    {/* Action Label */}
                    <g transform={`translate(${x + 30}, ${y - 10})`}>
                      <rect width="50" height="20" rx="4" fill={color + '20'} stroke={color + '40'} />
                      <text x="25" y="14" textAnchor="middle" fontSize="8" fill={color} fontWeight="bold">
                        {action.action}
                      </text>
                    </g>
                  </g>
                );
              })}
              
              {/* Central Signal Node */}
              <circle cx="400" cy="200" r="40" fill="#00D9FF10" stroke="#00D9FF" strokeWidth="1" strokeDasharray="5 5" className="animate-spin-slow origin-center" style={{ transformOrigin: '400px 200px' }} />
              <Network x="385" y="185" size={30} className="text-[#00D9FF] opacity-50" />
            </svg>
            
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
               <div className="space-y-1">
                  <p className="text-[10px] text-[#00D9FF] font-bold uppercase tracking-widest">Live_Signal_Relay</p>
                  <p className="text-xs text-white/60 font-mono truncate max-w-md">{data[data.length - 1]?.signal}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] text-[#848D97] font-bold uppercase tracking-widest">Tick_State</p>
                  <p className="text-xl text-white font-mono">{data.length} / 24</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
