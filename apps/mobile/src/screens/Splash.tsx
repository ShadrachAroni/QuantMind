import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../components/ui/Typography';
import {
  Canvas,
  Circle,
  Group,
  Fill,
  BlurMask,
  vec,
  RadialGradient,
  Points,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  interpolateColor,
  FadeIn,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';

import { useResponsive } from '../hooks/useResponsive';
import { usePerformance } from '../context/PerformanceContext';

// Constants for the 4-second sequence
const SPIN_DURATION = 1500;
const PAUSE_DURATION = 500;
const TEXT_START = SPIN_DURATION + PAUSE_DURATION;

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

const Character = ({ char, index, total, shimmerProgress }: { char: string, index: number, total: number, shimmerProgress: SharedValue<number> }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const glitch = useSharedValue(0);
  const flicker = useSharedValue(1);

  useEffect(() => {
    const delay = TEXT_START + (index * 100);
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    scale.value = withDelay(delay, withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.back(1.5))
    }));

    // Intensified initial glitch pulse (6px offset)
    glitch.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 100 }),
      withTiming(0.8, { duration: 150 }),
      withTiming(0, { duration: 200 })
    ));

    // Digital Power-On Flicker
    flicker.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.4, { duration: 50 }),
        withTiming(1, { duration: 50 })
      ),
      6,
      true
    ));

    // Periodic subtle re-sync glitch
    const interval = setInterval(() => {
      glitch.value = withSequence(
        withTiming(0.3, { duration: 70 }),
        withTiming(0, { duration: 70 })
      );
    }, 2500 + Math.random() * 2500);

    return () => clearInterval(interval);
  }, []);

  // Sequential Neural Pulse (based on shimmerProgress)
  const isPulsing = useDerivedValue(() => {
    const sectionWidth = 1 / total;
    const center = index * sectionWidth;
    const distance = Math.abs(shimmerProgress.value - center);
    return interpolate(distance, [0, 0.15], [1, 0], 'clamp');
  });

  // Pass 3: Sharp High-Fidelity Text
  const mainStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * flicker.value,
    transform: [{ scale: scale.value * (1 + 0.08 * isPulsing.value) }],
    color: '#FFFFFF',
  }));

  const redStyle = useAnimatedStyle(() => ({
    opacity: glitch.value * 0.6 * opacity.value,
    transform: [
      { scale: scale.value },
      { translateX: -6 * glitch.value } // Hard glitch offset
    ],
    color: '#FF0055',
    position: 'absolute',
  }));

  const cyanStyle = useAnimatedStyle(() => ({
    opacity: glitch.value * 0.6 * opacity.value,
    transform: [
      { scale: scale.value },
      { translateX: 6 * glitch.value } // Hard glitch offset
    ],
    color: '#00FFFF',
    position: 'absolute',
  }));

  return (
    <View style={styles.charWrapper}>
      <Animated.Text style={[styles.charText, redStyle]}>{char}</Animated.Text>
      <Animated.Text style={[styles.charText, cyanStyle]}>{char}</Animated.Text>
      <Animated.Text style={[styles.charText, mainStyle]}>
        {char}
      </Animated.Text>
    </View>
  );
};

export const SplashScreen = ({ onAnimationComplete }: SplashScreenProps) => {
  const { width, height, isLandscape } = useResponsive();
  const { isLowEnd, particleCount, enableGlows } = usePerformance();
  
  const rotation = useSharedValue(0);
  const logoScale = useSharedValue(0);
  const rippleRadius = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const bgPulse = useSharedValue(1);
  const shimmerProgress = useSharedValue(0);

  // Starfield logic
  const stars = useMemo(() => {
    return Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [width, height, particleCount]);

  const starOpacity = useSharedValue(0.3);
  const driftX = useSharedValue(0);
  const driftTransform = useDerivedValue(() => [{ translateX: driftX.value }]);

  useEffect(() => {
    // Phase 1: Logo Entrance & Spin
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });
    rotation.value = withTiming(360, {
      duration: SPIN_DURATION,
      easing: Easing.inOut(Easing.quad)
    });

    // Phase 2: Ripple & Burst at 1.5s
    setTimeout(() => {
      rippleRadius.value = withTiming(width * 0.8, { duration: 1000, easing: Easing.out(Easing.quad) });
      rippleOpacity.value = withSequence(
        withTiming(0.6, { duration: 200 }),
        withTiming(0, { duration: 800 })
      );
    }, SPIN_DURATION);

    // Phase 3: Background pulse sync with text
    bgPulse.value = withDelay(TEXT_START, withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    ));

    // Phase 4: Shimmer & Particles
    shimmerProgress.value = withDelay(TEXT_START, withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    ));

    // Phase 4: Drift & Twinkle stars
    starOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    driftX.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 10000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Phase 5: Exit trigger at 4s (Snappier)
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rotation.value, [0, 45], [0, 1], 'clamp'),
    transform: [
      { scale: logoScale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  const animatedBgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgPulse.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />

      {/* Dynamic Futuristic Background */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedBgStyle]}>
        <LinearGradient
          colors={['#060B1A', '#004D4D', '#032F2F']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Starfield Layer */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill color="transparent" />
        <Group transform={driftTransform}>
          {stars.map((star: any, i: number) => (
            <Circle
              key={i}
              cx={star.x}
              cy={star.y}
              r={star.size}
              color="white"
              opacity={starOpacity}
            >
              {enableGlows && <BlurMask blur={1} style="normal" />}
            </Circle>
          ))}
        </Group>

        {/* Quantum Ripple Effect */}
        <Group>
          <Circle
            cx={width / 2}
            cy={height / 2 - 40}
            r={rippleRadius}
            opacity={rippleOpacity}
            color="#00F5FF"
          >
            {enableGlows && <BlurMask blur={10} style="normal" />}
          </Circle>
        </Group>
      </Canvas>

      <View style={styles.centerContent}>
        <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
          <Image
            source={require('../../assets/splash.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>

        <View style={styles.textContainer}>
          <View style={styles.brandRow}>
            {"QUANTMIND".split("").map((char, i) => (char === " " ? <View key={i} style={{ width: 10 }} /> : (
              <Character key={i} char={char} index={i} total={9} shimmerProgress={shimmerProgress} />
            )))}
          </View>

          <Animated.View
            entering={FadeIn.delay(TEXT_START + 500).duration(800)}
            style={styles.taglineWrapper}
          >
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060B1A',
  },
  charWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  logo: {
    width: 160,
    height: 160,
    zIndex: 2,
  },
  textContainer: {
    alignItems: 'center',
    height: 80,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  charText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
    fontFamily: 'Outfit-Bold',
  },
  taglineWrapper: {
    marginTop: 16,
  },
  tagline: {
    color: 'rgba(0, 245, 255, 0.5)',
    fontSize: 10,
    letterSpacing: 3,
  },
});
