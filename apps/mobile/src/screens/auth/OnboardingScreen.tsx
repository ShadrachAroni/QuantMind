import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { useAuthStore } from '../../store/authStore';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { ArrowRight } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  useAnimatedScrollHandler,
  interpolate,
  interpolateColor,
  Extrapolate,
  FadeIn,
  runOnJS,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

const SLIDES = [
  {
    id: '1',
    title: 'Advanced Risk\nModeling',
    description: 'Bespoke Monte Carlo engines and GBM kernels designed for mission-critical institutional allocations.',
    image: require('../../../assets/onboarding/onboarding_1.png'),
    accent: '#00F5FF',
  },
  {
    id: '2',
    title: 'Neural Vision\nIntelligence',
    description: 'Proprietary LLM layers trained on sovereign risk frameworks for real-time market sentiment analysis.',
    image: require('../../../assets/onboarding/onboarding_2.png'),
    accent: '#EE82EE',
  },
  {
    id: '3',
    title: 'Institutional Grade\nPrecision',
    description: 'Experience sub-millisecond precision in portfolio rebalancing and fat-tail risk detection.',
    image: require('../../../assets/onboarding/onboarding_3.png'),
    accent: '#39FF14',
  },
];

// Refined Spring Button (Smaller & Smarter)
// Reactive Animated Button (Color & Text Morphing)
const SpringButton = ({ onPress, scrollX }: { onPress: () => void, scrollX: SharedValue<number> }) => {
  const scale = useSharedValue(1);
  const pressOpacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollX.value,
      [0, width, 2 * width],
      [SLIDES[0].accent, SLIDES[1].accent, SLIDES[2].accent]
    );
    return {
      transform: [{ scale: scale.value }],
      opacity: pressOpacity.value,
      backgroundColor,
    };
  });

  const continueLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [width, 1.5 * width, 2 * width],
      [1, 0, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const getStartedLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [width, 1.5 * width, 2 * width],
      [0, 0, 1],
      Extrapolate.CLAMP
    );
    return { opacity, position: 'absolute' };
  });

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 80 });
    pressOpacity.value = withTiming(0.9, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withSequence(
      withSpring(1.05, { damping: 10, stiffness: 100 }),
      withSpring(1, { damping: 12, stiffness: 120 })
    );
    pressOpacity.value = withTiming(1, { duration: 150 });
    onPress();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.nextButton, animatedStyle]}>
        <View style={styles.labelWrapper}>
          <Animated.View style={continueLabelStyle}>
            <Typography variant="button" style={styles.nextText} numberOfLines={1}>CONTINUE</Typography>
          </Animated.View>
          <Animated.View style={getStartedLabelStyle}>
            <Typography variant="button" style={styles.nextText} numberOfLines={1}>GET STARTED</Typography>
          </Animated.View>
        </View>
        <ArrowRight color="#000" size={16} strokeWidth={3} />
      </Animated.View>
    </Pressable>
  );
};

// Moved outside to prevent re-creation on parent render, solving transition flickering
const RenderItem = memo(({ item, index, scrollX }: { item: typeof SLIDES[0], index: number, scrollX: SharedValue<number> }) => {
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const backgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [(index - 0.9) * width, index * width, (index + 0.9) * width],
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [1.1, 1, 1.1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [(index - 0.5) * width, index * width, (index + 0.5) * width],
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      [(index - 0.5) * width, index * width, (index + 0.5) * width],
      [40, 0, 40],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View style={styles.slide}>
      <AnimatedExpoImage
        source={item.image}
        style={[StyleSheet.absoluteFill, backgroundStyle]}
        contentFit="cover"
        priority="high"
      />

      <LinearGradient
        colors={['transparent', 'rgba(9, 13, 26, 0.4)', 'rgba(9, 13, 26, 1)']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.4, 0.85]}
      />

      <Animated.View style={[styles.textContainer, contentStyle]}>
        <Typography variant="h1" style={styles.title}>{item.title}</Typography>
        <Typography variant="body" style={styles.description}>{item.description}</Typography>
      </Animated.View>
    </View>
  );
});

export function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<any>(null);

  useEffect(() => {
    // Pre-fetch images to ensure zero-lag visuals
    SLIDES.forEach(slide => {
      ExpoImage.prefetch(slide.image);
    });
  }, []);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const index = Math.round(event.contentOffset.x / width);
      if (index !== currentIndex) {
        runOnJS(setCurrentIndex)(index);
      }
    },
  });

  const handleSkip = () => {
    navigation.navigate('PreAuth');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <SafeAreaView style={styles.header}>
        <Animated.View entering={FadeIn.duration(800)}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Typography variant="h4" style={styles.skipText}>SKIP_CORE</Typography>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item, index }) => <RenderItem item={item} index={index} scrollX={scrollX} />}
        horizontal
        windowSize={2}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={false}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, index) => {
            const dotStyle = useAnimatedStyle(() => {
              const dotWidth = interpolate(
                scrollX.value,
                [(index - 1) * width, index * width, (index + 1) * width],
                [8, 24, 8],
                Extrapolate.CLAMP
              );
              const opacity = interpolate(
                scrollX.value,
                [(index - 1) * width, index * width, (index + 1) * width],
                [0.3, 1, 0.3],
                Extrapolate.CLAMP
              );
              // Native color morphing
              const backgroundColor = interpolateColor(
                scrollX.value,
                [0, width, 2 * width],
                [SLIDES[0].accent, SLIDES[1].accent, SLIDES[2].accent]
              );
              return {
                width: dotWidth,
                opacity,
                backgroundColor,
              };
            });
            return (
              <Animated.View
                key={index}
                style={[styles.indicator, dotStyle]}
              />
            );
          })}
        </View>

        <View>
          <SpringButton
            onPress={() => {
              if (currentIndex === SLIDES.length - 1) {
                navigation.navigate('PreAuth');
              } else {
                flatListRef.current?.scrollToIndex({
                  index: currentIndex + 1,
                  animated: true
                });
              }
            }}
            scrollX={scrollX}
          />
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
  header: {
    paddingHorizontal: 24,
    position: 'absolute',
    top: 40,
    width: '100%',
    zIndex: 10,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  slide: {
    width,
    height,
  },
  textContainer: {
    paddingHorizontal: 32,
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: height * 0.18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: height * 0.06,
    width: '100%',
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  indicator: {
    height: 6,
    borderRadius: 3,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 22,
    paddingRight: 18,
    borderRadius: 24,
    minWidth: 189, // Increased significantly for full sentence visibility
    backgroundColor: '#FFFFFF',
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    justifyContent: 'space-between',
  },
  labelWrapper: {
    flex: 1,
    position: 'relative',
    height: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 10, // More gap from the arrow
  },
  nextText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
