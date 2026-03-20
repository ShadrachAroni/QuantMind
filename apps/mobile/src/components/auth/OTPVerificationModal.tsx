import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, TextInput, TouchableOpacity, Animated } from 'react-native';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../services/supabase';
import { ShieldCheck, RefreshCw, X } from 'lucide-react-native';

interface OTPVerificationModalProps {
  visible: boolean;
  email: string;
  onVerify: () => void;
  onClose: () => void;
}

export function OTPVerificationModal({ visible, email, onVerify, onClose }: OTPVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(0);
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      setTimeLeft(600);
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [visible, timeLeft]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      showToast('OTP must be 6 digits.', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    });
    setLoading(false);

    if (error) {
      showToast(error.message.toUpperCase(), 'error');
    } else {
      showToast('ACCESS_GRANTED: Identity verified.', 'success');
      onVerify();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    setLoading(false);

    if (error) {
      showToast(error.message.toUpperCase(), 'error');
    } else {
      showToast('CODE_DISPATCHED to your identifier.', 'success');
      setResendCooldown(30); // 30s rate limit
      setTimeLeft(600); // Reset main expiry
    }
  };

  const ShieldIcon = ShieldCheck as any;
  const RefreshIcon = RefreshCw as any;
  const CloseIcon = X as any;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <GlassCard style={[styles.card, { borderColor: theme.border }]}>
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '10' }]}>
                <ShieldIcon size={24} color={theme.primary} />
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <CloseIcon size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>

            <Typography variant="h2" style={{ color: theme.textPrimary, marginBottom: 8 }}>VERIFY_IDENTITY</Typography>
            <Typography variant="caption" style={{ color: theme.textSecondary, marginBottom: 24 }}>
              OTP_SENT_TO: <Typography variant="mono" style={{ color: theme.primary, fontSize: 10 }}>{email.toUpperCase()}</Typography>
            </Typography>

            <View style={[styles.otpContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder="000000"
                placeholderTextColor={theme.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            <View style={styles.timerRow}>
              <Typography variant="mono" style={{ color: timeLeft < 60 ? '#EF4444' : theme.textTertiary, fontSize: 10 }}>
                EXPIRY: {formatTime(timeLeft)}
              </Typography>
              <TouchableOpacity 
                onPress={handleResend} 
                disabled={resendCooldown > 0}
                style={styles.resendBtn}
              >
                <RefreshIcon size={12} color={resendCooldown > 0 ? theme.textTertiary : theme.primary} style={{ marginRight: 6 }} />
                <Typography variant="mono" style={{ color: resendCooldown > 0 ? theme.textTertiary : theme.primary, fontSize: 10 }}>
                  {resendCooldown > 0 ? `RESEND (${resendCooldown}S)` : 'RESEND_CODE'}
                </Typography>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.verifyBtn, { backgroundColor: theme.primary }]} 
              onPress={handleVerify}
            >
              <Typography variant="monoBold" style={{ color: theme.background }}>VALIDATE_OTP</Typography>
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>
      </View>
      <LoadingOverlay visible={loading} message="SYNCHRONIZING_TOKEN..." />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
  },
  card: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  otpContainer: {
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 16,
  },
  input: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontFamily: 'SpaceMono_700Bold', // Using the mono font if available, fallback handled by Typography
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
