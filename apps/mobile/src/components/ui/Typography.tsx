import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { sharedTheme } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface TypographyProps extends TextProps {
  variant?: 'h0' | 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'button' | 'mono' | 'monoBold';
  color?: 'primary' | 'secondary' | 'error' | 'success' | 'white' | 'textPrimary' | 'textSecondary' | 'textTertiary';
}

export function Typography({ variant = 'body', color, style, children, ...props }: TypographyProps) {
  const { theme } = useTheme();

  const getColor = (c: string) => {
    switch (c) {
      case 'primary': return theme.primary;
      case 'secondary': return theme.secondary;
      case 'error': return theme.error;
      case 'success': return theme.success;
      case 'white': return '#FFFFFF';
      case 'textPrimary': return theme.textPrimary;
      case 'textSecondary': return theme.textSecondary;
      case 'textTertiary': return theme.textTertiary;
      default: return undefined;
    }
  };

  const dynamicStyles = StyleSheet.create({
    h0: {
      fontFamily: sharedTheme.typography.fonts.bold,
      fontSize: sharedTheme.typography.sizes.xxxl,
      lineHeight: 48,
      color: theme.textPrimary,
      letterSpacing: -1,
    },
    h1: {
      fontFamily: sharedTheme.typography.fonts.bold,
      fontSize: sharedTheme.typography.sizes.xxl,
      lineHeight: 40,
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: sharedTheme.typography.fonts.semiBold,
      fontSize: sharedTheme.typography.sizes.xl,
      lineHeight: 32,
      color: theme.textPrimary,
    },
    h3: {
      fontFamily: sharedTheme.typography.fonts.medium,
      fontSize: sharedTheme.typography.sizes.lg,
      lineHeight: 28,
      color: theme.textPrimary,
    },
    body: {
      fontFamily: sharedTheme.typography.fonts.regular,
      fontSize: sharedTheme.typography.sizes.md,
      lineHeight: 24,
      color: theme.textSecondary,
    },
    caption: {
      fontFamily: sharedTheme.typography.fonts.regular,
      fontSize: sharedTheme.typography.sizes.sm,
      lineHeight: 20,
      color: theme.textTertiary,
    },
    button: {
      fontFamily: sharedTheme.typography.fonts.semiBold,
      fontSize: sharedTheme.typography.sizes.md,
      color: theme.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    mono: {
      fontFamily: sharedTheme.typography.fonts.monoRegular,
      fontSize: sharedTheme.typography.sizes.sm,
      lineHeight: 18,
      color: theme.primary,
    },
    monoBold: {
      fontFamily: sharedTheme.typography.fonts.mono,
      fontSize: sharedTheme.typography.sizes.md,
      lineHeight: 22,
      color: theme.primary,
    },
  });

  const colorStyle = color ? { color: getColor(color) } : {};
  
  return (
    <Text style={[dynamicStyles[variant], colorStyle, style]} {...props}>
      {children}
    </Text>
  );
}
