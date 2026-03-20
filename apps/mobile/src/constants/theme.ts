// QuantMind Mobile Theme Specification - Multi-Theme Support

export type ThemeType = 'dark' | 'light' | 'binance' | 'terminal';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceLight: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  error: string;
  success: string;
  warning: string;
  accent: string;
  glow: string;
}

export const DARK_THEME: ThemeColors = {
  primary: '#00D4FF',
  secondary: '#7B5FFF',
  background: '#080810',
  surface: '#0D0D1A',
  surfaceLight: 'rgba(17, 18, 30, 0.72)',
  border: 'rgba(0, 212, 255, 0.12)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textTertiary: '#475569',
  error: '#FF453A',
  success: '#00D4FF',
  warning: '#C49010',
  accent: '#00D4FF',
  glow: 'rgba(0, 212, 255, 0.4)',
};

export const LIGHT_THEME: ThemeColors = {
  primary: '#00A3C4',
  secondary: '#6366F1',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: 'rgba(255, 255, 255, 0.8)',
  border: 'rgba(0, 163, 196, 0.1)',
  borderSubtle: 'rgba(0, 0, 0, 0.05)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  error: '#DC2626',
  success: '#059669',
  warning: '#D97706',
  accent: '#00A3C4',
  glow: 'rgba(0, 163, 196, 0.2)',
};

export const BINANCE_THEME: ThemeColors = {
  primary: '#F0B90B',
  secondary: '#2DBD85',
  background: '#121212',
  surface: '#1E2329',
  surfaceLight: 'rgba(30, 35, 41, 0.85)',
  border: 'rgba(240, 185, 11, 0.15)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  textPrimary: '#EAECEF',
  textSecondary: '#929AA5',
  textTertiary: '#5E6673',
  error: '#CF304A',
  success: '#2DBD85',
  warning: '#F0B90B',
  accent: '#F0B90B',
  glow: 'rgba(240, 185, 11, 0.3)',
};

export const TERMINAL_THEME: ThemeColors = {
  primary: '#00FF41',
  secondary: '#003B00',
  background: '#0D0208',
  surface: '#001100',
  surfaceLight: 'rgba(0, 59, 0, 0.2)',
  border: 'rgba(0, 255, 65, 0.2)',
  borderSubtle: 'rgba(0, 255, 65, 0.05)',
  textPrimary: '#00FF41',
  textSecondary: '#008F11',
  textTertiary: '#003B00',
  error: '#FF0000',
  success: '#00FF41',
  warning: '#FFB000',
  accent: '#00FF41',
  glow: 'rgba(0, 255, 65, 0.4)',
};

export const THEMES: Record<ThemeType, ThemeColors> = {
  dark: DARK_THEME,
  light: LIGHT_THEME,
  binance: BINANCE_THEME,
  terminal: TERMINAL_THEME,
};

export const sharedTheme = {
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
    '2xl': 20,
    full: 9999,
  },
  typography: {
    fonts: {
      bold: 'Outfit-Bold',
      semiBold: 'Outfit-SemiBold',
      medium: 'Inter-Medium',
      regular: 'Inter-Regular',
      mono: 'JetBrainsMono-Bold',
      monoRegular: 'JetBrainsMono-Regular',
    },
    sizes: {
      xxs: 9,
      xs: 10,
      sm: 12,
      md: 14,
      lg: 18,
      xl: 24,
      xxl: 32,
      xxxl: 40,
    }
  },
};

export const theme = {
  ...sharedTheme,
  colors: DARK_THEME, // Default
};
