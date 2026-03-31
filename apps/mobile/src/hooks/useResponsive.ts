import { useWindowDimensions, Platform } from 'react-native';
import * as Device from 'expo-device';
import { useMemo } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Orientation = 'portrait' | 'landscape';

export interface ResponsiveConfig {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
  orientation: Orientation;
  isTablet: boolean;
  isPhone: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  scaleFactor: number; // For responsive typography/spacing
  isSmallDevice: boolean;
}

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export function useResponsive(): ResponsiveConfig {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isLandscape = width > height;
    const isPortrait = !isLandscape;
    
    // Determine device type
    const isTablet = Device.deviceType === Device.DeviceType.TABLET;
    const isDesktop = Platform.OS === 'web' && width >= BREAKPOINTS.lg;
    const isPhone = !isTablet && !isDesktop;

    // Determine breakpoint
    let breakpoint: Breakpoint = 'xs';
    if (width >= BREAKPOINTS.xl) breakpoint = 'xl';
    else if (width >= BREAKPOINTS.lg) breakpoint = 'lg';
    else if (width >= BREAKPOINTS.md) breakpoint = 'md';
    else if (width >= BREAKPOINTS.sm) breakpoint = 'sm';

    // Scaling factor (base is a typical 375px wide phone)
    const baseWidth = 375;
    const scaleFactor = Math.min(Math.max(width / baseWidth, 0.8), 2.0);

    return {
      width,
      height,
      isLandscape,
      isPortrait,
      orientation: isLandscape ? 'landscape' : 'portrait',
      isTablet,
      isPhone,
      isDesktop,
      breakpoint,
      scaleFactor,
      isSmallDevice: width < 380,
    };
  }, [width, height]);
}
