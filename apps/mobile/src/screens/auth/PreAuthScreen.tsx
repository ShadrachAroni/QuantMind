import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { useTheme } from '../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing
} from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

export function PreAuthScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();

  // Dynamic "Neural Pulse" Animation for the background
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} translucent={true} />

      {/* Dynamic Quantum Pulse Background Layer */}
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, animatedBackgroundStyle]}>
          <ExpoImage
            source={require('../../../assets/onboarding/preauth_bg_quantum.png')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={1000}
          />
        </Animated.View>
      </View>

      {/* Legibility & Depth Overlays */}
      <LinearGradient
        colors={['rgba(9, 13, 26, 0.5)', 'rgba(9, 13, 26, 0.8)', 'rgba(9, 13, 26, 1)']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.45, 0.85]}
      />

      <View style={styles.content}>
        <View style={styles.topSection}>
          <Animated.View entering={FadeInUp.delay(200).duration(800)}>
            <Typography variant="h1" style={styles.title}>
              Welcome to{"\n"}QuantMind
            </Typography>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(400).duration(800)}>
            <Typography variant="body" style={styles.subtitle}>
              Institutional-grade risk management and portfolio analytics in the palm of your hand.
            </Typography>
          </Animated.View>
        </View>

        <View style={styles.bottomSection}>
          <Animated.View entering={FadeIn.delay(1000).duration(800)} style={styles.legalContainer}>
            <Typography variant="mono" style={styles.legalText}>
              By continuing you agree to our{" "}
              <Typography
                variant="mono"
                style={[styles.link, { color: '#00F5FF' }]}
                onPress={() => navigation.navigate('TermsOfService')}
              >
                Terms of Service
              </Typography>
              {" "}and{" "}
              <Typography
                variant="mono"
                style={[styles.link, { color: '#00F5FF' }]}
                onPress={() => navigation.navigate('PrivacyPolicy')}
              >
                Privacy Policy
              </Typography>
            </Typography>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600).duration(800)}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: '#39FF14' }]}
              onPress={() => navigation.navigate('SignUp')}
              activeOpacity={0.8}
            >
              <Typography variant="h3" style={styles.primaryButtonText}>
                Create new account
              </Typography>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(800).duration(800)}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Typography variant="h3" style={styles.secondaryButtonText}>
                Login
              </Typography>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D1A',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  topSection: {
    marginTop: height * 0.12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 48,
    letterSpacing: -1,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    marginTop: 16,
    lineHeight: 24,
    maxWidth: '85%',
  },
  bottomSection: {
    marginBottom: 40,
  },
  legalContainer: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  legalText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    textDecorationLine: 'underline',
  },
  primaryButton: {
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
