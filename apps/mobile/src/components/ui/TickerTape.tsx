import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  LinearTransition,
  Easing
} from 'react-native-reanimated';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

import { supabase } from '../../services/supabase';

export function TickerTape() {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);
  const [data, setData] = React.useState<any[]>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      const { data: prices } = await supabase
        .from('prices')
        .select('symbol, price, delta:price') // Just a mock delta for now if not in DB
        .limit(10);
      
      if (prices) {
        // Add random delta for visual effect since I didn't add it to schema yet
        const mapped = prices.map(p => ({
          ...p,
          delta: (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 2).toFixed(2) + '%'
        }));
        setData(mapped);
      }
    };

    fetchPrices();
    
    // Refresh every minute
    const interval = setInterval(fetchPrices, 60000);

    translateX.value = withRepeat(
      withTiming(-width, { 
        duration: 20000, 
        easing: Easing.linear 
      }),
      -1,
      false
    );

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const displayData = data.length > 0 ? data : [
    { symbol: 'BTC/USD', price: '64,231.50', delta: '+2.41%' },
    { symbol: 'ETH/USD', price: '3,452.12', delta: '-1.05%' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <Animated.View style={[styles.tape, animatedStyle]}>
        {[...displayData, ...displayData, ...displayData].map((item, index) => (
          <View key={index} style={styles.item}>
            <Typography variant="mono" style={{ color: theme.textTertiary, marginRight: 8 }}>{item.symbol}</Typography>
            <Typography variant="monoBold" style={{ color: theme.textPrimary, marginRight: 8 }}>{item.price}</Typography>
            <Typography 
              variant="mono" 
              style={{ color: item.delta.startsWith('+') ? theme.success : theme.error }}
            >
              {item.delta}
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
    height: 32,
    overflow: 'hidden',
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  tape: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  divider: {
    width: 1,
    height: 12,
    marginLeft: 16,
  },
});
