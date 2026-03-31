import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Platform,
  KeyboardAvoidingView,
  Pressable
} from 'react-native';
import { supabase } from '../../services/supabase';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Smartphone, Mail, Fingerprint, ChevronLeft, Zap } from 'lucide-react-native';
import { biometricService } from '../../services/biometric';
import { useAuthStore } from '../../store/authStore';

interface MFAChallengeModalProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAChallengeModal({ visible, onSuccess, onCancel }: MFAChallengeModalProps) {
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [factors, setFactors] = useState<any[]>([]);
  const [selectedFactor, setSelectedFactor] = useState<any>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const SmartphoneIcon = Smartphone as any;
  const MailIcon = Mail as any;
  const FingerprintIcon = Fingerprint as any;
  const BackIcon = ChevronLeft as any;
  const ZapIcon = Zap as any;

  useEffect(() => {
    if (visible) {
      loadFactors();
    }
  }, [visible]);

  const loadFactors = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    
    let allFactors: any[] = [];
    if (!error && data) {
      allFactors = data.all.filter(f => f.status === 'verified');
    }

    // Add profile-based factors from store
    const { mfaEmailEnabled, mfaPasskeyEnabled, user } = useAuthStore.getState();
    
    if (mfaEmailEnabled && user?.email) {
      allFactors.push({
        id: 'custom-email',
        factor_type: 'email',
        friendly_name: user.email,
      });
    }
    
    if (mfaPasskeyEnabled) {
      // Don't duplicate if already exists as a native factor
      if (!allFactors.some(f => f.factor_type === 'webauthn')) {
        allFactors.push({
          id: 'custom-passkey',
          factor_type: 'passkey',
          friendly_name: 'BIOMETRIC_SECURE_ENCLAVE',
        });
      }
    }

    setFactors(allFactors);
    
