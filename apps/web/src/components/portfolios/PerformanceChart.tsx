'use client';

import React from 'react';
import { cn, formatCurrency } from '@/lib/utils';

interface PerformanceChartProps {
  data: { timestamp: string; value: number }[];
  height?: number;
}

export function PerformanceChart({ data, height = 300 }: PerformanceChartProps) {
  if (!data || data.length < 2) return null;

  const width = 1000; // Reference width
  const min = Math.min(...data.map(d => d.value));
  const max = Math.max(...data.map(d => d.value));
  const range = (max - min) || 1;
  const padding = range * 0.1;
  const effectiveMin = min - padding;
  const effectiveMax = max + padding;
  const effectiveRange = effectiveMax - effectiveMin;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - effectiveMin) / effectiveRange) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height} 0,${height}`;

  return (
    <div className="w-full relative group">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full overflow-visible drop-shadow-[0_0_15px_rgba(0,217,255,0.15)]"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00D9FF" stopOpacity="0" />
          </linearGradient>
          
          <filter id="glow">
             <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
             <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
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

        {/* Fill Area */}
        <path d={areaPoints} fill="url(#chartGradient)" />

        {/* Main Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#00D9FF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />

        {/* Interactive Points (Visual flare) */}
        {data.length > 0 && (
          <circle
            cx={(data.length - 1) / (data.length - 1) * width}
            cy={height - ((data[data.length - 1].value - effectiveMin) / effectiveRange) * height}
            r="4"
            fill="#00D9FF"
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  );
}
