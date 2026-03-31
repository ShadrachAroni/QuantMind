import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withDelay,
  Easing,
  interpolate
} from 'react-native-reanimated';

interface OrbitPingProps {
  size?: number;
  color?: string;
  delay?: number;
}

export const OrbitPing: React.FC<OrbitPingProps> = ({ 
  size = 120, 
  color = '#00D9FF',
  delay = 0
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { 
          duration: 3000, 
          easing: Easing.bezier(0.4, 0, 0.2, 1) 
        }),
        -1,
        false
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 1.5,
      borderColor: color,
      opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.4, 0]),
      transform: [
        { scale: interpolate(progress.value, [0, 1], [0.8, 1.8]) }
      ],
      position: 'absolute',
    };
  });

  return <Animated.View style={animatedStyle} />;
};