    // Auto-select if only one factor
    if (allFactors.length === 1) {
      handleFactorSelect(allFactors[0]);
    }
    setLoading(false);
  };

  const handleFactorSelect = async (factor: any) => {
    setSelectedFactor(factor);
    
    if (factor.factor_type === 'totp') {
      const { data, error } = await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (error) {
        showToast(error.message, 'error');
        setSelectedFactor(null);
      } else {
        setChallengeId(data.id);
      }
    } else if (factor.factor_type === 'webauthn') {
      // Native WebAuthn challenge
      setLoading(true);
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: ''
      });
      setLoading(false);
      
      if (error) {
        showToast(error.message, 'error');
        setSelectedFactor(null);
      } else {
        showToast('BIOMETRIC_VERIFIED', 'success');
        onSuccess();
      }
    } else if (factor.factor_type === 'email') {
      // Custom Email OTP step-up
      setLoading(true);
      const { user } = useAuthStore.getState();
      if (!user?.email) {
        showToast('EMAIL_NOT_STAGED', 'error');
        setLoading(false);
        setSelectedFactor(null);
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: false }
      });
      setLoading(false);
      
      if (error) {
        showToast(error.message, 'error');
        setSelectedFactor(null);
      } else {
        showToast('OTP_SENT_TO_QUANTMIND_TERMINAL', 'success');
      }
    } else if (factor.factor_type === 'passkey') {
      // Custom Biometric step-up
      setLoading(true);
      const success = await biometricService.authenticate('MFA_AUTHORIZATION');
      setLoading(false);
      
      if (success) {
        showToast('IDENTITY_STABILIZED', 'success');
        onSuccess();
      } else {
        showToast('BIOMETRIC_FAILURE', 'error');
        setSelectedFactor(null);
      }
    }
  };

  const handleVerify = async () => {
    if (!selectedFactor || !code) return;
    
    setLoading(true);
    if (selectedFactor.factor_type === 'totp') {
      const { error } = await supabase.auth.mfa.verify({
        factorId: selectedFactor.id,
        challengeId: challengeId!,
        code
      });
      if (error) {
        showToast(error.message, 'error');
        setCode('');
      } else {
        showToast('MFA_VERIFIED', 'success');
        onSuccess();
      }
    } else if (selectedFactor.factor_type === 'email') {
      const { user } = useAuthStore.getState();
      if (!user?.email) return;
      const { error } = await supabase.auth.verifyOtp({
        email: user.email,
        token: code,
        type: 'email'
      });
      if (error) {
        showToast(error.message, 'error');
        setCode('');
      } else {
        showToast('SESSION_VALIDATED', 'success');
        onSuccess();
      }
    }
    setLoading(false);
  };

  const resetSelection = () => {
    setSelectedFactor(null);
    setChallengeId(null);
    setCode('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <GlassCard intensity="high" style={[styles.modalBox, { borderColor: theme.border }]}>
              <View style={styles.header}>
                {selectedFactor && (
                  <TouchableOpacity onPress={resetSelection} style={styles.backBtn}>
                    <BackIcon size={20} color={theme.textPrimary} />
                  </TouchableOpacity>
                )}
                <Typography variant="monoBold" style={[styles.title, { color: theme.textPrimary }]}>
                  {selectedFactor ? 'VERIFY_IDENTITY' : 'MFA_CHALLENGE'}
                </Typography>
                {!selectedFactor && <View style={{ width: 40 }} />}
              </View>

              <Typography variant="caption" style={[styles.subtitle, { color: theme.textSecondary }]}>
                {selectedFactor 
                  ? `Enter the code from your ${selectedFactor.friendly_name || 'authenticator app'}.`
                  : 'Select a secondary authentication factor to proceed.'}
              </Typography>

              {loading && !selectedFactor ? (
                <ActivityIndicator color={theme.primary} style={{ marginVertical: 40 }} />
              ) : !selectedFactor ? (
                <View style={styles.factorList}>
                  {factors.map(f => (
                    <TouchableOpacity 
                      key={f.id} 
                      style={[styles.factorItem, { backgroundColor: theme.border + '22', borderColor: theme.border }]}
                      onPress={() => handleFactorSelect(f)}
                    >
                      <View style={[styles.iconBox, { backgroundColor: theme.primary + '22' }]}>
                        {f.factor_type === 'totp' ? (
                          <SmartphoneIcon size={20} color={theme.primary} />
                        ) : f.factor_type === 'email' ? (
                          <MailIcon size={20} color={theme.primary} />
                        ) : (
                          <FingerprintIcon size={20} color={theme.primary} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="monoBold" style={{ fontSize: 13, color: theme.textPrimary }}>
                          {f.factor_type === 'totp' ? 'AUTHENTICATOR_APP' : f.factor_type === 'email' ? 'EMAIL_VERIFICATION' : 'BIOMETRIC_PASSKEY'}
                        </Typography>
                        <Typography variant="caption" style={{ fontSize: 10, color: theme.textTertiary }}>
                          {f.friendly_name || 'QUANTMIND_SECURE_TOKEN'}
                        </Typography>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {factors.length === 0 && !loading && (
                    <Typography variant="caption" style={{ textAlign: 'center', color: theme.error }}>
                      NO_VERIFIED_FACTORS_FOUND_FOR_THIS_ACCOUNT
                    </Typography>
                  )}
                </View>
              ) : (
                <View style={styles.verifySection}>
                  <TextInput
                    style={[styles.otpInput, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]}
                    placeholder="6-DIGIT_CODE"
                    placeholderTextColor={theme.textTertiary}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus
                  />
                  
                  <TouchableOpacity 
                    style={[styles.verifyBtn, { backgroundColor: theme.primary }]}
                    onPress={handleVerify}
                    disabled={loading || code.length < 6}
                  >
                    {loading ? (
                      <ActivityIndicator color={theme.background} />
                    ) : (
                      <>
                        <Typography variant="monoBold" style={{ color: theme.background }}>STABILIZE_SESSION</Typography>
                        <ZapIcon size={16} color={theme.background} style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
                <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10 }}>ABORT_AUTHENTICATION</Typography>
              </TouchableOpacity>
            </GlassCard>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  modalBox: {
    width: '100%',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
    flex: 1,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 11,
    lineHeight: 16,
  },
  factorList: {
    gap: 12,
    marginBottom: 24,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifySection: {
    width: '100%',
    gap: 20,
    marginBottom: 24,
  },
  otpInput: {
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'JetBrains Mono',
    letterSpacing: 8,
  },
  verifyBtn: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    alignSelf: 'center',
    marginTop: 8,
  },
});
