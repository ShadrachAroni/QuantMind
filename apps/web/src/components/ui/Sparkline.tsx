'use client';

import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ 
  data, 
  width = 100, 
  height = 30, 
  color = '#00D9FF' 
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {/* Glow path */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeOpacity="0.2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="blur-[2px]"
      />
      {/* Main path */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* Gradient Area */}
      <path
        d={`M 0 ${height} L ${points} L ${width} ${height} Z`}
        fill={`url(#gradient-${color.replace('#', '')})`}
        className="opacity-10"
      />
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
