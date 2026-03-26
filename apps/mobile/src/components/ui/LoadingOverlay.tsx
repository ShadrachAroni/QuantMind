import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'SYNCHRONIZING_SESSION...' }: LoadingOverlayProps) {
  const { theme, isDark } = useTheme();
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      rotate.value = withRepeat(
        withTiming(1, { 
          duration: 2000, 
          easing: Easing.bezier(0.4, 0, 0.2, 1) 
        }),
        -1,
        false
      );
    } else {
      rotate.value = 0;
    }
  }, [visible]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: '45deg' },
      { rotate: `${rotate.value * 360}deg` }
    ],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
       <View style={[styles.container, { backgroundColor: isDark ? 'rgba(5, 7, 10, 0.85)' : 'rgba(255, 255, 255, 0.85)' }]}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Animated.View style={[styles.logoCore, { backgroundColor: theme.primary, shadowColor: theme.primary }, animatedLogoStyle]}>
              <View style={[styles.logoInner, { backgroundColor: theme.background }]} />
            </Animated.View>
            <View style={[styles.orbit, { borderColor: theme.primary + '4D' }]} />
          </View>
          
          <Typography variant="label" style={[styles.message, { color: theme.primary }]}>
            {message.toUpperCase()}
          </Typography>
          
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((i) => (
              <Dot key={i} index={i} color={theme.primary} />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Dot({ index, color }: { index: number, color: string }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    translateY.value = withDelay(index * 150, withRepeat(
      withSequence(
        withTiming(-4, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));

    opacity.value = withDelay(index * 150, withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.4, { duration: 400 })
      ),
      -1,
      true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
   content: {
    alignItems: 'center',
    padding: 32,
    minWidth: 200,
  },
  logoContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCore: {
    width: 48,
    height: 48,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 20,
    zIndex: 10,
  },
  logoInner: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  orbit: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    opacity: 0.2,
  },
  message: {
    marginBottom: 8,
    fontSize: 10,
    letterSpacing: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
    height: 10,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

