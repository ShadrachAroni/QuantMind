import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing
} from 'react-native-reanimated';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';
import { Zap, ShieldCheck, TrendingUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

import { useAuthStore } from '../../store/authStore';

export function PromotionTicker() {
  const { theme, isDark } = useTheme();
  const systemEvents = useAuthStore((state) => state.systemEvents);
  const translateX = useSharedValue(0);

  const displayEvents = systemEvents.length > 0 ? systemEvents : [
    { event_type: 'system', message: 'CONNECTING_TO_REALTIME_NODE...' }
  ];

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-width * 1.5, { 
        duration: 25000, 
        easing: Easing.linear 
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const ZapIcon = Zap as any;
  const ShieldIcon = ShieldCheck as any;
  const TrendIcon = TrendingUp as any;

  const renderIcon = (type: string) => {
    switch(type) {
      case 'upgrade': return <ZapIcon size={10} color={theme.primary} />;
      case 'system': return <ShieldIcon size={10} color={theme.secondary} />;
      case 'achievement': return <TrendIcon size={10} color={theme.success} />;
      default: return <ShieldIcon size={10} color={theme.textTertiary} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
      <Animated.View style={[styles.tape, animatedStyle]}>
        {[...displayEvents, ...displayEvents, ...displayEvents].map((item, index) => (
          <View key={index} style={styles.item}>
            {renderIcon(item.event_type)}
            <Typography variant="mono" style={[styles.text, { color: theme.textTertiary }]}>
              {item.message}
            </Typography>
            <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    justifyContent: 'center',
    marginVertical: 20,
  },
  tape: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  text: {
    fontSize: 8,
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 12,
    marginLeft: 10,
  },
});
