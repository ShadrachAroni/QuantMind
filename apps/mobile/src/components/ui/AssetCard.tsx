import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../../constants/theme';
import { Trash2, ArrowRight } from 'lucide-react-native';
import { GlassCard } from './GlassCard';

interface AssetCardProps {
  ticker: string;
  name: string;
  weight: number; // 0-1
  amountValue?: number;
  onRemove?: () => void;
  onPress?: () => void;
}

export function AssetCard({ ticker, name, weight, amountValue, onRemove, onPress }: AssetCardProps) {
  const CardContainer: any = onPress ? TouchableOpacity : View;
  const TrashIcon = Trash2 as any;
  const ArrowIcon = ArrowRight as any;

  return (
    <CardContainer style={styles.wrapper} onPress={onPress} activeOpacity={0.7}>
      <GlassCard intensity="low" style={styles.container}>
        <View style={styles.left}>
          <View style={styles.tickerBox}>
            <Typography variant="mono" style={styles.tickerText}>{ticker}</Typography>
          </View>
          <View style={styles.nameContainer}>
            <Typography variant="body" numberOfLines={1} style={styles.name}>{name.toUpperCase()}</Typography>
            {amountValue !== undefined && (
              <Typography variant="caption" style={styles.amount}>
                ${amountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            )}
          </View>
        </View>
        
        <View style={styles.right}>
          <View style={styles.weightSection}>
            <Typography variant="mono" style={styles.weightText}>
              {(weight * 100).toFixed(1)}%
            </Typography>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${weight * 100}%` }]} />
            </View>
          </View>
          
          {onRemove ? (
            <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <TrashIcon size={16} color={theme.colors.error} />
            </TouchableOpacity>
          ) : onPress ? (
            <ArrowIcon size={16} color={theme.colors.textTertiary} style={{ marginLeft: 8 }} />
          ) : null}
        </View>
      </GlassCard>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  tickerBox: {
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    marginRight: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  tickerText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    color: '#E2E8F0',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  amount: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    marginTop: 2,
    fontFamily: theme.typography.fonts.mono,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightSection: {
    alignItems: 'flex-end',
    width: 70,
  },
  weightText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginBottom: 6,
  },
  barTrack: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  removeBtn: {
    marginLeft: 12,
    padding: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
});
