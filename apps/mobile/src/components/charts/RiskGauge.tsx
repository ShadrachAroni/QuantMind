import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, useDerivedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from '../ui/Typography';

interface RiskGaugeProps {
  value: number;
  size?: number;
  label?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const RiskGauge = ({ value, size = 200, label = 'Risk Score' }: RiskGaugeProps) => {
  const { theme } = useTheme();
  const radius = size * 0.4;
  const center = size / 2;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  const halfCircumference = circumference / 2;
  
  // Risk level colors and labels
  const getRiskInfo = (val: number) => {
    if (val <= 30) return { color: theme.success, label: 'Low' };
    if (val <= 60) return { color: theme.warning, label: 'Moderate' };
    if (val <= 85) return { color: theme.secondary, label: 'High' };
    return { color: theme.error, label: 'Extreme' };
  };

  const riskInfo = useMemo(() => getRiskInfo(value), [value, theme]);

  const animatedValue = useDerivedValue(() => {
    return withSpring(value / 100);
  });

  const progressProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: halfCircumference * (1 - animatedValue.value),
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size * 0.6 }]}>
      <Svg width={size} height={size * 0.8} viewBox={`0 0 ${size} ${size * 0.8}`}>
        <Defs>
          <LinearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={theme.success} />
            <Stop offset="40%" stopColor={theme.warning} />
            <Stop offset="70%" stopColor={theme.secondary} />
            <Stop offset="100%" stopColor={theme.error} />
          </LinearGradient>
        </Defs>

        {/* Background Track */}
        <Path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          stroke={theme.border}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Progress Fill */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${halfCircumference} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(180, ${center}, ${center})`}
          animatedProps={progressProps}
        />

        {/* Value Text */}
        <SvgText
          x={center}
          y={center - 10}
          textAnchor="middle"
          fontSize={size * 0.18}
          fontWeight="bold"
          fill={theme.textPrimary}
          fontFamily={theme.typography.fonts.bold}
        >
          {Math.round(value)}
        </SvgText>

        {/* Label Text */}
        <SvgText
          x={center}
          y={center + 15}
          textAnchor="middle"
          fontSize={size * 0.06}
          fill={theme.textSecondary}
          fontFamily={theme.typography.fonts.medium}
        >
          {label.toUpperCase()}
        </SvgText>

        {/* Risk Level Text */}
        <SvgText
          x={center}
          y={center + 35}
          textAnchor="middle"
          fontSize={size * 0.08}
          fontWeight="600"
          fill={riskInfo.color}
          fontFamily={theme.typography.fonts.semiBold}
        >
          {riskInfo.label}
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
