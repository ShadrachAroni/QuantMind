import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';

export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'student';

interface TierBadgeProps {
  tier: SubscriptionTier;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export function TierBadge({ tier, size = 'small', style }: TierBadgeProps) {
  const { theme } = useTheme();

  const TIER_COLORS = {
    free: {
      bg: theme.textSecondary + '10',
      text: theme.textSecondary,
      border: theme.textSecondary + '33',
    },
    plus: {
      bg: theme.primary + '15',
      text: theme.primary,
      border: theme.primary + '55',
    },
    pro: {
      bg: theme.secondary + '15',
      text: theme.secondary,
      border: theme.secondary + '55',
    },
    student: {
      bg: 'rgba(16, 185, 129, 0.1)',
      text: '#10B981',
      border: 'rgba(16, 185, 129, 0.3)',
    },
  };

  const colors = TIER_COLORS[tier] || TIER_COLORS.free;
  
  const sizeStyles = {
    small: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      fontSize: 10,
    },
    medium: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      fontSize: 12,
    },
    large: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      fontSize: 14,
    },
  };

  const currentSize = sizeStyles[size] as any;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
        style,
      ]}
    >
      <Typography
        variant="button"
        style={{
          color: colors.text,
          fontSize: currentSize.fontSize,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {tier}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
