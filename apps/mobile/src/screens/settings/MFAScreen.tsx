import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Switch, Image } from 'react-native';
import { supabase } from '../../services/supabase';
import { Typography } from '../../components/ui/Typography';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { 
  ChevronLeft, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Copy, 
  RefreshCw, 
  Trash2, 
  Mail, 
  Fingerprint,
  Smartphone
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { sharedTheme } from '../../constants/theme';

export function MFAScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const { 
    mfaEmailEnabled, 
    mfaPasskeyEnabled, 
    updateMFAEmail, 
    updateMFAPasskey,
    isBiometricSupported,
    isBiometricEnabled,
    enrollBiometrics
  } = useAuthStore();
  
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
  const MailIcon = Mail as any;
  const FingerprintIcon = Fingerprint as any;
  const SmartphoneIcon = Smartphone as any;

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
  
  const handleTogglePasskey = async (enabled: boolean) => {
    if (enabled) {
      const success = await enrollBiometrics();
      if (success) {
        try {
          await updateMFAPasskey(true);
          showToast('BIOMETRIC_PASSKEY_REINFORCED', 'success');
        } catch (err) {
          showToast('PROFILE_SYNC_FAILURE', 'error');
        }
      } else {
        showToast('BIOMETRIC_ENROLLMENT_CANCELLED', 'info');
      }
    } else {
      try {
        await updateMFAPasskey(false);
        showToast('BIOMETRIC_PASSKEY_DEACTIVATED', 'info');
      } catch (err) {
        showToast('PROFILE_SYNC_FAILURE', 'error');
      }
    }
  };

  const isMFAActive = factors.length > 0 || mfaEmailEnabled || mfaPasskeyEnabled;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
            <BackIcon size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10, letterSpacing: 2 }}>SECURITY_PROTOCOL // MFA</Typography>
          <Typography variant="h1" style={{ color: theme.textPrimary, marginTop: 4, letterSpacing: 1 }}>AUTH_REINFORCEMENT</Typography>
        </View>

        <View style={[styles.statusBanner, { 
          backgroundColor: isMFAActive ? theme.primary + '10' : theme.warning + '10', 
          borderColor: isMFAActive ? theme.primary + '30' : theme.warning + '30' 
        }]}>
          {isMFAActive ? <ShieldCheckIcon size={24} color={theme.primary} /> : <ShieldAlertIcon size={24} color={theme.warning} />}
          <View style={styles.bannerText}>
            <Typography variant="monoBold" style={{ color: isMFAActive ? theme.primary : theme.warning, fontSize: 12 }}>
              STATUS: {isMFAActive ? 'REINFORCED_ACTIVE' : 'EXPOSED_SINGLE_FACTOR'}
            </Typography>
            <Typography variant="caption" style={{ color: theme.textSecondary }}>
              {isMFAActive ? 'Multi-layered authentication is active.' : 'Account protection is below institutional standards.'}
            </Typography>
          </View>
        </View>

        <Typography variant="mono" style={[styles.sectionLabel, { color: theme.textTertiary }]}>// AUTHENTICATION_PILLARS</Typography>
        
        <GlassCard style={styles.pillarCard}>
          <MFAOption 
            icon={SmartphoneIcon}
            title="TOTP Authenticator"
            subtitle="Google / Authy / Microsoft"
            active={factors.length > 0}
            onPress={() => {
              if (factors.length === 0 && !qrCode) startEnrollment();
              else if (factors.length > 0) showToast('TOTP_ALREADY_ACTIVE', 'info');
            }}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.border + '22' }]} />
          <MFAOptionToggle 
            icon={MailIcon}
            title="Email OTP"
            subtitle="Instant secondary verification"
            value={mfaEmailEnabled}
            onValueChange={updateMFAEmail}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.border + '22' }]} />
          <MFAOptionToggle 
            imageSource={require('../../../assets/biometrics.png')}
            title="Biometric Passkey"
            subtitle="Secure enclave verification"
            value={mfaPasskeyEnabled}
            onValueChange={handleTogglePasskey}
            theme={theme}
            disabled={!isBiometricSupported}
            statusLabel={!isBiometricSupported ? '[INCOMPATIBLE_HARDWARE]' : (!isBiometricEnabled ? '[NO_BIOMETRICS_ENROLLED]' : undefined)}
          />
        </GlassCard>

        {factors.length > 0 && (
          <>
            <Typography variant="mono" style={[styles.sectionLabel, { color: theme.textTertiary }]}>// ACTIVE_HARDWARE_TOKENS</Typography>
            {factors.map(f => (
              <GlassCard key={f.id} style={styles.factorCard}>
                <View style={styles.factorInfo}>
                  <KeyIcon size={18} color={theme.primary} />
                  <View style={{ marginLeft: 16 }}>
                    <Typography variant="mono" style={{ color: theme.textPrimary, fontSize: 13 }}>{f.friendly_name || 'QUANTMIND_HUB'}</Typography>
                    <Typography variant="caption" style={{ color: theme.textTertiary }}>PROVISIONED: {f.id.substring(0, 12).toUpperCase()}</Typography>
                  </View>
                </View>
                <TouchableOpacity onPress={() => unenrollFactor(f.id)} style={styles.deleteBtn}>
                  <TrashIcon size={16} color={theme.error} />
                </TouchableOpacity>
              </GlassCard>
            ))}
          </>
        )}

        {enrolling && <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />}

        {qrCode && (
          <GlassCard intensity="high" style={styles.qrContainer}>
            <Typography variant="monoBold" style={styles.qrTitle}>PROVISION_NEW_TOKEN</Typography>
            <View style={styles.qrWrapper}>
              <QRCode value={qrCode} size={160} backgroundColor="#FFFFFF" color="#000000" />
            </View>
            
            <View style={styles.secretBox}>
              <Typography variant="caption" style={{ color: theme.textTertiary, fontSize: 9 }}>MANUAL_INTEGRATION_KEY</Typography>
              <View style={[styles.secretRow, { backgroundColor: theme.border + '22' }]}>
                <Typography variant="mono" style={{ color: theme.textSecondary, flex: 1, fontSize: 11 }}>{secret}</Typography>
                <TouchableOpacity onPress={() => secret && copyToClipboard(secret)}>
                  <CopyIcon size={14} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.verifySection}>
              <Typography variant="mono" style={[styles.sectionLabel, { color: theme.textTertiary }]}>CHALLENGE_VERIFICATION</Typography>
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
                <Typography variant="monoBold" style={{ color: theme.background }}>STABILIZE_FACTOR</Typography>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setQrCode(null); setSecret(null); }} style={{ alignSelf: 'center', marginTop: 12 }}>
                <Typography variant="caption" style={{ color: theme.textTertiary }}>ABORT_PROVISIONING</Typography>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function MFAOption({ icon: Icon, title, subtitle, active, onPress, theme }: any) {
  return (
    <TouchableOpacity style={styles.mfaOption} onPress={onPress}>
      <View style={[styles.optionIcon, { backgroundColor: active ? theme.primary + '22' : theme.background + '44', borderColor: theme.border }]}>
        <Icon size={18} color={active ? theme.primary : theme.textTertiary} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="monoBold" style={{ fontSize: 12, color: theme.textPrimary }}>{title.toUpperCase()}</Typography>
        <Typography variant="caption" style={{ fontSize: 9, color: theme.textTertiary }}>{subtitle}</Typography>
      </View>
      <View style={[styles.activeStatus, { backgroundColor: active ? theme.success + '22' : 'transparent', borderColor: active ? theme.success + '44' : theme.border }]}>
        <Typography variant="mono" style={{ color: active ? theme.success : theme.textTertiary, fontSize: 8 }}>{active ? 'ACTIVE' : 'INACTIVE'}</Typography>
      </View>
    </TouchableOpacity>
  );
}

