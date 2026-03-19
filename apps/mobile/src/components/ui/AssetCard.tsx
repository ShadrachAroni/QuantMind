import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../../constants/theme';
import { Trash2 } from 'lucide-react-native';

interface AssetCardProps {
  ticker: string;
  name: string;
  weight: number; // 0-1
  amountValue?: number;
  onRemove?: () => void;
  onPress?: () => void;
}

export function AssetCard({ ticker, name, weight, amountValue, onRemove, onPress }: AssetCardProps) {
  const CardContainer = onPress ? TouchableOpacity : View;
  const TrashIcon = Trash2 as any;

  return (
    <CardContainer style={styles.container} onPress={onPress}>
      <View style={styles.left}>
        <View style={styles.tickerBadge}>
          <Typography variant="caption" style={styles.tickerText}>{ticker}</Typography>
        </View>
        <View style={styles.nameContainer}>
          <Typography variant="body" numberOfLines={1} style={styles.name}>{name}</Typography>
          {amountValue !== undefined && (
            <Typography variant="caption" style={styles.amount}>
              ${amountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          )}
        </View>
      </View>
      
      <View style={styles.right}>
        <View style={styles.weightContainer}>
          <Typography variant="body" style={styles.weightText}>
            {(weight * 100).toFixed(1)}%
          </Typography>
          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${weight * 100}%` }]} />
          </View>
        </View>
        
        {onRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <TrashIcon size={18} color={theme.colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  tickerBadge: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
    minWidth: 55,
    alignItems: 'center',
  },
  tickerText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fonts.mono,
    fontWeight: '700',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    color: theme.colors.textPrimary,
  },
  amount: {
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightContainer: {
    alignItems: 'flex-end',
    width: 60,
  },
  weightText: {
    fontFamily: theme.typography.fonts.mono,
    fontSize: 14,
    marginBottom: 4,
  },
  barBackground: {
    height: 4,
    width: '100%',
    backgroundColor: theme.colors.border,
    borderRadius: 2,
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  removeBtn: {
    marginLeft: theme.spacing.md,
    padding: theme.spacing.xs,
  },
});
