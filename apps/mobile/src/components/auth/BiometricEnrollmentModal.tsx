import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { GlowEffect } from '../ui/GlowEffect';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAuthStore } from '../../store/authStore';
import { BiometricType } from '../../services/biometric';
import { Fingerprint, ScanFace, ShieldCheck, Zap, X } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';

const FingerprintIcon = Fingerprint as any;
const ScanFaceIcon = ScanFace as any;
const ShieldCheckIcon = ShieldCheck as any;
const ZapIcon = Zap as any;
const XIcon = X as any;

const { width } = Dimensions.get('window');

interface BiometricEnrollmentModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BiometricEnrollmentModal({ visible, onClose }: BiometricEnrollmentModalProps) {
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const { biometricType, enrollBiometrics } = useAuthStore();

  const handleEnroll = async () => {
    const success = await enrollBiometrics();
    if (success) {
      showToast('BIOMETRIC_ENROLLMENT_SUCCESSFUL', 'success');
      onClose();
    } else {
      showToast('BIOMETRIC_ENROLLMENT_FAILED', 'error');
    }
  };

  const getBiometricConfig = () => {
    switch (biometricType) {
      case BiometricType.FACE_ID:
        return {
          icon: ScanFaceIcon,
          title: 'FACE_ID_INITIALIZATION',
          description: 'Enable facial recognition for rapid terminal access and enhanced security.',
          label: 'ACTIVATE_FACE_ID'
        };
      case BiometricType.FINGERPRINT:
        return {
          icon: FingerprintIcon,
          title: 'FINGERPRINT_LINK',
          description: 'Synchronize your biometric signature for seamless session resumption.',
          label: 'ACTIVATE_FINGERPRINT'
        };
      default:
        return {
          icon: FingerprintIcon,
          title: 'BIOMETRIC_AUTH',
          description: 'Enable system-level biometric verification for your QuantMind terminal.',
          label: 'ACTIVATE_BIOMETRICS'
        };
    }
  };

  const config = getBiometricConfig();
  const Icon = config.icon as any;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut} 
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} 
        />
        
        <Animated.View 
          entering={SlideInUp.springify().damping(15)} 
          style={styles.container}
        >
          <GlassCard intensity="high" style={[styles.card, { borderColor: theme.primary + '33' }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <XIcon size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.iconWrapper}>
                <GlowEffect color={theme.primary} size={80} glowRadius={40} style={styles.glow} />
                <View style={[styles.iconBox, { borderColor: theme.primary + '4D', backgroundColor: theme.primary + '11' }]}>
                  <Icon size={32} color={theme.primary} strokeWidth={1.5} />
                </View>
              </View>
              
              <Typography variant="mono" style={[styles.statusText, { color: theme.primary }]}>[ STATUS: PENDING_ENROLLMENT ]</Typography>
              <Typography variant="h2" style={[styles.title, { color: theme.textPrimary }]}>{config.title}</Typography>
            </View>

            <Typography variant="body" style={[styles.description, { color: theme.textSecondary }]}>
              {config.description}
            </Typography>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <ShieldCheckIcon size={14} color={theme.success} />
                <Typography variant="caption" style={{ color: theme.textTertiary, marginLeft: 10 }}>AES_256_ENHANCED_SECURITY</Typography>
              </View>
              <View style={styles.featureItem}>
                <ZapIcon size={14} color={theme.primary} />
                <Typography variant="caption" style={{ color: theme.textTertiary, marginLeft: 10 }}>ZERO_LATENCY_RESTORE</Typography>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: theme.primary }]} 
                onPress={handleEnroll}
              >
                <Typography variant="monoBold" style={[styles.primaryBtnText, { color: theme.background }]}>{config.label}</Typography>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
                <Typography variant="mono" style={[styles.secondaryBtnText, { color: theme.textTertiary }]}>DEFER_CONFIGURATION</Typography>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    padding: 32,
    borderRadius: 32,
    borderWidth: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  glow: {
    position: 'absolute',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  description: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 32,
  },
  featureList: {
    marginBottom: 32,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    letterSpacing: 1,
  },
  secondaryBtn: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
});
