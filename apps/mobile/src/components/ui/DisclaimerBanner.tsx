import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../../constants/theme';
import { AlertTriangle } from 'lucide-react-native';

interface DisclaimerBannerProps {
  style?: any;
}

export function DisclaimerBanner({ style }: DisclaimerBannerProps) {
  const AlertIcon = AlertTriangle as any;
  return (
    <View style={[styles.container, style]}>
      <AlertIcon color={theme.colors.warning} size={16} />
      <View style={styles.textContainer}>
        <Typography variant="caption" style={styles.text}>
          <Typography variant="caption" style={styles.bold}>Educational use only. </Typography>
          This is not financial advice. Simulations do not guarantee future outcomes.
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  textContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  text: {
    color: theme.colors.warning,
    lineHeight: 18,
  },
  bold: {
    color: theme.colors.warning,
    fontWeight: '600',
  },
});
