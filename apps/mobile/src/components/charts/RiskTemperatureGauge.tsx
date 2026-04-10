import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Path as SvgPath, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated';
import { theme } from '../../constants/theme';

const AnimatedPath = Animated.createAnimatedComponent(SvgPath);

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

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const backgroundD = describeArc(center.x, center.y, radius, 144, 396);

  const animatedProps = useAnimatedProps(() => {
    const startAngle = 144;
    const totalAngle = 252;
    const endAngle = startAngle + totalAngle * animatedValue.value;
    return {
      d: describeArc(center.x, center.y, radius, startAngle, endAngle),
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={theme.colors.primary} />
            <Stop offset="100%" stopColor={theme.colors.secondary} />
          </LinearGradient>
        </Defs>
        <SvgPath
          d={backgroundD}
          stroke={theme.colors.borderSubtle}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        <AnimatedPath
          animatedProps={animatedProps}
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
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
    color: theme.colors.textPrimary,
    fontSize: 32,
    fontFamily: theme.typography.fonts.bold,
  },
  label: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    fontFamily: theme.typography.fonts.mono,
    marginTop: -4,
  },
});
