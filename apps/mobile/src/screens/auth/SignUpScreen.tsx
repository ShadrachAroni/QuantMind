import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image
} from 'react-native';
import { supabase, getRedirectUrl } from '../../services/supabase';
import { Typography } from '../../components/ui/Typography';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { GlassCard } from '../../components/ui/GlassCard';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { sharedTheme } from '../../constants/theme';
import { ChevronLeft, UserPlus, Check } from 'lucide-react-native';
import Animated, {
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

const { width } = Dimensions.get('window');

import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';
import { adjacencyGraphs } from '@zxcvbn-ts/language-common';

const options = {
  translations: zxcvbnEnPackage.translations,
  graphs: adjacencyGraphs,
  dictionary: {
    commonWords: zxcvbnEnPackage.dictionary.commonWords,
    firstnames: zxcvbnEnPackage.dictionary.firstnames,
    lastnames: zxcvbnEnPackage.dictionary.lastnames,
    userInput: [],
  },
};
zxcvbnOptions.setOptions(options);

function getPasswordSecurityReport(password: string) {
  const result = zxcvbn(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isLongEnough = password.length >= 12;

  const errors = [];
  if (!isLongEnough) errors.push('MIN_LENGTH_12_REQUIRED');
  if (!hasUpperCase || !hasLowerCase) errors.push('MIXED_CASE_REQUIRED');
  if (!hasNumber) errors.push('NUMERIC_DIGIT_REQUIRED');
  if (!hasSpecial) errors.push('SPECIAL_CHARACTER_REQUIRED');
  if (result.score < 3 && password.length > 0) errors.push('ENTROPY_TOO_LOW');

  return {
    score: result.score,
    isValid: errors.length === 0,
    errors,
    feedback: result.feedback
  };
}

export function SignUpScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();

  const report = password ? getPasswordSecurityReport(password) : { score: 0, isValid: false, errors: [] };
  const BackIcon = ChevronLeft as any;
  const UserPlusIcon = UserPlus as any;
  const CheckIcon = Check as any;

  // Dynamic "Neural Pulse" Animation for the background
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    if (!phone) return true; // Nullable/Optional
    return /^\+?[0-9]{10,15}$/.test(phone);
  };

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      showToast('Mandatory parameters must be initialized.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showToast('INVALID IDENTIFIER FORMAT: Email check failed.', 'error');
      return;
    }

    if (phone && !validatePhone(phone)) {
      showToast('INVALID COMM LINK FORMAT: Phone check failed.', 'error');
      return;
    }

    if (!tosAccepted) {
      showToast('You must acknowledge the Operating Protocol.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Secure passphrases do not match.', 'error');
      return;
    }

    if (!report.isValid) {
      const firstError = report.errors[0].replace(/_/g, ' ');
      showToast(`COMPLIANCE FAILURE: ${firstError}`, 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phone || null,
        }
      }
    });
    setLoading(false);

    if (error) {
      showToast(error.message.toUpperCase(), 'error');
    } else {
      showToast('PROVISIONING_INITIATED: Verify OTP.', 'success');
      setShowOtpModal(true);
    }
  };

  const handleVerifySuccess = () => {
    setShowOtpModal(false);
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
        style={dynamicStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
          <View style={dynamicStyles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
              <BackIcon size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>PROVISIONING_WORKFLOW_V2.1</Typography>
            <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>NEW OPERATOR</Typography>
          </View>

          <GlassCard intensity="high" style={[dynamicStyles.formCard, { borderColor: theme.border }]}>
            <View style={dynamicStyles.formContainer}>
              <View style={dynamicStyles.inputRow}>
                <View style={[dynamicStyles.inputGroup, { flex: 1 }]}>
                  <Typography variant="caption" style={[dynamicStyles.label, { color: theme.textTertiary }]}>FIRST NAME</Typography>
                  <View style={[dynamicStyles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
                    <TextInput
                      style={[dynamicStyles.input, { color: theme.textPrimary, fontFamily: sharedTheme.typography.fonts.mono }]}
                      placeholder="JOHN"
                      placeholderTextColor={theme.textTertiary}
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                </View>
                <View style={[dynamicStyles.inputGroup, { flex: 1 }]}>
                  <Typography variant="caption" style={[dynamicStyles.label, { color: theme.textTertiary }]}>SECOND NAME</Typography>
                  <View style={[dynamicStyles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
                    <TextInput
                      style={[dynamicStyles.input, { color: theme.textPrimary, fontFamily: sharedTheme.typography.fonts.mono }]}
                      placeholder="DOE"
                      placeholderTextColor={theme.textTertiary}
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>
              </View>

              <View style={dynamicStyles.inputGroup}>
                <Typography variant="caption" style={[dynamicStyles.label, { color: theme.textTertiary }]}>EMAIL ADDRESS</Typography>
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
                <Typography variant="caption" style={[dynamicStyles.label, { color: theme.textTertiary }]}>SECURE PASSPHRASE</Typography>
                <View style={[dynamicStyles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
                  <TextInput
                    style={[dynamicStyles.input, { color: theme.textPrimary, fontFamily: sharedTheme.typography.fonts.mono }]}
                    placeholder="••••••••••••"
                    placeholderTextColor={theme.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
                {password.length > 0 && (
                  <View style={dynamicStyles.passwordFeedback}>
                    <PasswordStrengthMeter score={report.score} />
                    {report.errors.map((err) => (
                      <Typography key={err} variant="caption" style={{ color: theme.error, fontSize: 8, marginTop: 4 }}>
                        • {err}
                      </Typography>
                    ))}
                  </View>
                )}
              </View>

              <View style={dynamicStyles.inputGroup}>
                <Typography variant="caption" style={[dynamicStyles.label, { color: theme.textTertiary }]}>CONFIRM PASSPHRASE</Typography>
                <View style={[dynamicStyles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
                  <TextInput
                    style={[dynamicStyles.input, { color: theme.textPrimary, fontFamily: sharedTheme.typography.fonts.mono }]}
                    placeholder="••••••••••••"
                    placeholderTextColor={theme.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={dynamicStyles.inputGroup}>
                <Typography variant="caption" style={[dynamicStyles.label, { color: theme.textTertiary }]}>COMMUNICATION LINK (OPTIONAL)</Typography>
                <View style={[dynamicStyles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
                  <TextInput
                    style={[dynamicStyles.input, { color: theme.textPrimary, fontFamily: sharedTheme.typography.fonts.mono }]}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor={theme.textTertiary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
                <Typography variant="caption" style={[dynamicStyles.helperText, { color: theme.textTertiary }]}>Used for mission-critical alerts. Can be updated in settings.</Typography>
              </View>

              <TouchableOpacity
                style={dynamicStyles.tosRow}
                onPress={() => setTosAccepted(!tosAccepted)}
                activeOpacity={0.7}
              >
                <View style={[
                  dynamicStyles.checkbox,
                  { borderColor: tosAccepted ? theme.primary : theme.border, backgroundColor: tosAccepted ? theme.primary + '15' : 'transparent' }
                ]}>
                  {tosAccepted && <CheckIcon size={12} color={theme.primary} />}
                </View>
                <Typography variant="caption" style={[dynamicStyles.tosLabel, { color: theme.textSecondary }]}>
                  I acknowledge and accept the{" "}
                  <Typography
                    variant="caption"
                    style={{ color: theme.primary, textDecorationLine: 'underline' }}
                    onPress={() => navigation.navigate('TermsOfService')}
                  >
                    Operating Protocol
                  </Typography>
                  {" "}and{" "}
                  <Typography
                    variant="caption"
                    style={{ color: theme.primary, textDecorationLine: 'underline' }}
                    onPress={() => navigation.navigate('PrivacyPolicy')}
                  >
                    Conditions of Use
                  </Typography>.
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[dynamicStyles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Typography variant="monoBold" style={[dynamicStyles.primaryButtonText, { color: theme.background }]}>PROVISION_ACCESS</Typography>
                <UserPlusIcon size={16} color={theme.background} style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              <View style={dynamicStyles.dividerRow}>
                <View style={[dynamicStyles.dividerLine, { backgroundColor: theme.border }]} />
                <Typography variant="mono" style={[dynamicStyles.dividerText, { color: theme.textTertiary }]}>OR_PROVISION_VIA</Typography>
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
                  <Typography variant="monoBold" style={[dynamicStyles.oauthBtnText, { color: theme.textPrimary }]}>APPLE ID</Typography>
                </TouchableOpacity>
              </View>

              <View style={dynamicStyles.footerRow}>
                <Typography variant="caption" style={{ color: theme.textTertiary }}>Existing user? </Typography>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Typography variant="mono" style={[dynamicStyles.linkText, { color: theme.primary }]}>Initialize Session</Typography>
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading} message="PROVISIONING_IDENT..." />

      <OTPVerificationModal
        visible={showOtpModal}
        email={email}
        onVerify={handleVerifySuccess}
        onClose={() => setShowOtpModal(false)}
      />
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    paddingTop: 80,
  },
  header: {
    marginBottom: 40,
    marginTop: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 24,
  },
  subHeader: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    letterSpacing: 2,
  },
  formCard: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    marginBottom: 40,
  },
  formContainer: {
    gap: 8,
  },
  inputGroup: {
    marginBottom: 16,
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
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
  passwordFeedback: {
    marginTop: 8,
    gap: 4,
  },
  helperText: {
    marginTop: 4,
    fontSize: 10,
    marginLeft: 4,
  },
  primaryButton: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  primaryButtonText: {
    fontSize: 14,
    letterSpacing: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  linkText: {
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
  tosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
    gap: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tosLabel: {
    fontSize: 10,
    flex: 1,
  },
});
