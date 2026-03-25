'use client';

import React from 'react';

interface HistogramProps {
  data: number[];
  height?: number;
}

export function Histogram({ data, height = 200 }: HistogramProps) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const binCount = 40;
  const bins = new Array(binCount).fill(0);
  
  data.forEach(val => {
    const binIndex = Math.min(
      Math.floor(((val - min) / range) * binCount),
      binCount - 1
    );
    bins[binIndex]++;
  });

  const maxBin = Math.max(...bins);
  const width = 800;

  return (
    <div className="w-full bg-[#05070A]/50 rounded-xl p-4 border border-white/5">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {bins.map((count, i) => {
          const barHeight = (count / maxBin) * height;
          const barWidth = width / binCount;
          const x = i * barWidth;
          const y = height - barHeight;

          return (
            <rect
              key={i}
              x={x + 1}
              y={y}
              width={barWidth - 2}
              height={barHeight}
              fill="url(#barGradient)"
              rx="2"
              className="transition-all duration-500 hover:fill-[#00D9FF]"
            />
          );
        })}

        {/* X-Axis Labels (Min/Max) */}
        <text x="0" y={height + 15} fontSize="10" fill="#848D97" className="font-mono">
          ${Math.round(min/1000)}k
        </text>
        <text x={width} y={height + 15} fontSize="10" fill="#848D97" textAnchor="end" className="font-mono">
          ${Math.round(max/1000)}k
        </text>
      </svg>
    </div>
  );
}
