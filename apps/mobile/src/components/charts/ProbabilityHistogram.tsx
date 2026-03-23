import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Path, Group, Text as SkiaText, useFont, vec } from '@shopify/react-native-skia';
import { theme } from '../../constants/theme';

interface ProbabilityHistogramProps {
  data: number[]; // Terminal values
  bins?: number;
  width?: number;
  height?: number;
}

export const ProbabilityHistogram: React.FC<ProbabilityHistogramProps> = ({
  data,
  bins = 30,
  width = Dimensions.get('window').width - 40,
  height = 200,
}) => {
  const chartData = useMemo(() => {
    if (!data.length) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const binSize = range / bins;
    
    const counts = new Array(bins).fill(0);
    data.forEach(val => {
      const binIndex = Math.min(Math.floor((val - min) / binSize), bins - 1);
      counts[binIndex]++;
    });

    const maxCount = Math.max(...counts);
    return counts.map((count, i) => ({
      x: (i / bins) * width,
      y: height - (count / maxCount) * (height - 20),
      w: width / bins - 2,
      h: (count / maxCount) * (height - 20),
    }));
  }, [data, bins, width, height]);

  if (!data.length) return null;

  return (
    <View style={[styles.container, { width, height }]}>
      <Text style={styles.title}>Probability Distribution</Text>
      <Canvas style={{ flex: 1 }}>
        <Group>
          {chartData.map((bin, i) => (
            <Path
              key={i}
              path={`M ${bin.x} ${height} L ${bin.x} ${bin.y} L ${bin.x + bin.w} ${bin.y} L ${bin.x + bin.w} ${height} Z`}
              color={theme.colors.primary}
              opacity={0.7}
            />
          ))}
        </Group>
      </Canvas>
      <View style={styles.footer}>
        <Text style={styles.label}>Loss</Text>
        <Text style={styles.label}>Median</Text>
        <Text style={styles.label}>Gain</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  title: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontFamily: theme.typography.fonts.mono,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  label: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    fontFamily: theme.typography.fonts.mono,
  },
});
