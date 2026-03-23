import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '../ui/Typography';
import { theme } from '../../constants/theme';
import { Info } from 'lucide-react-native';

interface MetricProps {
  label: string;
  value: string | number;
  suffix?: string;
  helperText?: string;
  highlight?: 'positive' | 'negative' | 'neutral';
}

interface MetricsGridProps {
  metrics: MetricProps[];
  onInfoPress?: (metric: string) => void;
}

export function MetricsGrid({ metrics, onInfoPress }: MetricsGridProps) {
  const InfoIcon = Info as any;
  return (
    <View style={styles.container}>
      {metrics.map((metric, idx) => (
        <View key={metric.label} style={[styles.card, idx % 2 === 0 ? styles.cardLeft : styles.cardRight]}>
          <View style={styles.header}>
            <Typography variant="caption">{metric.label}</Typography>
            {onInfoPress && (
              <TouchableOpacity onPress={() => onInfoPress(metric.label)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <InfoIcon size={14} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.valueRow}>
            <Typography 
              variant="h3" 
              style={[
                styles.value,
                metric.highlight === 'positive' && { color: theme.colors.success },
                metric.highlight === 'negative' && { color: theme.colors.error },
              ]}
            >
              {metric.value}
            </Typography>
            {metric.suffix && (
              <Typography variant="caption" style={styles.suffix}>
                {metric.suffix}
              </Typography>
            )}
          </View>
          {metric.helperText && (
            <Typography variant="caption" style={styles.helper}>
              {metric.helperText}
            </Typography>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardLeft: {
    marginRight: theme.spacing.sm / 2,
  },
  cardRight: {
    marginLeft: theme.spacing.sm / 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontFamily: theme.typography.fonts.mono,
  },
  suffix: {
    marginLeft: 2,
    color: theme.colors.textTertiary,
  },
  helper: {
    marginTop: theme.spacing.xs,
    fontSize: 10,
    color: theme.colors.textTertiary,
  },
});
