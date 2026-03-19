// QuantMind Mobile Theme — FX1 Institutional Terminal Specification
// Primary colors, typography, and spacing consistent with the brand guide

export const theme = {
  colors: {
    primary: '#00D9FF', // Cyan
    secondary: '#7C3AED', // Purple
    background: '#05070A', // Deep Obsidian
    surface: '#0E1117', // Dark Gray
    surfaceLight: '#161B22', // Medium Gray
    border: '#30363D',
    borderSubtle: '#21262D',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FFD60A',
    textPrimary: '#FFFFFF',
    textSecondary: '#8B949E',
    textTertiary: '#484F58',
    text: {
      primary: '#FFFFFF',
      secondary: '#8B949E',
      muted: '#484F58',
      accent: '#00D9FF',
    },
    chart: {
      cyan: '#00D9FF',
      purple: '#7C3AED',
      grid: '#21262D',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    fonts: {
      bold: 'Outfit-Bold',
      semiBold: 'Outfit-SemiBold',
      medium: 'Inter-Medium',
      regular: 'Inter-Regular',
      mono: 'Roboto-Mono',
    },
    sizes: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    families: {
      heading: 'Outfit-Bold',
      body: 'Inter-Regular',
      mono: 'Roboto-Mono',
    }
  },
  roundness: {
    sm: 4,
    md: 8,
    lg: 12,
  }
};
