import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';
import { Lock, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface GatedFeatureProps {
  children: React.ReactNode;
  locked: boolean;
  featureName: string;
  requiredTier?: string;
  style?: any;
}

export function GatedFeature({ 
  children, 
  locked, 
  featureName, 
  requiredTier = 'PRO',
  style 
}: GatedFeatureProps) {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();

  if (!locked) return <View style={style}>{children}</View>;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {children}
      </View>
      
      <BlurView 
        intensity={isDark ? 40 : 60} 
        tint={isDark ? 'dark' : 'light'} 
        style={styles.overlay}
      >
        <View style={styles.lockContainer}>
          <View style={[styles.lockIcon, { backgroundColor: theme.primary + '22' }]}>
            <Lock size={20} color={theme.primary} />
          </View>
          
          <Typography variant="monoBold" style={styles.title}>
            {featureName.toUpperCase()}
          </Typography>
          
          <Typography variant="caption" style={[styles.subtitle, { color: theme.textSecondary }]}>
            REQUIRES {requiredTier} CLEARANCE
          </Typography>

          <TouchableOpacity 
            style={[styles.upgradeBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Typography variant="monoBold" style={styles.upgradeText}>
              UPGRADE_NOW
            </Typography>
            <ArrowRight size={14} color={theme.background} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
  },
  content: {
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  upgradeText: {
    fontSize: 11,
    color: '#000',
    letterSpacing: 1,
  },
});
