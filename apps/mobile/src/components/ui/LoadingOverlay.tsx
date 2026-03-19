import React, { useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { Typography } from './Typography';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Loading...' }: LoadingOverlayProps) {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (visible) {
      rotate.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1
      );
      
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.4, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      rotate.value = 0;
      scale.value = 1;
      opacity.value = 0.4;
    }
  }, [visible]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <View style={styles.content}>
          <Animated.View style={[styles.logoCore, animatedLogoStyle]}>
            <View style={styles.logoInner} />
          </Animated.View>
          <Typography variant="body" style={styles.message}>
            {message}
          </Typography>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.xl,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 200,
  },
  logoCore: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
    marginBottom: theme.spacing.lg,
  },
  logoInner: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
  },
  message: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
