import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { supabase, getRedirectUrl } from '../../services/supabase';
import { Typography } from '../../components/ui/Typography';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { sharedTheme } from '../../constants/theme';
import { ChevronLeft, UserPlus, Check } from 'lucide-react-native';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  
  const report = password ? getPasswordSecurityReport(password) : { score: 0, isValid: false, errors: [] };
  const BackIcon = ChevronLeft as any;
  const UserPlusIcon = UserPlus as any;
  const CheckIcon = Check as any;

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !dob) {
      showToast('All parameters must be initialized.', 'error');
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

    // Crude Age Verification (App Rules 10.1)
    const birthYear = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();
    if (isNaN(birthYear) || (currentYear - birthYear < 13)) {
      showToast('Compliance failure: Operator age < 13.', 'error');
      return;
    }

    if (!report.isValid) {
      const firstError = report.errors[0].replace(/_/g, ' ');
      showToast(`COMPLIANCE_FAILURE: ${firstError}`, 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
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
    navigation.navigate('Login');
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
    <KeyboardAvoidingView 
      style={[dynamicStyles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
            <BackIcon size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>PROVISIONING_WORKFLOW_V2.1</Typography>
          <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>NEW_OPERATOR</Typography>
        </View>

        <View style={dynamicStyles.formContainer}>
          <View style={dynamicStyles.inputGroup}>
            <Typography variant="caption" style={[dynamicStyles.label, { color: theme.textTertiary }]}>OPERATOR_IDENTIFIER</Typography>
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
            <Typography variant="caption" style={[dynamicStyles.label, { color: theme.textTertiary }]}>SECURE_PASSPHRASE</Typography>
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
            <Typography variant="caption" style={[dynamicStyles.label, { color: theme.textTertiary }]}>CONFIRM_PASSPHRASE</Typography>
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
            <Typography variant="caption" style={[dynamicStyles.label, { color: theme.textTertiary }]}>DATE_OF_BIRTH (YYYY-MM-DD)</Typography>
            <View style={[dynamicStyles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
              <TextInput
                style={[dynamicStyles.input, { color: theme.textPrimary, fontFamily: sharedTheme.typography.fonts.mono }]}
                placeholder="1990-01-01"
                placeholderTextColor={theme.textTertiary}
                value={dob}
                onChangeText={setDob}
              />
            </View>
            <Typography variant="caption" style={[dynamicStyles.helperText, { color: theme.textTertiary }]}>Required for compliance per App Rules §10.1.</Typography>
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
              I accept the QuantMind Operating Protocol and Conditions of Use.
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
              <Typography variant="monoBold" style={[dynamicStyles.oauthBtnText, { color: theme.textPrimary }]}>GOOGLE</Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[dynamicStyles.oauthBtn, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}
              onPress={() => handleOAuthLogin('apple')}
            >
              <Typography variant="monoBold" style={[dynamicStyles.oauthBtnText, { color: theme.textPrimary }]}>APPLE_ID</Typography>
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.footerRow}>
            <Typography variant="caption" style={{ color: theme.textTertiary }}>Existing operator? </Typography>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Typography variant="mono" style={[dynamicStyles.linkText, { color: theme.primary }]}>Initialize Session</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <LoadingOverlay visible={loading} message="PROVISIONING_IDENT..." />
      
      <OTPVerificationModal 
        visible={showOtpModal}
        email={email}
        onVerify={handleVerifySuccess}
        onClose={() => setShowOtpModal(false)}
      />
    </KeyboardAvoidingView>
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
    paddingTop: 64,
  },
  header: {
    marginBottom: 40,
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
  formContainer: {
    gap: 8,
  },
  inputGroup: {
    marginBottom: 20,
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
    marginBottom: 40,
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
