import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Rect, Group } from '@shopify/react-native-skia';
import { theme } from '../../constants/theme';

interface CorrelationHeatmapProps {
  labels: string[];
  matrix: number[][]; // N x N correlation matrix
  size?: number;
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  labels,
  matrix,
  size = Dimensions.get('window').width - 40,
}) => {
  const n = labels.length;
  const cellSize = (size - 40) / n;

  const getColor = (val: number) => {
    // 1.0 -> Cyan, 0.0 -> Dark, -1.0 -> Purple
    if (val > 0) {
      return `rgba(0, 217, 255, ${val})`; // Cyan
    } else {
      return `rgba(124, 58, 237, ${Math.abs(val)})`; // Purple
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size + 40 }]}>
      <Text style={styles.title}>Correlation Matrix</Text>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Y-axis Labels */}
        <View style={{ width: 40, justifyContent: 'space-around', paddingVertical: cellSize / 2 }}>
          {labels.map((label, i) => (
            <Text key={i} style={styles.axisLabel}>{label}</Text>
          ))}
        </View>
        
        <Canvas style={{ flex: 1 }}>
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
      <View style={{ flexDirection: 'row', marginLeft: 40, height: 20 }}>
        {labels.map((label, i) => (
          <Text key={i} style={[styles.axisLabel, { width: cellSize, textAlign: 'center' }]}>{label}</Text>
        ))}
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
  title: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontFamily: theme.typography.fonts.mono,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  axisLabel: {
    color: theme.colors.textTertiary,
    fontSize: 9,
    fontFamily: theme.typography.fonts.mono,
  },
});
