import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { Typography } from '../ui/Typography';
import { theme } from '../../constants/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface RiskGaugeProps {
  score: number; // 0 to 100
  size?: number;
  label?: string;
}

export function RiskGauge({ score, size = 160, label = 'Risk Score' }: RiskGaugeProps) {
  const animatedScore = useSharedValue(0);
  
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  
  // Semicircle calculations
  const circumference = Math.PI * radius;
  
  useEffect(() => {
    animatedScore.value = withTiming(score, { 
      duration: 1500, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });
  }, [score]);

  const getColorForScore = (val: number) => {
    if (val <= 30) return theme.colors.success;      // Low risk (Green)
    if (val <= 60) return theme.colors.warning;      // Medium risk (Yellow/Orange)
    if (val <= 80) return '#F97316';                 // High risk (Orange)
    return theme.colors.error;                       // Severe risk (Red)
  };

  const animatedProps = useAnimatedProps(() => {
    const progress = Math.max(0, Math.min(100, animatedScore.value)) / 100;
    const strokeDashoffset = circumference - (progress * circumference);
    return {
      strokeDashoffset,
    };
  });

  const activeColor = getColorForScore(score);

  return (
    <View style={[styles.container, { width: size, height: size / 2 + 20 }]}>
      <Svg width={size} height={size}>
        <G rotation="-180" origin={`${cx}, ${cy}`}>
          {/* Background Track */}
          <Path
            d={`M ${strokeWidth/2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth/2} ${cy}`}
            stroke={theme.colors.border}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          {/* Animated Value Track */}
          <AnimatedPath
            d={`M ${strokeWidth/2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth/2} ${cy}`}
            stroke={activeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />
        </G>
        
        {/* Ticks for segments (Optional, but adds institutional feel) */}
        <Path d={`M ${size*0.2} ${cy - size*0.4} L ${size*0.22} ${cy - size*0.38}`} stroke={theme.colors.textTertiary} strokeWidth={2} />
        <Path d={`M ${cx} ${strokeWidth + 2} L ${cx} ${strokeWidth + 8}`} stroke={theme.colors.textTertiary} strokeWidth={2} />
        <Path d={`M ${size*0.8} ${cy - size*0.4} L ${size*0.78} ${cy - size*0.38}`} stroke={theme.colors.textTertiary} strokeWidth={2} />
        
        {/* Score Text in Center */}
        <SvgText
          x={cx}
          y={cy - 10}
          fontSize="36"
          fontWeight="bold"
          fontFamily={theme.typography.fonts.mono}
          fill={activeColor}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {score.toFixed(0)}
        </SvgText>
        
        <SvgText
          x={cx}
          y={cy + 15}
          fontSize="12"
          fontFamily={theme.typography.fonts.regular}
          fill={theme.colors.textSecondary}
          textAnchor="middle"
          alignmentBaseline="baseline"
        >
          / 100
        </SvgText>
      </Svg>
      
      <Typography variant="caption" style={styles.label}>{label}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  label: {
    position: 'absolute',
    bottom: 0,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
  },
});
