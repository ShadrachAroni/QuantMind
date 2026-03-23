import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';
import { Typography } from '../../components/ui/Typography';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { ChevronLeft, ShieldCheck, ShieldAlert, Key, Copy, RefreshCw, Trash2 } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';

export function MFAScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [factors, setFactors] = useState<any[]>([]);

  const BackIcon = ChevronLeft as any;
  const ShieldCheckIcon = ShieldCheck as any;
  const ShieldAlertIcon = ShieldAlert as any;
  const KeyIcon = Key as any;
  const CopyIcon = Copy as any;
  const RefreshIcon = RefreshCw as any;
  const TrashIcon = Trash2 as any;

  useEffect(() => {
    fetchFactors();
  }, []);

  const fetchFactors = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      showToast('ERROR_FETCHING_FACTORS', 'error');
    } else {
      setFactors(data.all || []);
    }
    setLoading(false);
  };

  const startEnrollment = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'QuantMind'
      });

      if (error) throw error;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (err: any) {
      showToast(`ENROLLMENT_FAILED: ${err.message}`, 'error');
    } finally {
      setEnrolling(false);
    }
  };

  const verifyFactor = async () => {
    if (!factorId || !verifyCode) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode
      });

      if (error) throw error;

      showToast('MFA_PROVISIONED_SUCCESSFULLY', 'success');
      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      setVerifyCode('');
      fetchFactors();
    } catch (err: any) {
      showToast(`VERIFICATION_FAILED: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const unenrollFactor = async (id: string) => {
    Alert.alert(
      'DEPROVISION_MFA',
      'Are you sure? This reduces protocol security level.',
      [
        { text: 'ABORT', style: 'cancel' },
        { 
          text: 'PROCEED', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
            if (error) showToast(error.message, 'error');
            else fetchFactors();
          }
        }
      ]
    );
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    showToast('SECRET_COPIED_TO_BUFFER', 'success');
  };

  if (loading && factors.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: theme.border }]}>
            <BackIcon size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10, letterSpacing: 2 }}>SECURITY_PROTOCOL // MFA</Typography>
          <Typography variant="h2" style={{ color: theme.textPrimary, marginTop: 4 }}>ENCRYPTION_KERNEL</Typography>
        </View>

        {factors.length > 0 ? (
          <View style={styles.section}>
            <View style={[styles.statusBanner, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
              <ShieldCheckIcon size={24} color={theme.primary} />
              <View style={styles.bannerText}>
                <Typography variant="monoBold" style={{ color: theme.primary, fontSize: 12 }}>STATUS: PROTOCOL_ACTIVE</Typography>
                <Typography variant="caption" style={{ color: theme.textSecondary }}>Multi-factor authentication is currently operational.</Typography>
              </View>
            </View>

            <Typography variant="mono" style={styles.label}>ACTIVE_FACTORS</Typography>
            {factors.map(f => (
              <View key={f.id} style={[styles.factorCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
                <View style={styles.factorInfo}>
                  <KeyIcon size={18} color={theme.textPrimary} />
                  <View style={{ marginLeft: 12 }}>
                    <Typography variant="mono" style={{ color: f.status === 'verified' ? theme.success : theme.warning }}>{f.friendly_name || 'TOTP_AUTHENTICATOR'}</Typography>
                    <Typography variant="caption" style={{ color: theme.textTertiary }}>ID: {f.id.substring(0, 8).toUpperCase()}</Typography>
                  </View>
                </View>
                <TouchableOpacity onPress={() => unenrollFactor(f.id)}>
                  <TrashIcon size={18} color={theme.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          !qrCode && (
            <View style={styles.section}>
              <View style={[styles.statusBanner, { backgroundColor: theme.warning + '10', borderColor: theme.warning + '30' }]}>
                <ShieldAlertIcon size={24} color={theme.warning} />
                <View style={styles.bannerText}>
                  <Typography variant="monoBold" style={{ color: theme.warning, fontSize: 12 }}>STATUS: EXPOSED</Typography>
                  <Typography variant="caption" style={{ color: theme.textSecondary }}>Account is currently operating under single-factor access.</Typography>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.enrollBtn, { backgroundColor: theme.primary }]}
                onPress={startEnrollment}
                disabled={enrolling}
              >
                {enrolling ? <ActivityIndicator color={theme.background} /> : (
                  <>
                    <Typography variant="monoBold" style={{ color: theme.background }}>PROVISION_TOTP</Typography>
                    <RefreshIcon size={16} color={theme.background} style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )
        )}

        {qrCode && (
          <View style={[styles.qrContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
            <Typography variant="monoBold" style={styles.qrTitle}>NEW_TOTP_KEY_DETECTED</Typography>
            <View style={styles.qrWrapper}>
              <QRCode value={qrCode} size={180} backgroundColor={theme.background} color={theme.textPrimary} />
            </View>
            
            <View style={styles.secretBox}>
              <Typography variant="caption" style={{ color: theme.textTertiary }}>MANUAL_SECRET</Typography>
              <View style={styles.secretRow}>
                <Typography variant="mono" style={{ color: theme.textSecondary, flex: 1 }}>{secret}</Typography>
                <TouchableOpacity onPress={() => secret && copyToClipboard(secret)}>
                  <CopyIcon size={16} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.verifySection}>
              <Typography variant="mono" style={styles.label}>INITIAL_CHALLENGE</Typography>
              <TextInput
                style={[styles.otpInput, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]}
                placeholder="6-DIGIT_OTP"
                placeholderTextColor={theme.textTertiary}
                value={verifyCode}
                onChangeText={setVerifyCode}
                keyboardType="numeric"
                maxLength={6}
              />
              <TouchableOpacity 
                style={[styles.verifyBtn, { backgroundColor: theme.primary }]}
                onPress={verifyFactor}
              >
                <Typography variant="monoBold" style={{ color: theme.background }}>SUBMIT_CHALLENGE</Typography>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingTop: 64,
  },
  header: {
    marginBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  section: {
    gap: 20,
  },
  statusBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 12,
  },
  factorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  factorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enrollBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 24,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 24,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 24,
  },
  secretBox: {
    width: '100%',
    gap: 8,
    marginBottom: 24,
  },
  secretRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    gap: 12,
  },
  verifySection: {
    width: '100%',
    gap: 12,
  },
  otpInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'JetBrains Mono',
    letterSpacing: 4,
  },
  verifyBtn: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
