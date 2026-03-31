import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Dimensions, 
  ScrollView, 
  Image 
} from 'react-native';
import { supabase, getRedirectUrl } from '../../services/supabase';
import { Typography } from '../../components/ui/Typography';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { ShieldCheck, Cpu, Terminal, Zap, Fingerprint } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAuthStore } from '../../store/authStore';
import { sharedTheme } from '../../constants/theme';
import Animated, { 
  FadeInUp, 
  FadeIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence, 
  Easing 
} from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { hexToRgba } from '../../utils/themeUtils';

import { OTPVerificationModal } from '../../components/auth/OTPVerificationModal';
import { MFAChallengeModal } from '../../components/auth/MFAChallengeModal';
import { biometricService } from '../../services/biometric';

const { width, height } = Dimensions.get('window');

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const { isBiometricEnabled, biometricLogin, setUser, aal } = useAuthStore();

  // Modern Reanimated 3 Shared Values
  const pulseScale = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(20);

  useEffect(() => {
    // Dynamic "Neural Pulse" Background Animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Initial Transition
    logoOpacity.value = withTiming(1, { duration: 1000 });
    formTranslateY.value = withTiming(0, { duration: 800 });
  }, []);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  const animatedFormStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
  }));

  const ShieldIcon = ShieldCheck as any;
  const CpuIcon = Cpu as any;
  const TerminalIcon = Terminal as any;
  const ZapIcon = Zap as any;
  const AuthIcon = Fingerprint as any;

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please provide operator credentials.', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        showToast('IDENTITY_UNVERIFIED: Please complete OTP verification.', 'error');
        setTimeout(() => setShowOtpModal(true), 2000);
      } else {
        showToast(error.message.toUpperCase(), 'error');
      }
    } else {
      // Ensure profile context is loaded for MFA flag checks
      const authStore = useAuthStore.getState();
      await authStore.initialize();
      
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { mfaEmailEnabled, mfaPasskeyEnabled } = authStore;

      const requiresMfa = (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') || 
                          ((mfaEmailEnabled || mfaPasskeyEnabled) && aalData?.currentLevel === 'aal1');

      if (requiresMfa) {
        setShowMfaModal(true);
      } else {
        showToast('SESSION_INITIALIZED', 'success');
      }
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      const success = await biometricService.authenticate('BIOMETRIC_LOGIN');
      if (success) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Ensure profile context is loaded for MFA flag checks
          const authStore = useAuthStore.getState();
          await authStore.initialize();
          
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          const { mfaEmailEnabled, mfaPasskeyEnabled } = authStore;

          const requiresMfa = (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') || 
                              ((mfaEmailEnabled || mfaPasskeyEnabled) && aalData?.currentLevel === 'aal1');

          if (requiresMfa) {
             setShowMfaModal(true);
          } else {
            showToast('BIOMETRIC_SESSION_STABILIZED', 'success');
          }
        }
      } else {
        showToast('BIOMETRIC_AUTH_FAILED', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'BIOMETRIC_FAILURE', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectUrl(),
      },
    });
    setLoading(false);

    if (error) {
      showToast(error.message.toUpperCase(), 'error');
    } else {
      showToast('OAUTH REDIRECT INITIATED', 'info');
    }
  };

  const dynamicStyles = getStyles(theme, isDark);

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <StatusBar hidden={true} translucent={true} />
      
      {/* Dynamic Quantum Pulse Background Layer */}
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, animatedBackgroundStyle]}>
          <ExpoImage
            source={require('../../../assets/onboarding/preauth_bg_quantum.png')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={1000}
          />
        </Animated.View>
      </View>

      {/* Depth & Contrast Overlay */}
      <LinearGradient
        colors={[
          hexToRgba(theme.background, 0.7), 
          hexToRgba(theme.background, 0.85), 
          hexToRgba(theme.background, 0.95)
        ]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.45, 0.9]}
      />

      <KeyboardAvoidingView
        style={dynamicStyles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={[dynamicStyles.header, animatedLogoStyle]}>
            <View style={dynamicStyles.logoWrapper}>
              <Image
                source={require('../../../assets/icon.png')}
                style={{ width: 180, height: 180 }}
                resizeMode="contain"
              />
            </View>

            <Typography variant="h0" style={[dynamicStyles.brandTitle, { color: theme.textPrimary }]}>QUANTMIND</Typography>
            <View style={[dynamicStyles.versionBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
              <Typography variant="mono" style={[dynamicStyles.versionText, { color: theme.textSecondary }]}>OS_V1.0.4 // CORE_STABLE</Typography>
            </View>
          </Animated.View>

          <Animated.View style={animatedFormStyle}>
            <GlassCard intensity="high" style={[dynamicStyles.formCard, { borderColor: theme.border }]}>
              <View style={dynamicStyles.cardHeader}>
                <AuthIcon size={16} color={theme.textSecondary} />
                <Typography variant="monoBold" style={[dynamicStyles.cardTitle, { color: theme.textSecondary }]}>SECURE LOGIN</Typography>
              </View>

              <View style={dynamicStyles.inputSection}>
                <View style={dynamicStyles.inputGroup}>
                  <Typography variant="caption" style={[dynamicStyles.label, { color: theme.textTertiary }]}>OPERATOR IDENTIFIER</Typography>
                  <View style={[dynamicStyles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
                    <TextInput
                      style={[dynamicStyles.input, { color: theme.textPrimary, fontFamily: sharedTheme.typography.fonts.mono }]}
                      placeholder="operator@quantmind.io"
                      placeholderTextColor={theme.textTertiary}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={dynamicStyles.inputGroup}>
                  <Typography variant="caption" style={[dynamicStyles.label, { color: theme.textTertiary }]}>ACCESS KEY</Typography>
                  <View style={[dynamicStyles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
                    <TextInput
                      style={[dynamicStyles.input, { color: theme.textPrimary, fontFamily: sharedTheme.typography.fonts.mono }]}
                      placeholder="••••••••"
                      placeholderTextColor={theme.textTertiary}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity style={dynamicStyles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
                <Typography variant="mono" style={[dynamicStyles.linkText, { color: theme.primary }]}>RECOVER ACCESS</Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  dynamicStyles.submitBtn,
                  {
                    backgroundColor: theme.primary,
                    ...Platform.select({
                      web: { boxShadow: `0 8px 15px ${theme.primary}4D` },
                      default: { shadowColor: theme.primary }
                    })
                  }
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Typography variant="monoBold" style={[dynamicStyles.submitText, { color: theme.background }]}>INITIALIZE SESSION</Typography>
                <ZapIcon size={16} color={theme.background} style={dynamicStyles.zapIcon} />
              </TouchableOpacity>

              {isBiometricEnabled && (
                <TouchableOpacity
                  style={[dynamicStyles.biometricBtn, { borderColor: theme.primary + '4D' }]}
                  onPress={handleBiometricLogin}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={require('../../../assets/biometrics.png')} 
                    style={{ width: 20, height: 20 }} 
                    resizeMode="contain"
                  />
                  <Typography variant="mono" style={[dynamicStyles.biometricText, { color: theme.primary }]}>BIOMETRIC ACCESS</Typography>
                </TouchableOpacity>
              )}

              <View style={dynamicStyles.dividerRow}>
                <View style={[dynamicStyles.dividerLine, { backgroundColor: theme.border }]} />
                <Typography variant="mono" style={[dynamicStyles.dividerText, { color: theme.textTertiary }]}>OR AUTHENTICATE VIA</Typography>
                <View style={[dynamicStyles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              <View style={dynamicStyles.oauthRow}>
                <TouchableOpacity
                  style={[dynamicStyles.oauthBtn, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}
                  onPress={() => handleOAuthLogin('google')}
                >
                  <Image 
                    source={require('../../../assets/google.png')} 
                    style={{ width: 18, height: 18, marginRight: 8 }} 
                    resizeMode="contain"
                  />
                  <Typography variant="monoBold" style={[dynamicStyles.oauthBtnText, { color: theme.textPrimary }]}>GOOGLE</Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[dynamicStyles.oauthBtn, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}
                  onPress={() => handleOAuthLogin('apple')}
                >
                  <Image 
                    source={require('../../../assets/apple.png')} 
                    style={{ width: 18, height: 18, marginRight: 8 }} 
                    resizeMode="contain"
                  />
                  <Typography variant="monoBold" style={[dynamicStyles.oauthBtnText, { color: theme.textPrimary }]}>APPLE</Typography>
                </TouchableOpacity>
              </View>

              <View style={dynamicStyles.signupRow}>
                <Typography variant="caption" style={[dynamicStyles.noAccountText, { color: theme.textTertiary }]}>NEW OPERATOR? </Typography>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                  <Typography variant="mono" style={[dynamicStyles.signupLink, { color: theme.primary }]}>REQUEST PROVISIONING</Typography>
                </TouchableOpacity>
              </View>
            </GlassCard>

            <View style={dynamicStyles.systemMeta}>
              <View style={dynamicStyles.metaItem}>
                <CpuIcon size={12} color={theme.textTertiary} />
                <Typography variant="mono" style={[dynamicStyles.metaText, { color: theme.textTertiary }]}>M1_ULTRA_COMPATIBLE</Typography>
              </View>
              <View style={dynamicStyles.metaItem}>
                <TerminalIcon size={12} color={theme.textTertiary} />
                <Typography variant="mono" style={[dynamicStyles.metaText, { color: theme.textTertiary }]}>AES_256_ENCRYPTED</Typography>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading} message="SYNCHRONIZING_BIOMETRICS..." />

      <OTPVerificationModal
        visible={showOtpModal}
        email={email}
        onVerify={() => setShowOtpModal(false)}
        onClose={() => setShowOtpModal(false)}
      />

      <MFAChallengeModal
        visible={showMfaModal}
        onSuccess={() => {
          setShowMfaModal(false);
          showToast('MFA_SECURITY_PASSED', 'success');
        }}
        onCancel={() => {
          setShowMfaModal(false);
          supabase.auth.signOut();
        }}
      />
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    letterSpacing: 8,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  versionText: {
    fontSize: 8,
    letterSpacing: 2,
  },
  formCard: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
    opacity: 0.7,
  },
  cardTitle: {
    fontSize: 10,
    letterSpacing: 2,
  },
  inputSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 9,
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1,
  },
  input: {
    padding: 16,
    fontSize: 13,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 16,
    marginBottom: 32,
  },
  linkText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  submitBtn: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 8px 15px rgba(0, 0, 0, 0.3)',
      }
    }),
  },
  submitText: {
    fontSize: 14,
    letterSpacing: 1,
  },
  zapIcon: {
    opacity: 0.8,
  },
  biometricBtn: {
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  biometricText: {
    fontSize: 10,
    letterSpacing: 2,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  noAccountText: {
    fontSize: 10,
  },
  signupLink: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.2,
  },
  dividerText: {
    fontSize: 8,
    letterSpacing: 1.5,
    opacity: 0.5,
  },
  oauthRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  oauthBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  oauthBtnText: {
    fontSize: 10,
    letterSpacing: 2,
  },
  systemMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 40,
    opacity: 0.4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 8,
    letterSpacing: 1,
  },
});
