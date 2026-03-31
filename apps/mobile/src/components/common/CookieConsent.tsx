import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Shield, X, Cookie, ShieldCheck } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { useTheme } from '../../context/ThemeContext';
import { storage } from '../../utils/storage';
import { sharedTheme } from '../../constants/theme';

const CONSENT_KEY = 'qm_cookie_consent';

export function CookieConsent() {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(100))[0];

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const checkConsent = async () => {
      const consent = await storage.getItemAsync(CONSENT_KEY);
      if (!consent) {
        setIsVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    checkConsent();
  }, []);

  const handleConsent = async (type: 'all' | 'essential' | 'none') => {
    await storage.setItemAsync(CONSENT_KEY, type);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setIsVisible(false));
  };

  if (!isVisible || Platform.OS !== 'web') return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <GlassCard intensity="high" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Cookie size={24} color={theme.primary} />
          </View>
          <View style={styles.textContainer}>
            <Typography variant="h3" style={styles.title}>Cookie Settings</Typography>
            <Typography variant="body" color="textSecondary" style={styles.description}>
              We use quantum-grade encryption and cookies to enhance your experience and secure your sensitive data.
            </Typography>
          </View>
          <TouchableOpacity onPress={() => handleConsent('essential')} style={styles.closeButton}>
            <X size={20} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, { borderColor: theme.border }]}
            onPress={() => handleConsent('essential')}
          >
            <Typography variant="button" style={{ color: theme.textPrimary }}>Essential Only</Typography>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={() => handleConsent('all')}
          >
            <ShieldCheck size={18} color="#000" style={{ marginRight: 8 }} />
            <Typography variant="button" style={{ color: '#000' }}>Accept All</Typography>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');
const isSmallScreen = width < 768;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    maxWidth: 600,
    padding: 24,
    borderWidth: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 255, 242, 0.1)',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
  actions: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  primaryButton: {
    shadowColor: '#00fff2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  secondaryButton: {
    borderWidth: 1,
  },
});
