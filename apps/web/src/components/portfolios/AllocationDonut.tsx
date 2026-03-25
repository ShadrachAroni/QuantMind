'use client';

import React from 'react';

interface AllocationDonutProps {
  data: { symbol: string; allocation: number; color: string }[];
}

export function AllocationDonut({ data }: AllocationDonutProps) {
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[200px] h-[200px]">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
          {data.map((item, i) => {
            const strokeDasharray = `${(item.allocation / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativeOffset;
            cumulativeOffset += (item.allocation / 100) * circumference;

            return (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out hover:opacity-80 cursor-pointer"
                strokeLinecap="round"
              />
            );
          })}
          {/* Inner ring for glass effect */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2 - 2}
            fill="transparent"
            stroke="white"
            strokeOpacity="0.05"
            strokeWidth="1"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
           <span className="text-[10px] font-bold text-[#848D97] uppercase tracking-widest">Total</span>
           <span className="text-2xl font-mono font-bold text-white">100%</span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 w-full">
         {data.map((item, i) => (
           <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              <span className="text-[10px] font-bold text-white uppercase font-mono">{item.symbol}</span>
              <span className="text-[10px] text-[#848D97] ml-auto">{item.allocation}%</span>
           </div>
         ))}
      </div>
    </div>
  );
}
