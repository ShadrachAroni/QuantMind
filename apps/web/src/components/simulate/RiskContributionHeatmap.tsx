'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RiskContributionHeatmapProps {
  data: Record<string, number>;
  totalVaR: number;
}

export const RiskContributionHeatmap: React.FC<RiskContributionHeatmapProps> = ({ data, totalVaR }) => {
  const assets = Object.entries(data).sort((a, b) => b[1] - a[1]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Risk_Contribution_Heatmap [Alpha]</h3>
        <span className="text-[9px] text-[#848D97] uppercase">Total Loss Potential: ${totalVaR.toLocaleString()}</span>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        {assets.map(([ticker, contribution], index) => {
          const percentage = (contribution / totalVaR) * 100;
          const intensity = Math.min(percentage * 2, 100); 
          
          return (
            <motion.div
              key={ticker}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group flex-1 min-w-[120px]"
            >
              <div 
                className="relative h-[80px] bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden p-3 flex flex-col justify-between transition-all group-hover:border-[#00D9FF]/30 group-hover:bg-[#00D9FF]/[0.02]"
                style={{
                  transform: 'skewX(-10deg)',
                  boxShadow: '4px 4px 10px rgba(0,0,0,0.2)'
                }}
              >
                {/* Heat Overlay */}
                <div 
                  className="absolute inset-0 opacity-10 group-hover:opacity-25 transition-opacity"
                  style={{ 
                    background: `linear-gradient(135deg, hsla(0, 100%, 50%, ${intensity / 100}) 0%, transparent 80%)`
                  }}
                />
                
                <div className="relative z-10 flex justify-between items-center" style={{ transform: 'skewX(10deg)' }}>
                  <span className="text-[10px] font-bold text-white tracking-widest">{ticker}</span>
                  <div className={`w-1 h-1 rounded-full ${percentage > 30 ? 'bg-red-500 animate-pulse' : 'bg-[#00D9FF]'}`} />
                </div>

                <div className="relative z-10" style={{ transform: 'skewX(10deg)' }}>
                  <div className="text-[14px] font-mono text-white font-bold tracking-tighter">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* Vertical Connector Shadow */}
              <div className="h-4 w-px bg-white/10 mx-auto mt-2" />
            </motion.div>
          );
        })}
      </div>
      
      <div className="p-3 bg-[#0F1113] border border-white/5 rounded-md flex items-center gap-3">
        <div className="text-[#F5A623]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <p className="text-[9px] text-[#848D97] leading-relaxed italic">
          High-concentration clusters detected. Your tail risk is predominantly driven by volatility correlation in the {assets[0]?.[0]} sector.
        </p>
      </div>
    </div>
  );
};
