'use client';

import React from 'react';

interface FanChartProps {
  data: {
    median: number[];
    upper95: number[];
    lower95: number[];
    upper99: number[];
    lower99: number[];
  };
  height?: number;
}

export function FanChart({ data, height = 400 }: FanChartProps) {
  const width = 1000;
  const len = data.median.length;
  
  const allValues = [
    ...data.upper99,
    ...data.lower99
  ];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = (max - min) || 1;
  const padding = range * 0.1;
  const effectiveMin = min - padding;
  const effectiveMax = max + padding;
  const effectiveRange = effectiveMax - effectiveMin;

  const getPoints = (arr: number[]) => 
    arr.map((v, i) => `${(i / (len - 1)) * width},${height - ((v - effectiveMin) / effectiveRange) * height}`).join(' ');

  const getAreaPoints = (upper: number[], lower: number[]) => {
    const up = upper.map((v, i) => `${(i / (len - 1)) * width},${height - ((v - effectiveMin) / effectiveRange) * height}`);
    const down = lower.map((v, i) => `${(i / (len - 1)) * width},${height - ((v - effectiveMin) / effectiveRange) * height}`).reverse();
    return [...up, ...down].join(' ');
  };

  return (
    <div className="w-full relative group bg-[#05070A] rounded-2xl overflow-hidden border border-white/5">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="fan99" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="fan95" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1="0"
            y1={height * p}
            x2={width}
            y2={height * p}
            stroke="white"
            strokeOpacity="0.03"
            strokeWidth="1"
          />
        ))}

        {/* 99% Confidence Interval (Outer Fan) */}
        <polygon points={getAreaPoints(data.upper99, data.lower99)} fill="url(#fan99)" />

        {/* 95% Confidence Interval (Inner Fan) */}
        <polygon points={getAreaPoints(data.upper95, data.lower95)} fill="url(#fan95)" />

        {/* Median Path */}
        <polyline
          points={getPoints(data.median)}
          fill="none"
          stroke="#00D9FF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Target Indicator */}
        <line 
          x1={width} y1="0" x2={width} y2={height} 
          stroke="#00D9FF" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.3" 
        />
      </svg>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#00D9FF] opacity-30" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">95% Conf</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#00D9FF] opacity-10" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">99% Tail</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-[#00D9FF]" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Median</span>
         </div>
      </div>
    </div>
  );
}
