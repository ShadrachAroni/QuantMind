import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Dimensions, Animated, ScrollView } from 'react-native';
import { supabase, getRedirectUrl } from '../../services/supabase';
import { Typography } from '../../components/ui/Typography';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { Canvas, LinearGradient, Rect, vec, BlurMask, Circle } from '@shopify/react-native-skia';
import { ShieldCheck, Cpu, Terminal, Zap, Fingerprint } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAuthStore } from '../../store/authStore';
import { sharedTheme } from '../../constants/theme';

import { OTPVerificationModal } from '../../components/auth/OTPVerificationModal';

const { width, height } = Dimensions.get('window');

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const { isBiometricEnabled, biometricLogin } = useAuthStore();
  
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(20)).current;

  const ShieldIcon = ShieldCheck as any;
  const CpuIcon = Cpu as any;
  const TerminalIcon = Terminal as any;
  const ZapIcon = Zap as any;
  const AuthIcon = Fingerprint as any;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(formSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

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
      showToast('SESSION_INITIALIZED', 'success');
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
      showToast('OAUTH_REDIRECT_INITIATED', 'info');
    }
  };

  const dynamicStyles = getStyles(theme, isDark);

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      {/* Dynamic Background */}
      <View style={StyleSheet.absoluteFill}>
        <Canvas style={{ flex: 1 }}>
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={isDark ? ['#05060B', '#0F111A', '#05060B'] : [theme.background, theme.surface, theme.background]}
            />
          </Rect>
          <Circle cx={width * 0.8} cy={height * 0.2} r={100} color={theme.primary + '08'}>
            <BlurMask blur={50} style="normal" />
          </Circle>
          <Circle cx={width * 0.2} cy={height * 0.8} r={150} color={theme.secondary + '08'}>
            <BlurMask blur={80} style="normal" />
          </Circle>
        </Canvas>
      </View>

      <KeyboardAvoidingView 
        style={dynamicStyles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={[dynamicStyles.header, { opacity: logoOpacity }]}>
            <View style={dynamicStyles.logoWrapper}>
              <GlowEffect color={theme.primary} size={100} glowRadius={50} style={dynamicStyles.mainGlow} />
              <View style={[dynamicStyles.logoDiamond, { borderColor: theme.primary + '4D', backgroundColor: theme.primary + '0D' }]}>
                 <ShieldIcon size={32} color={theme.primary} />
              </View>
            </View>
            
            <Typography variant="h0" style={[dynamicStyles.brandTitle, { color: theme.textPrimary }]}>QUANTMIND</Typography>
            <View style={[dynamicStyles.versionBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
               <Typography variant="mono" style={[dynamicStyles.versionText, { color: theme.textSecondary }]}>OS_V1.0.4 // CORE_STABLE</Typography>
            </View>
          </Animated.View>

          <Animated.View style={{ transform: [{ translateY: formSlide }] }}>
            <GlassCard intensity="high" style={[dynamicStyles.formCard, { borderColor: theme.border }]}>
              <View style={dynamicStyles.cardHeader}>
                <AuthIcon size={16} color={theme.textSecondary} />
                <Typography variant="monoBold" style={[dynamicStyles.cardTitle, { color: theme.textSecondary }]}>SECURE_LOGIN</Typography>
              </View>

              <View style={dynamicStyles.inputSection}>
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
                  <Typography variant="caption" style={[dynamicStyles.label, { color: theme.textTertiary }]}>ACCESS_KEY</Typography>
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
                <Typography variant="mono" style={[dynamicStyles.linkText, { color: theme.primary }]}>RECOVER_ACCESS</Typography>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[dynamicStyles.submitBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]} 
                onPress={handleLogin} 
                disabled={loading}
                activeOpacity={0.8}
              >
                <Typography variant="monoBold" style={[dynamicStyles.submitText, { color: theme.background }]}>INITIALIZE_SESSION</Typography>
                <ZapIcon size={16} color={theme.background} style={dynamicStyles.zapIcon} />
              </TouchableOpacity>

              {isBiometricEnabled && (
                <TouchableOpacity 
                  style={[dynamicStyles.biometricBtn, { borderColor: theme.primary + '4D' }]} 
                  onPress={biometricLogin}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <AuthIcon size={20} color={theme.primary} />
                  <Typography variant="mono" style={[dynamicStyles.biometricText, { color: theme.primary }]}>BIOMETRIC_ACCESS</Typography>
                </TouchableOpacity>
              )}

              <View style={dynamicStyles.dividerRow}>
                <View style={[dynamicStyles.dividerLine, { backgroundColor: theme.border }]} />
                <Typography variant="mono" style={[dynamicStyles.dividerText, { color: theme.textTertiary }]}>OR_AUTHENTICATE_VIA</Typography>
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

              <View style={dynamicStyles.signupRow}>
                <Typography variant="caption" style={[dynamicStyles.noAccountText, { color: theme.textTertiary }]}>NEW_OPERATOR? </Typography>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                  <Typography variant="mono" style={[dynamicStyles.signupLink, { color: theme.primary }]}>REQUEST_PROVISIONING</Typography>
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
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  mainGlow: {
    position: 'absolute',
    opacity: 0.4,
  },
  logoDiamond: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
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
