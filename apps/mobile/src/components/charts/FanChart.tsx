import React, { useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText, G } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { Typography } from '../ui/Typography';

export interface PercentilePaths {
  p5: number[];
  p10: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p90: number[];
  p95: number[];
}

interface FanChartProps {
  data: PercentilePaths;
  width?: number;
  height?: number;
  initialValue: number;
}

export function FanChart({ data, width = 300, height = 200, initialValue }: FanChartProps) {
  const [containerWidth, setContainerWidth] = React.useState(width);
  const padding = { top: 20, right: 10, bottom: 20, left: 50 };
  const graphWidth = containerWidth - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const { paths, yAxisDomain, yTicks, xTicks } = useMemo(() => {
    if (!data.p5 || data.p5.length === 0) return { paths: null, yAxisDomain: [0, 100], yTicks: [], xTicks: [] };

    const steps = data.p5.length;
    
    // Find absolute min/max across all percentiles
    const minY = Math.min(...data.p5) * 0.95;
    const maxY = Math.max(...data.p95) * 1.05;

    const scaleX = (index: number) => padding.left + (index / (steps - 1)) * graphWidth;
    const scaleY = (val: number) => padding.top + graphHeight - ((val - minY) / (maxY - minY)) * graphHeight;

    // Helper to generate a filled polygon between two path arrays
    const createAreaPath = (lower: number[], upper: number[]) => {
      let d = `M ${scaleX(0)},${scaleY(lower[0])}`;
      for (let i = 1; i < steps; i++) {
        d += ` L ${scaleX(i)},${scaleY(lower[i])}`;
      }
      for (let i = steps - 1; i >= 0; i--) {
        d += ` L ${scaleX(i)},${scaleY(upper[i])}`;
      }
      d += ' Z';
      return d;
    };

    // Helper to generate a stroke line
    const createLinePath = (line: number[]) => {
      let d = `M ${scaleX(0)},${scaleY(line[0])}`;
      for (let i = 1; i < steps; i++) {
        d += ` L ${scaleX(i)},${scaleY(line[i])}`;
      }
      return d;
    };

    const bands = [
      { path: createAreaPath(data.p5, data.p95), fill: 'url(#grad90)' },
      { path: createAreaPath(data.p10, data.p90), fill: 'url(#grad80)' },
      { path: createAreaPath(data.p25, data.p75), fill: 'url(#grad50)' },
    ];
    
    const median = createLinePath(data.p50);
    const initialLineY = scaleY(initialValue);

    // Y-Axis Ticks
    const formatCurrency = (val: number) => 
      val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : 
      val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : 
      `$${val.toFixed(0)}`;

    const stepY = (maxY - minY) / 4;
    const yTicks = [
      { y: scaleY(minY), label: formatCurrency(minY) },
      { y: scaleY(minY + stepY), label: formatCurrency(minY + stepY) },
      { y: scaleY(minY + stepY * 2), label: formatCurrency(minY + stepY * 2) },
      { y: scaleY(minY + stepY * 3), label: formatCurrency(minY + stepY * 3) },
      { y: scaleY(maxY), label: formatCurrency(maxY) },
    ];

    return { 
      paths: { bands, median, initialLineY }, 
      yAxisDomain: [minY, maxY],
      yTicks,
      xTicks: [0, 0.25, 0.5, 0.75, 1].map(pct => padding.left + pct * graphWidth)
    };
  }, [data, graphWidth, graphHeight]);

  if (!paths) {
    return (
      <View style={[styles.container, { height, width: '100%' }]} onLayout={onLayout}>
        <Typography variant="body" style={styles.noData}>No simulation data available</Typography>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height, width: '100%' }]} onLayout={onLayout}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="grad90" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0.1" />
            <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0.05" />
          </LinearGradient>
          <LinearGradient id="grad80" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0.2" />
            <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0.1" />
          </LinearGradient>
          <LinearGradient id="grad50" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0.4" />
            <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0.2" />
          </LinearGradient>
        </Defs>

        {/* Grid Lines */}
        {yTicks.map((tick, i) => (
          <G key={`y-${i}`}>
            <Line
              x1={padding.left}
              y1={tick.y}
              x2={padding.left + graphWidth}
              y2={tick.y}
              stroke={theme.colors.border}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <SvgText
              x={padding.left - 5}
              y={tick.y + 4}
              fontSize="10"
              fill={theme.colors.textTertiary}
              textAnchor="end"
              fontFamily={theme.typography.fonts.mono}
            >
              {tick.label}
            </SvgText>
          </G>
        ))}

        {/* Initial Value Baseline */}
        <Line
          x1={padding.left}
          y1={paths.initialLineY}
          x2={padding.left + graphWidth}
          y2={paths.initialLineY}
          stroke={theme.colors.textSecondary}
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Confidence Bands */}
        {paths.bands.map((band, i) => (
          <Path key={`band-${i}`} d={band.path} fill={band.fill} />
        ))}

        {/* Median Line */}
        <Path d={paths.median} fill="none" stroke={theme.colors.primary} strokeWidth="2" />
        
        {/* X-Axis labels (T=0 to T=End) */}
        <SvgText
          x={padding.left}
          y={height - 5}
          fontSize="10"
          fill={theme.colors.textTertiary}
          textAnchor="start"
        >
          Today
        </SvgText>
        <SvgText
          x={padding.left + graphWidth}
          y={height - 5}
          fontSize="10"
          fill={theme.colors.textTertiary}
          textAnchor="end"
        >
          End
        </SvgText>

      </Svg>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
          <Typography variant="caption" style={styles.legendText}>Median Expected</Typography>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'rgba(0, 217, 255, 0.4)' }]} />
          <Typography variant="caption" style={styles.legendText}>50% Confidence</Typography>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'rgba(0, 217, 255, 0.1)' }]} />
          <Typography variant="caption" style={styles.legendText}>90% Confidence</Typography>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    position: 'relative',
    paddingBottom: 25,
  },
  noData: {
    textAlign: 'center',
    marginTop: 80,
  },
  legend: {
    position: 'absolute',
    bottom: 5,
    left: 50,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 9,
    fontFamily: theme.typography.fonts.mono,
  },
});
