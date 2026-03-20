import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator,
  Animated
} from 'react-native';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { GlowEffect } from '../ui/GlowEffect';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Clock, AlertTriangle, Zap } from 'lucide-react-native';

interface SessionWarningProps {
  visible: boolean;
  onExtend: () => void;
  expiryTime: number; // ms until expiry
}

export function SessionWarningModal({ visible, onExtend, expiryTime }: SessionWarningProps) {
  const { theme, isDark } = useTheme();
  const [timeLeft, setTimeLeft] = useState(Math.floor(expiryTime / 1000));
  const [pulse] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();

      return () => clearInterval(timer);
    }
  }, [visible]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  const ClockIcon = Clock as any;
  const AlertIcon = AlertTriangle as any;
  const ZapIcon = Zap as any;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <GlassCard intensity="high" style={styles.container}>
          <View style={styles.content}>
            <Animated.View style={[styles.iconBox, { transform: [{ scale: pulse }], backgroundColor: theme.primary + '15', borderColor: theme.primary + '33' }]}>
              <ClockIcon size={32} color={theme.primary} />
            </Animated.View>

            <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10, marginTop: 16 }}>SECURITY_ALERT // SESSION_EXPIRING</Typography>
            <Typography variant="h3" style={{ color: theme.textPrimary, textAlign: 'center', marginTop: 8 }}>SESSION_TIMEOUT_NEAR</Typography>
            
            <View style={[styles.timerContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }]}>
              <Typography variant="h1" style={{ color: theme.primary, letterSpacing: 4 }}>{formatTime(timeLeft)}</Typography>
            </View>

            <Typography variant="body" style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 13, lineHeight: 20 }}>
              Your session is set to expire due to terminal inactivity protocols. Do you wish to extend your operational link?
            </Typography>

            <TouchableOpacity 
              style={[styles.extendButton, { backgroundColor: theme.primary }]}
              onPress={onExtend}
            >
              <ZapIcon size={18} color={theme.background} />
              <Typography variant="monoBold" style={{ color: theme.background, letterSpacing: 1.5 }}>EXTEND_SESSION_LINK</Typography>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Typography variant="caption" style={{ color: theme.textTertiary, fontSize: 8 }}>
                PROTOCOL_ID: {Math.random().toString(36).substring(7).toUpperCase()} // AUTO_LOGOUT_ACTIVE
              </Typography>
            </View>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  timerContainer: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  extendButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 32,
  },
  footer: {
    marginTop: 24,
    opacity: 0.5,
  }
});
