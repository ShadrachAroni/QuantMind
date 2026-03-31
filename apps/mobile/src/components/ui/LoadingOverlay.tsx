import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Dimensions, Platform } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence, 
  withDelay,
  Easing,
  interpolate,
  withSpring
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';
import { PerspectiveGrid } from './PerspectiveGrid';
import { OrbitPing } from './OrbitPing';

const { width } = Dimensions.get('window');

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'INITIALIZING_SESSION...' }: LoadingOverlayProps) {
  const { theme } = useTheme();
  
  // Animation Values
  const rotation = useSharedValue(0);
  const textOpacity = useSharedValue(0.5);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
      
      // 2s rotation to match web exactly
      rotation.value = withRepeat(
        withTiming(1, { 
          duration: 2000, 
          easing: Easing.bezier(0.4, 0, 0.2, 1) 
        }),
        -1,
        false
      );

      // Pulse text
      textOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0.4, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 360}deg` }, { scale: scale.value }]
  }));

  const textPulseStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: interpolate(textOpacity.value, [0.4, 1], [0.98, 1]) }]
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.root}>
        {/* Futuristic Perspective Grid Background */}
        <PerspectiveGrid />
        
        {/* Backdrop Blur */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5, 7, 10, 0.75)' }]} />
        )}

        <View style={styles.centerContainer}>
          {/* Logo Orbit Section */}
          <View style={styles.logoWrapper}>
            <OrbitPing size={200} delay={0} />
            <OrbitPing size={200} delay={1500} />
            
            <Animated.View style={[styles.mainSpinner, rotationStyle, { borderColor: theme.primary }]}>
              <View style={[styles.innerSquare, { backgroundColor: theme.primary }]} />
            </Animated.View>
          </View>

          {/* Loading Text Section */}
          <Animated.View style={[styles.textContainer, textPulseStyle]}>
            <Typography variant="monoBold" style={[styles.message, { color: theme.textPrimary }]}>
              {message}
            </Typography>
            
            <View style={styles.dotContainer}>
              {[0, 1, 2].map((i) => (
                <LoadingDot key={i} index={i} color={theme.primary} />
              ))}
            </View>
          </Animated.View>
          
          <Typography variant="mono" style={styles.protocolSignature}>
            PROTOCOL_V3.1 // SECURE_CLEARANCE_REQUIRED
          </Typography>
        </View>
      </View>
    </Modal>
  );
}

function LoadingDot({ index, color }: { index: number; color: string }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      index * 150,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0, { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        true
      )
    );
  }, [index]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, dotStyle]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05070A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mainSpinner: {
    width: 64,
    height: 64,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  innerSquare: {
    width: 24,
    height: 24,
    opacity: 0.8,
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
  },
  message: {
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  protocolSignature: {
    position: 'absolute',
    bottom: -150,
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.15)',
    letterSpacing: 2,
  },
});
