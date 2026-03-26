import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Rect, Group } from '@shopify/react-native-skia';
import { Info, TrendingUp, TrendingDown, Layers, Lock } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { TIER_ENTITLEMENTS, SubscriptionTier } from '@quantmind/shared-types';
import { theme } from '../../constants/theme';
import { Typography } from '../ui/Typography';

interface CorrelationHeatmapProps {
  labels: string[];
  symbols?: string[]; // New: if provided, will fetch and compute
  matrix?: number[][]; 
  size?: number;
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  labels: initialLabels,
  symbols,
  matrix: initialMatrix,
  size = Dimensions.get('window').width - 40,
}) => {
  const { tier } = useAuthStore();
  const [data, setData] = React.useState<Record<string, number[]>>({});
  const [loading, setLoading] = React.useState(!!symbols);
  const labels = symbols || initialLabels;
  
  const userTier = (tier || 'free') as SubscriptionTier;
  const isAllowed = TIER_ENTITLEMENTS[userTier]?.allow_correlation_matrix;

  React.useEffect(() => {
    if (!symbols || symbols.length === 0 || !isAllowed) {
      setLoading(false);
      return;
    }

    async function fetchHistory() {
      setLoading(true);
      try {
        const { data: history, error } = await supabase
          .from('asset_history')
          .select('symbol, price, timestamp')
          .in('symbol', symbols as string[])
          .order('timestamp', { ascending: true });

        if (error) throw error;

        const pricesBySymbol: Record<string, number[]> = {};
        history?.forEach((item: any) => {
          if (!pricesBySymbol[item.symbol]) pricesBySymbol[item.symbol] = [];
          pricesBySymbol[item.symbol].push(item.price);
        });

        const grouped: Record<string, number[]> = {};
        Object.keys(pricesBySymbol).forEach(symbol => {
          const prices = pricesBySymbol[symbol];
          const returns: number[] = [];
          for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
          }
          grouped[symbol] = returns;
        });

        setData(grouped);
      } catch (err) {
        console.error('CORRELATION_FETCH_ERROR:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [symbols ? symbols.join(',') : '', isAllowed]);

  const matrix = React.useMemo(() => {
    if (initialMatrix) return initialMatrix;
    
    const result: number[][] = [];
    labels.forEach((s1, i) => {
      result[i] = [];
      labels.forEach((s2, j) => {
        if (s1 === s2) {
          result[i][j] = 1;
        } else {
          result[i][j] = calculateCorrelation(data[s1] || [], data[s2] || []);
        }
      });
    });
    return result;
  }, [data, labels, initialMatrix]);

  function calculateCorrelation(x: number[], y: number[]) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;
    const muX = x.reduce((a, b) => a + b, 0) / n;
    const muY = y.reduce((a, b) => a + b, 0) / n;
    let numerator = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - muX, dy = y[i] - muY;
      numerator += dx * dy;
      sumX2 += dx * dx;
      sumY2 += dy * dy;
    }
    const denominator = Math.sqrt(sumX2 * sumY2);
    return denominator === 0 ? 0 : numerator / denominator;
  }
  const n = labels.length;
  const cellSize = (size - 40) / n;

  const getColor = (val: number) => {
    // Web-parity Institutional colors: Green (Positive), Red (Negative), Neutral (Gray)
    if (val > 0.7) return '#32D74B'; // Strong Positive
    if (val > 0.3) return 'rgba(50, 215, 75, 0.6)'; // Weak Positive
    if (val > -0.3) return 'rgba(255, 255, 255, 0.05)'; // Neutral
    if (val > -0.7) return 'rgba(255, 69, 58, 0.6)'; // Weak Negative
    return '#FF453A'; // Strong Negative
  };

  if (loading) {
    return (
      <View style={[styles.container, { width: size, height: 200, justifyContent: 'center', alignItems: 'center' }]}>
        <Typography variant="mono" style={{ color: theme.colors.primary, fontSize: 10 }}>COMPUTING_CORRELATION...</Typography>
      </View>
    );
  }

  if (!isAllowed) {
    return (
      <View style={[styles.container, { width: size, height: 200, justifyContent: 'center', alignItems: 'center' }]}>
        <Lock size={24} color={theme.colors.textTertiary} />
        <Typography variant="mono" style={{ color: theme.colors.textSecondary, marginTop: 12, fontSize: 10 }}>UPGRADE_REQUIRED</Typography>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size }]}>
      <View style={styles.headerRow}>
        <Layers size={16} color={theme.colors.primary} />
        <Text style={styles.title}>Diversification Matrix</Text>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {/* Y-axis Labels */}
        <View style={{ width: 40, justifyContent: 'space-around', paddingVertical: cellSize / 2 }}>
          {labels.map((label, i) => (
            <Text key={i} style={styles.axisLabel}>{label}</Text>
          ))}
        </View>
        
        <Canvas style={{ width: size - 60, height: size - 60 }}>
          <Group>
            {matrix.map((row, i) => (
              row.map((val, j) => (
                <Rect
                    key={`${i}-${j}`}
                    x={j * cellSize}
                    y={i * cellSize}
                    width={cellSize - 1}
                    height={cellSize - 1}
                    color={getColor(val)}
                />
              ))
            ))}
          </Group>
        </Canvas>
      </View>

      {/* X-axis Labels */}
      <View style={{ flexDirection: 'row', marginLeft: 40, height: 20, marginTop: 4 }}>
        {labels.map((label, i) => (
          <Text key={i} style={[styles.axisLabel, { width: cellSize, textAlign: 'center' }]}>{label}</Text>
        ))}
      </View>

      <View style={styles.insightBox}>
          <Info size={14} color={theme.colors.primary} />
          <Text style={styles.insightText}>
            Institutional Insight: Low correlation (neutral) indicates superior diversification.
          </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontFamily: theme.typography.fonts.mono,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  axisLabel: {
    color: theme.colors.textTertiary,
    fontSize: 8,
    fontFamily: theme.typography.fonts.mono,
  },
  insightBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 217, 255, 0.05)',
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  insightText: {
    color: theme.colors.primary,
    fontSize: 9,
    fontFamily: theme.typography.fonts.mono,
    flex: 1,
    lineHeight: 12,
  }
});
