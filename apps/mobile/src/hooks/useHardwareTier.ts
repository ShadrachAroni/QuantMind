import * as Device from 'expo-device';
import { useState, useEffect } from 'react';

export type HardwareTier = 'low' | 'medium' | 'high';

export interface HardwareInfo {
  tier: HardwareTier;
  isLowEnd: boolean;
  totalRAM: number | null;
  deviceName: string | null;
}

// Memory thresholds (in GB)
const LOW_TIER_RAM = 3 * 1024 * 1024 * 1024; // 3GB
const HIGH_TIER_RAM = 6 * 1024 * 1024 * 1024; // 6GB

export function useHardwareTier(): HardwareInfo {
  const [info, setInfo] = useState<HardwareInfo>({
    tier: 'medium', // Default to medium
    isLowEnd: false,
    totalRAM: null,
    deviceName: Device.modelName,
  });

  useEffect(() => {
    async function detectHardware() {
      const totalMemory = await Device.totalMemory;
      
      let tier: HardwareTier = 'medium';
      if (totalMemory && totalMemory < LOW_TIER_RAM) {
        tier = 'low';
      } else if (totalMemory && totalMemory >= HIGH_TIER_RAM) {
        tier = 'high';
      }

      // Special cases for older high-end devices or specific platform behaviors
      const modelName = Device.modelName || '';
      const isOldIPhone = modelName.includes('iPhone') && 
        (modelName.includes('8') || modelName.includes('7') || modelName.includes('6') || modelName.includes('SE'));

      if (isOldIPhone && tier === 'medium') {
        tier = 'low'; // Downgrade older iPhones
      }

      setInfo({
        tier,
        isLowEnd: tier === 'low',
        totalRAM: totalMemory,
        deviceName: Device.modelName,
      });
    }

    detectHardware();
  }, []);

  return info;
}
