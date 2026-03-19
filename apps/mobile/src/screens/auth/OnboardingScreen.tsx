import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Activity, ShieldCheck, Zap, ArrowRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Institutional Risk Engine',
    description: 'Deploy Monte Carlo simulations with GBM and fat-tailed models used by tier-1 hedge funds.',
    icon: (Activity as any)({ size: 80, color: theme.colors.primary }),
  },
  {
    id: '2',
    title: 'Portfolio Optimization',
    description: 'Stress-test your allocations against extreme market volatility and correlated event scenarios.',
    icon: (ShieldCheck as any)({ size: 80, color: theme.colors.secondary }),
  },
  {
    id: '3',
    title: 'AI Quantitative Alpha',
    description: 'Interact with our proprietary LLM trained on institutional risk frameworks and market history.',
    icon: (Zap as any)({ size: 80, color: "#FFD60A" }),
  },
];

export function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const { completeOnboarding } = useAuthStore();

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const renderItem = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>
        {item.icon}
      </View>
      <View style={styles.textContainer}>
        <Typography variant="h1" style={styles.title}>{item.title}</Typography>
        <Typography variant="body" style={styles.description}>{item.description}</Typography>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, index) => {
            const opacity = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            const scale = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [1, 1.2, 1],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[styles.indicator, { opacity, transform: [{ scale }] }]}
              />
            );
          })}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Typography variant="button" style={styles.nextText}>
            {currentIndex === SLIDES.length - 1 ? 'GET STARTED' : 'CONTINUE'}
          </Typography>
          {(ArrowRight as any)({ size: 18, color: theme.colors.background })}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 40,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#FFF',
  },
  description: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    padding: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.roundness.md,
    gap: 8,
  },
  nextText: {
    color: theme.colors.background,
    fontWeight: '700',
    fontFamily: theme.typography.fonts.mono,
  },
});
