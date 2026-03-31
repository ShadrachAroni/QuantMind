'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface RiskSurface3DProps {
  data: {
    median: number[];
    upper95: number[];
    lower95: number[];
    upper99: number[];
    lower99: number[];
  };
}

export const RiskSurface3D: React.FC<RiskSurface3DProps> = ({ data }) => {
  const { median, upper95, lower95, upper99, lower99 } = data;
  
  // Downsample to make it faster/cleaner for 3D view
  const step = Math.max(1, Math.floor((median?.length || 0) / 40));
  
  const points = useMemo(() => {
    if (!median || median.length === 0) return [];
    
    const p = [];
    for (let i = 0; i < median.length; i += step) {
      p.push({
        t: i,
        m: median[i],
        u95: upper95[i],
        l95: lower95[i],
        u99: upper99[i] || upper95[i],
        l99: lower99[i] || lower95[i],
      });
    }
    // Ensure last point is included
    if ((median.length - 1) % step !== 0) {
      const last = median.length - 1;
      p.push({
        t: last,
        m: median[last],
        u95: upper95[last],
        l95: lower95[last],
        u99: upper99[last] || upper95[last],
        l99: lower99[last] || lower95[last],
      });
    }
    return p;
  }, [data, step, median, upper95, lower95, upper99, lower99]);

  if (!median || median.length === 0) return null;

  const initialValue = median[0];
  const maxVal = Math.max(...upper99) * 1.1;
  const minVal = Math.min(...lower99) * 0.9;
  const range = maxVal - minVal;

  const getPos = (val: number, t: number) => {
    const x = (t / (median.length - 1)) * 100;
    const y = 100 - ((val - minVal) / range) * 100;
    return { x, y };
  };

  return (
    <div className="relative w-full h-[300px] overflow-hidden group">
      <div className="absolute inset-0 flex items-center justify-center p-8 bg-[#05070A]/50 rounded-2xl border border-white/5">
        {/* Isometric Container */}
        <div 
          className="w-full h-full relative"
          style={{ 
            perspective: '1200px',
            transformStyle: 'preserve-3d'
          }}
        >
          <motion.div 
            initial={{ rotateX: 45, rotateZ: -35, scale: 0.8, opacity: 0 }}
            animate={{ rotateX: 35, rotateZ: -25, scale: 0.9, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-full h-full relative"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Base Grid */}
            <div className="absolute inset-0 border border-white/10 bg-white/[0.02]" style={{ transform: 'translateZ(-20px)' }}>
               <div className="absolute inset-0 opacity-10" style={{ 
                 backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                 backgroundSize: '20px 20px'
               }} />
            </div>

            {/* Path Shroud (CVaR Region) */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
               {/* 99% Confidence Interval (The "Risk Surface") */}
               <path 
                 d={`M ${points.map(p => {
                    const pos = getPos(p.u99, p.t);
                    return `${pos.x}% ${pos.y}%`;
                 }).join(' L ')} L ${[...points].reverse().map(p => {
                    const pos = getPos(p.l99, p.t);
                    return `${pos.x}% ${pos.y}%`;
                 }).join(' L ')} Z`}
                 fill="url(#riskGradient)"
                 fillOpacity="0.1"
                 stroke="none"
               />
               
               {/* 95% Confidence Interval */}
               <path 
                 d={`M ${points.map(p => {
                    const pos = getPos(p.u95, p.t);
                    return `${pos.x}% ${pos.y}%`;
                 }).join(' L ')} L ${[...points].reverse().map(p => {
                    const pos = getPos(p.l95, p.t);
                    return `${pos.x}% ${pos.y}%`;
                 }).join(' L ')} Z`}
                 fill="rgba(0, 217, 255, 0.1)"
                 stroke="rgba(0, 217, 255, 0.2)"
                 strokeWidth="1"
               />

               {/* Median Path */}
               <path 
                 d={`M ${points.map(p => {
                    const pos = getPos(p.m, p.t);
                    return `${pos.x}% ${pos.y}%`;
                 }).join(' L ')}`}
                 fill="none"
                 stroke="#00D9FF"
                 strokeWidth="2"
                 filter="url(#glow3d)"
               />

               <defs>
                  <linearGradient id="riskGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FF453A" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#FF453A" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow3d">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
               </defs>
            </svg>

            {/* Floating Markers */}
            <div 
              className="absolute pointer-events-none"
              style={{ 
                left: '100%', 
                top: `${getPos(median[median.length-1], median.length-1).y}%`,
                transform: 'translateZ(20px)'
              }}
            >
               <div className="flex flex-col items-start gap-1">
                  <span className="text-[8px] font-bold text-[#00D9FF] bg-[#00D9FF]/20 px-1 rounded uppercase tracking-tighter">Terminal_Target</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shadow-[0_0_8px_#00D9FF]" />
               </div>
            </div>

            <div 
              className="absolute pointer-events-none"
              style={{ 
                left: '100%', 
                top: `${getPos(lower99[lower99.length-1], lower99.length-1).y}%`,
                transform: 'translateZ(10px)'
              }}
            >
               <div className="flex flex-col items-start gap-1">
                  <span className="text-[8px] font-bold text-[#FF453A] bg-[#FF453A]/20 px-1 rounded uppercase tracking-tighter">Tail_Limit (CVaR)</span>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00D9FF]" />
              <span className="text-[9px] font-mono text-white/40 uppercase">Expected_Trajectory</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF453A]/40" />
              <span className="text-[9px] font-mono text-white/40 uppercase">Risk_Surface (99% CI)</span>
           </div>
        </div>
      </div>
    </div>
  );
};
