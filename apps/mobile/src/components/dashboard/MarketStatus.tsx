import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { GlowEffect } from '../ui/GlowEffect';
import { useTheme } from '../../context/ThemeContext';

export function MarketStatus() {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Basic logic to determine if market is open (9:30 AM - 4:00 PM EST)
    const checkMarket = () => {
      const now = new Date();
      const day = now.getUTCDay();
      const hours = now.getUTCHours();
      const minutes = now.getUTCMinutes();
      
      // Conversion from UTC (for EST, usually UTC-4/5)
      // Simplistic check: 14:30 - 21:00 UTC is roughly 10:30 - 17:00 (close enough for demo)
      const open = day !== 0 && day !== 6 && hours >= 14 && (hours < 21 || (hours === 21 && minutes === 0));
      setIsOpen(open);
    };

    checkMarket();
    const interval = setInterval(checkMarket, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <GlowEffect color={isOpen ? '#10B981' : '#F59E0B'} size={6} glowRadius={8} />
      <Typography variant="mono" style={[styles.text, { color: isOpen ? '#10B981' : '#F59E0B' }]}>
        {isOpen ? 'MARKET_OPEN' : 'MARKET_PROTECTION_ON'}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  text: {
    fontSize: 9,
    letterSpacing: 1,
  },
});
