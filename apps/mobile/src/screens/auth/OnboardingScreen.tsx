import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  StatusBar,
} from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { useAuthStore } from '../../store/authStore';
import { Activity, ShieldCheck, Zap, ArrowRight, Cpu, BarChart3, Globe, FileText } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { useTheme } from '../../context/ThemeContext';
import { sharedTheme } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'RISK_ENGINE_V4',
    description: 'Deploy mission-critical Monte Carlo simulations with GBM and fat-tailed kernels used by global institutions.',
    icon: Activity,
    color: '#00F5FF', // High-tech cyan
  },
  {
    id: '2',
    title: 'VAULT_SECURITY',
    description: 'Secure your capital allocations with E2E encryption and real-time stress testing against market black-swans.',
    icon: ShieldCheck,
    color: '#7000FF', // Cyber purple
  },
  {
    id: '3',
    title: 'ORACLE_CORE',
    description: 'Communicate with a proprietary LLM trained on institutional risk frameworks and sovereign market history.',
    icon: Cpu,
    color: '#FFD60A', // Industrial gold
  },
  {
    id: '4',
    title: 'TRANSPARENCY_INIT',
    description: 'QuantMind models (GBM, JUMP_DIFF) are fully documented. Access the methodology whitepaper anytime in settings.',
    icon: FileText,
    color: '#00D4FF',
  },
];

export function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const { completeOnboarding } = useAuthStore();
  const { theme, isDark } = useTheme();

  const ArrowIcon = ArrowRight as any;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const dynamicStyles = getStyles(theme, isDark);

  const renderItem = ({ item, index }: { item: typeof SLIDES[0], index: number }) => {
    const IconComp = item.icon as any;
    return (
      <View style={dynamicStyles.slide}>
        <GlowEffect color={item.color} size={width * 0.8} glowRadius={width * 0.4} style={dynamicStyles.slideGlow} />
        
        <GlassCard style={dynamicStyles.slideCard} intensity="high">
          <View style={[dynamicStyles.iconContainer, { borderColor: item.color + '33' }]}>
            <IconComp size={60} color={item.color} strokeWidth={1.5} />
            <GlowEffect color={item.color} size={60} glowRadius={30} style={dynamicStyles.iconGlow} />
          </View>
          
          <View style={dynamicStyles.textContainer}>
            <View style={[dynamicStyles.idBadge, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <Typography variant="mono" style={[dynamicStyles.idText, { color: item.color }]}>P_0{index + 1}</Typography>
            </View>
            <Typography variant="h1" style={[dynamicStyles.title, { color: theme.textPrimary }]}>{item.title}</Typography>
            <Typography variant="body" style={[dynamicStyles.description, { color: theme.textSecondary }]}>{item.description.toUpperCase()}</Typography>
          </View>
        </GlassCard>

        <View style={dynamicStyles.metadata}>
           <Typography variant="mono" style={[dynamicStyles.metaText, { color: theme.textTertiary }]}>SYS_READY // AUTH_VERIFIED // KERNEL_ID: {Math.random().toString(36).substring(7).toUpperCase()}</Typography>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item, index }) => renderItem({ item, index })}
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

      <View style={dynamicStyles.footer}>
        <View style={dynamicStyles.indicatorContainer}>
          {SLIDES.map((_, index) => {
            const opacity = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [0.2, 1, 0.2],
              extrapolate: 'clamp',
            });
            const scaleX = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[dynamicStyles.indicator, { opacity, backgroundColor: theme.primary, transform: [{ scaleX }] }]}
              />
            );
          })}
        </View>

        <TouchableOpacity 
          style={[dynamicStyles.nextButton, { backgroundColor: theme.primary, shadowColor: theme.primary }]} 
          onPress={handleNext} 
          activeOpacity={0.8}
        >
          <Typography variant="monoBold" style={[dynamicStyles.nextText, { color: theme.background }]}>
            {currentIndex === SLIDES.length - 1 ? 'INITIALIZE_TERMINAL' : 'NEXT_STATION'}
          </Typography>
          <ArrowIcon size={16} color={theme.background} strokeWidth={3} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    height: height - 100, // Account for footer
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  slideGlow: {
    position: 'absolute',
    top: height * 0.15,
    opacity: isDark ? 0.15 : 0.08,
  },
  slideCard: {
    width: '100%',
    padding: 32,
    borderRadius: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 40,
  },
  iconGlow: {
    position: 'absolute',
    opacity: 0.3,
  },
  textContainer: {
    alignItems: 'center',
  },
  idBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  idText: {
    fontSize: 10,
    letterSpacing: 2,
  },
  title: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: 2,
  },
  description: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 18,
    fontFamily: sharedTheme.typography.fonts.mono,
    letterSpacing: 1,
  },
  metadata: {
    position: 'absolute',
    bottom: 40,
    opacity: 0.3,
  },
  metaText: {
    fontSize: 8,
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: {
    fontSize: 11,
    letterSpacing: 1,
  },
});
