import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { sharedTheme } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export function GlassCard({ children, style, accentColor, intensity = 'medium' }: GlassCardProps) {
  const { theme, isDark } = useTheme();

  const getBackgroundColor = () => {
    if (!isDark) {
      switch (intensity) {
        case 'low': return 'rgba(255, 255, 255, 0.3)';
        case 'high': return 'rgba(255, 255, 255, 0.95)';
        default: return 'rgba(255, 255, 255, 0.8)';
      }
    }
    switch (intensity) {
      case 'low': return 'rgba(17, 18, 30, 0.4)';
      case 'high': return 'rgba(17, 18, 30, 0.9)';
      default: return theme.surfaceLight;
    }
  };

  const borderStyle = {
    borderColor: accentColor || theme.border,
    borderWidth: 1,
  };

  return (
    <View style={[
      styles.card, 
      { backgroundColor: getBackgroundColor() },
      borderStyle,
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: sharedTheme.radius.xl,
    padding: sharedTheme.spacing.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
});
