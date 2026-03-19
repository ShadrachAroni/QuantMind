import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'button';
}

export function Typography({ variant = 'body', style, children, ...props }: TypographyProps) {
  return (
    <Text style={[styles[variant], style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.xxl,
    lineHeight: 40,
    color: theme.colors.textPrimary,
  },
  h2: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.xl,
    lineHeight: 32,
    color: theme.colors.textPrimary,
  },
  h3: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.lg,
    lineHeight: 28,
    color: theme.colors.textPrimary,
  },
  body: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.md,
    lineHeight: 24,
    color: theme.colors.textSecondary,
  },
  caption: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.sm,
    lineHeight: 20,
    color: theme.colors.textTertiary,
  },
  button: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
  },
});
