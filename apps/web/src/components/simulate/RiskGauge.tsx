'use client';

import React from 'react';

interface RiskGaugeProps {
  var95: number;
  cvar99: number;
  initialValue: number;
}

export function RiskGauge({ var95, cvar99, initialValue }: RiskGaugeProps) {
  // Convert VaR/CVaR to percentage of initial value
  const varPct = (var95 / initialValue) * 100;
  const cvarPct = (cvar99 / initialValue) * 100;
  
  // Normalize for display (Max 50% loss for gauge scale)
  const maxLoss = 50;
  const varPos = Math.min((varPct / maxLoss) * 100, 100);
  const cvarPos = Math.min((cvarPct / maxLoss) * 100, 100);

  return (
    <div className="w-full space-y-6">
      <div className="relative h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
        {/* Background gradient (Low to High Risk) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#32D74B]/20 via-[#FFD60A]/20 to-[#FF453A]/20" />
        
        {/* VaR Indicator */}
        <div 
          className="absolute h-full bg-[#FFD60A] w-1 transition-all duration-1000"
          style={{ left: `${varPos}%` }}
        >
          <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#FFD60A] whitespace-nowrap uppercase tracking-widest">
            VaR_95
          </div>
        </div>

        {/* CVaR Indicator */}
        <div 
          className="absolute h-full bg-[#FF453A] w-1 transition-all duration-1000"
          style={{ left: `${cvarPos}%` }}
        >
          <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#FF453A] whitespace-nowrap uppercase tracking-widest">
            CVaR_99
          </div>
        </div>
      </div>

      <div className="flex justify-between text-[10px] font-mono text-[#848D97] uppercase tracking-widest">
        <span>Low_Risk</span>
        <span>Extreme_Tail_Risk</span>
      </div>
    </div>
  );
}
