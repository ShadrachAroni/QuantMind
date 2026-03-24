'use client';

import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { GlassCard } from '../ui/GlassCard';

interface SpectralChartProps {
  title: string;
  data: Array<{ name: string; value: number }>;
}

export function SpectralChart({ title, data }: SpectralChartProps) {
  return (
    <GlassCard intensity="high" className="p-8 h-full relative group">
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
        <div>
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-widest block mb-1">Signal_Processing // Node_01</span>
          <h2 className="text-sm font-black text-white mono uppercase">{title}</h2>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]" />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/10" />
        </div>
      </div>
      
      <div className="h-[250px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSpectral" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="rgba(255,255,255,0.03)" 
            />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }} 
            />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(15, 23, 42, 0.9)', 
                border: '1px solid rgba(0, 245, 255, 0.2)', 
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ color: '#06b6d4', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}
              labelStyle={{ color: '#fff', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#06b6d4" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSpectral)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
         <span className="text-[9px] mono text-slate-500">SAMPLING_RATE: 2.4GHz</span>
         <span className="text-[9px] mono text-slate-500">BUFFER_LOAD: 12.4%</span>
      </div>

      <style jsx>{`
        .group:hover :global(.recharts-curve) {
          filter: drop-shadow(0 0 8px rgba(0, 245, 255, 0.5));
          transition: filter 0.3s ease;
        }
      `}</style>
    </GlassCard>
  );
}
