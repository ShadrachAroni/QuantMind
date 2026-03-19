import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Path, Skia, Group, LinearGradient, vec } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { theme } from '../../constants/theme';

interface RiskTemperatureGaugeProps {
  value: number; // 0 to 1
  size?: number;
}

export const RiskTemperatureGauge: React.FC<RiskTemperatureGaugeProps> = ({
  value,
  size = 180,
}) => {
  const animatedValue = useSharedValue(0);
  const radius = size / 2 - 10;
  const strokeWidth = 15;
  const center = { x: size / 2, y: size / 2 };

  useEffect(() => {
    animatedValue.value = withSpring(value);
  }, [value]);

  const path = useDerivedValue(() => {
    const startAngle = Math.PI * 0.8; // 144 degrees
    const endAngle = Math.PI * 2.2;   // 396 degrees
    const totalAngle = endAngle - startAngle;
    const currentAngle = startAngle + totalAngle * animatedValue.value;

    const skPath = Skia.Path.Make();
    skPath.addArc(
      Skia.XYWHRect(center.x - radius, center.y - radius, radius * 2, radius * 2),
      (startAngle * 180) / Math.PI,
      (currentAngle - startAngle) * 180 / Math.PI
    );
    return skPath;
  });

  const backgroundPath = useMemo(() => {
    const skPath = Skia.Path.Make();
    skPath.addArc(
      Skia.XYWHRect(center.x - radius, center.y - radius, radius * 2, radius * 2),
      144,
      252
    );
    return skPath;
  }, [radius]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas style={{ flex: 1 }}>
        <Path
          path={backgroundPath}
          color={theme.colors.borderSubtle}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
        />
        <Group>
          <Path
            path={path}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(size, size)}
              colors={[theme.colors.chart.cyan, theme.colors.chart.purple]}
            />
          </Path>
        </Group>
      </Canvas>
      <View style={styles.overlay}>
        <Text style={styles.valueText}>{Math.round(value * 100)}</Text>
        <Text style={styles.label}>RISK LEVEL</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  valueText: {
    color: theme.colors.text.primary,
    fontSize: 32,
    fontFamily: theme.typography.families.heading,
  },
  label: {
    color: theme.colors.text.muted,
    fontSize: 10,
    fontFamily: theme.typography.families.mono,
    marginTop: -4,
  },
});
