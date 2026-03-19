import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../../constants/theme';

export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'student';

interface TierBadgeProps {
  tier: SubscriptionTier;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const TIER_COLORS = {
  free: {
    bg: 'rgba(148, 163, 184, 0.1)',
    text: theme.colors.textSecondary,
    border: 'rgba(148, 163, 184, 0.2)',
  },
  plus: {
    bg: 'rgba(0, 217, 255, 0.1)',
    text: theme.colors.primary,
    border: 'rgba(0, 217, 255, 0.3)',
  },
  pro: {
    bg: 'rgba(124, 58, 237, 0.1)',
    text: theme.colors.secondary,
    border: 'rgba(124, 58, 237, 0.3)',
  },
  student: {
    bg: 'rgba(16, 185, 129, 0.1)',
    text: '#10B981',
    border: 'rgba(16, 185, 129, 0.3)',
  },
};

export function TierBadge({ tier, size = 'small', style }: TierBadgeProps) {
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

  const currentSize = sizeStyles[size];

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
