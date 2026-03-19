import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../../constants/theme';

interface PasswordStrengthMeterProps {
  score: number; // 0 to 4 (zxcvbn score)
  feedback?: string;
}

export function PasswordStrengthMeter({ score, feedback }: PasswordStrengthMeterProps) {
  const getScoreDetails = () => {
    switch (score) {
      case 0: return { label: 'Very Weak', color: theme.colors.error, blocks: 1 };
      case 1: return { label: 'Weak', color: theme.colors.error, blocks: 1 };
      case 2: return { label: 'Fair', color: theme.colors.warning, blocks: 2 };
      case 3: return { label: 'Strong', color: theme.colors.success, blocks: 3 };
      case 4: return { label: 'Very Strong', color: theme.colors.primary, blocks: 4 };
      default: return { label: '', color: theme.colors.border, blocks: 0 };
    }
  };

  const { label, color, blocks } = getScoreDetails();

  return (
    <View style={styles.container}>
      <View style={styles.blocksContainer}>
        {[1, 2, 3, 4].map((index) => (
          <View
            key={`block-${index}`}
            style={[
              styles.block,
              { backgroundColor: index <= blocks ? color : theme.colors.border },
            ]}
          />
        ))}
      </View>
      <View style={styles.textContainer}>
        <Typography variant="caption" style={[styles.label, { color }]}>
          {label}
        </Typography>
        {feedback && (
          <Typography variant="caption" style={styles.feedback}>
            {feedback}
          </Typography>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
  },
  blocksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: theme.spacing.xs,
  },
  block: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
  },
  feedback: {
    color: theme.colors.textSecondary,
    flex: 1,
    textAlign: 'right',
    marginLeft: theme.spacing.md,
  },
});
