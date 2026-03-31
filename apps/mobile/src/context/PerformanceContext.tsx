import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useHardwareTier, HardwareTier } from '../hooks/useHardwareTier';

interface PerformanceSettings {
  tier: HardwareTier;
  isLowEnd: boolean;
  enableGlows: boolean;
  enableComplexAnimations: boolean;
  particleCount: number;
  lowPowerMode: boolean;
}

const PerformanceContext = createContext<PerformanceSettings | undefined>(undefined);

export const PerformanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const hardware = useHardwareTier();
  const [lowPowerMode, setLowPowerMode] = useState(false);

  const getSettings = (): PerformanceSettings => {
    const isLow = hardware.tier === 'low' || lowPowerMode;
    const isMid = hardware.tier === 'medium';
    
    return {
      tier: hardware.tier,
      isLowEnd: isLow,
      enableGlows: !isLow,
      enableComplexAnimations: !isLow,
      particleCount: isLow ? 20 : isMid ? 50 : 100,
      lowPowerMode,
    };
  };

  return (
    <PerformanceContext.Provider value={getSettings()}>
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};
