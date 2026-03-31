import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { sharedTheme } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

interface TypographyProps extends TextProps {
  variant?: 'h0' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodyBold' | 'caption' | 'button' | 'mono' | 'monoBold' | 'label';
  color?: 'primary' | 'secondary' | 'error' | 'success' | 'white' | 'textPrimary' | 'textSecondary' | 'textTertiary' | 'warning' | 'accent';
}

const FALLBACK_FONTS = {
  bold: 'System',
  semiBold: 'System',
  medium: 'System',
  regular: 'System',
  mono: 'System',
  monoRegular: 'System',
};

const FALLBACK_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export function Typography({ variant = 'body', color, style, children, ...props }: TypographyProps) {
  const { theme } = useTheme();
  const { scaleFactor } = useResponsive();

  const getFontSize = (size: number) => Math.round(size * scaleFactor);

  const getColor = (colorName: string) => {
    if (!theme) return colorName;
    switch (colorName) {
      case 'primary': return theme.primary;
      case 'secondary': return theme.secondary;
      case 'textPrimary': return theme.textPrimary;
      case 'textSecondary': return theme.textSecondary;
      case 'textTertiary': return theme.textTertiary;
      case 'error': return theme.error;
      case 'success': return theme.success;
      case 'warning': return theme.warning;
      case 'accent': return theme.accent;
      case 'white': return '#FFFFFF';
      default: return colorName;
    }
  };

  const fonts = theme?.typography?.fonts || sharedTheme?.typography?.fonts || FALLBACK_FONTS;
  const sizes = theme?.typography?.sizes || sharedTheme?.typography?.sizes || FALLBACK_SIZES;

  const getFont = (weight: keyof typeof FALLBACK_FONTS) => {
    try {
      if (!fonts) return FALLBACK_FONTS[weight] || 'System';
      
      const fontName = fonts[weight];
      if (!fontName) {
        // High-visibility warning for the specific crash causing property
        if (weight === 'regular') {
          console.warn('🕵️ [TYPOGRAPHY_DEBUG] font "regular" is missing from current theme.');
        }
        return FALLBACK_FONTS[weight] || 'System';
      }
      return fontName;
    } catch (e) {
      return FALLBACK_FONTS[weight] || 'System';
    }
  };

  const dynamicStyles = StyleSheet.create({
    h0: {
      fontFamily: getFont('bold'),
      fontSize: getFontSize(sizes?.xxxl || 40),
      fontWeight: '700',
      color: theme?.textPrimary || theme?.colors?.textPrimary || '#FFFFFF',
      letterSpacing: -1,
    },
    h1: {
      fontFamily: getFont('bold'),
      fontSize: getFontSize(sizes?.xxl || 32),
      fontWeight: '700',
      color: theme?.textPrimary || theme?.colors?.textPrimary || '#FFFFFF',
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: getFont('bold'),
      fontSize: getFontSize(sizes?.xl || 24),
      fontWeight: '600',
      color: theme?.textPrimary || theme?.colors?.textPrimary || '#FFFFFF',
    },
    h3: {
      fontFamily: getFont('semiBold'),
      fontSize: getFontSize(sizes?.lg || 18),
      fontWeight: '600',
      color: theme?.textPrimary || theme?.colors?.textPrimary || '#FFFFFF',
    },
    h4: {
      fontFamily: getFont('semiBold'),
      fontSize: getFontSize(sizes?.md || 14),
      fontWeight: '600',
      color: theme?.textPrimary || theme?.colors?.textPrimary || '#FFFFFF',
    },
    body: {
      fontFamily: getFont('regular'),
      fontSize: getFontSize(sizes?.md || 14),
      color: theme?.textPrimary || theme?.colors?.textPrimary || '#FFFFFF',
      lineHeight: getFontSize(20),
    },
    bodyBold: {
      fontFamily: getFont('bold'),
      fontSize: getFontSize(sizes?.md || 14),
      fontWeight: '700',
      color: theme?.textPrimary || theme?.colors?.textPrimary || '#FFFFFF',
      lineHeight: getFontSize(20),
    },
    caption: {
      fontFamily: getFont('regular'),
      fontSize: getFontSize(sizes?.sm || 12),
      color: theme?.textSecondary || theme?.colors?.textSecondary || '#848D97',
    },
    button: {
      fontFamily: getFont('semiBold'),
      fontSize: getFontSize(sizes?.md || 14),
      fontWeight: '600',
      color: theme?.textPrimary || theme?.colors?.textPrimary || '#FFFFFF',
      textTransform: 'uppercase',
    },
    mono: {
      fontFamily: getFont('mono'),
      fontSize: getFontSize(sizes?.sm || 12),
      color: theme?.textPrimary || theme?.colors?.textPrimary || '#FFFFFF',
    },
    monoBold: {
      fontFamily: getFont('mono'),
      fontSize: getFontSize(sizes?.sm || 12),
      fontWeight: '700',
      color: theme?.textPrimary || theme?.colors?.textPrimary || '#FFFFFF',
    },
    label: {
      fontFamily: getFont('medium'),
      fontSize: getFontSize(sizes?.xs || 10),
      color: theme?.textSecondary || theme?.colors?.textSecondary || '#848D97',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  });

  const colorStyle = color ? { color: getColor(color) } : {};
  
  return (
    <Text style={[dynamicStyles[variant], colorStyle, style]} {...props}>
      {children}
    </Text>
  );
}
