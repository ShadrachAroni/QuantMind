import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';
import { GlowEffect } from './GlowEffect';

interface PasswordStrengthMeterProps {
  score: number; // 0 to 4
  feedback?: string;
}

export function PasswordStrengthMeter({ score, feedback }: PasswordStrengthMeterProps) {
  const { theme } = useTheme();
  
  const getScoreDetails = () => {
    switch (score) {
      case 0: return { label: 'LOW_ENTROPY', color: '#EF4444', width: '20%' };
      case 1: return { label: 'WEAK_CIPHER', color: '#F97316', width: '40%' };
      case 2: return { label: 'FAIR_SECURITY', color: '#F59E0B', width: '60%' };
      case 3: return { label: 'STRONG_ENCRYPTION', color: '#10B981', width: '80%' };
      case 4: return { label: 'PROTOCOL_SECURE', color: theme.primary, width: '100%' };
      default: return { label: 'IDLE', color: theme.border, width: '0%' };
    }
  };

  const { label, color, width } = getScoreDetails();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="mono" style={[styles.label, { color }]}>{label}</Typography>
        <Typography variant="caption" style={{ color: theme.textTertiary, fontSize: 8 }}>{width}</Typography>
      </View>
      
      <View style={[styles.track, { backgroundColor: theme.border + '22' }]}>
        <View style={[styles.progress, { width: width as any, backgroundColor: color }]}>
          <GlowEffect color={color} size={20} glowRadius={10} style={styles.glow} />
        </View>
      </View>
      
      {feedback && (
        <Typography variant="caption" style={[styles.feedback, { color: theme.textTertiary }]}>
          {feedback.toUpperCase()}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 9,
    letterSpacing: 1.5,
  },
  track: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 1,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    right: -10,
    top: -9,
  },
  feedback: {
    marginTop: 6,
    fontSize: 8,
    letterSpacing: 0.5,
    opacity: 0.7,
  },
});