function MFAOptionToggle({ icon: Icon, imageSource, title, subtitle, value, onValueChange, theme, disabled, statusLabel }: any) {
  return (
    <View style={[styles.mfaOption, disabled && { opacity: 0.5 }]}>
      <View style={[styles.optionIcon, { backgroundColor: value ? theme.primary + '22' : theme.background + '44', borderColor: theme.border }]}>
        {imageSource ? (
          <Image source={imageSource} style={{ width: 18, height: 18 }} resizeMode="contain" />
        ) : (
          <Icon size={18} color={value ? theme.primary : theme.textTertiary} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="monoBold" style={{ fontSize: 12, color: theme.textPrimary }}>{title.toUpperCase()}</Typography>
        <Typography variant="caption" style={{ fontSize: 9, color: theme.textTertiary }}>{subtitle}</Typography>
        {statusLabel && (
          <Typography variant="mono" style={{ fontSize: 8, color: theme.error, marginTop: 4 }}>{statusLabel}</Typography>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={value ? '#FFF' : '#475569'}
        ios_backgroundColor={theme.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingTop: 64 },
  header: { marginBottom: 32 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  statusBanner: { flexDirection: 'row', padding: 18, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 16, marginBottom: 32 },
  bannerText: { flex: 1, gap: 2 },
  sectionLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
  pillarCard: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, marginBottom: 32 },
  mfaOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 16 },
  optionIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  activeStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  divider: { height: 1, width: '100%' },
  factorCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  factorInfo: { flexDirection: 'row', alignItems: 'center' },
  deleteBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qrContainer: { padding: 24, borderRadius: 24, marginTop: 12, alignItems: 'center' },
  qrTitle: { fontSize: 12, letterSpacing: 2, marginBottom: 24 },
  qrWrapper: { padding: 12, backgroundColor: '#FFF', borderRadius: 16, marginBottom: 24 },
  secretBox: { width: '100%', gap: 8, marginBottom: 24 },
  secretRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 12 },
  verifySection: { width: '100%', gap: 12 },
  otpInput: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, textAlign: 'center', fontSize: 20, fontFamily: 'JetBrains Mono', letterSpacing: 6 },
  verifyBtn: { height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#00D4FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
});
