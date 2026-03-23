import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

interface GlowEffectProps {
  children?: React.ReactNode;
  color?: string;
  size?: number;
  duration?: number;
  glowRadius?: number;
  opacity?: number;
  type?: 'pulse' | 'steady';
  style?: StyleProp<ViewStyle>;
}

export function GlowEffect({ 
  children, 
  color, 
  size = 10, 
  duration = 2000, 
  glowRadius = 15,
  type = 'pulse',
  style,
  opacity: initialOpacity = 0.4
}: GlowEffectProps) {
  const { theme } = useTheme();
  const activeColor = color || theme.primary;
  const opacity = useSharedValue(initialOpacity);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (type === 'pulse') {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: duration / 2 }),
          withTiming(1, { duration: duration / 2 })
        ),
        -1,
        false
      );
    }
  }, [type, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    shadowColor: activeColor,
    shadowRadius: glowRadius,
    backgroundColor: activeColor,
  }));

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[
        styles.glow, 
        { width: size, height: size, borderRadius: size / 2 },
        animatedStyle
      ]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    elevation: 10,
  },
});
