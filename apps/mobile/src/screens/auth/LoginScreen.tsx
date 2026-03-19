import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../services/supabase';
import { theme } from '../../constants/theme';
import { Typography } from '../../components/ui/Typography';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Login failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <View style={styles.logoInner} />
          </View>
          <Typography variant="h1" style={styles.title}>QuantMind</Typography>
          <Typography variant="body" style={styles.subtitle}>FX1 Institutional Terminal</Typography>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Typography variant="caption" style={styles.label}>EMAIL ADDRESS</Typography>
            <TextInput
              style={styles.input}
              placeholder="operator@institution.com"
              placeholderTextColor={theme.colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Typography variant="caption" style={styles.label}>PASSWORD</Typography>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
            <Typography variant="caption" style={styles.linkText}>Forgot Password?</Typography>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
            <Typography variant="button" style={styles.primaryButtonText}>INITIALIZE SESSION</Typography>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Typography variant="caption">New operator? </Typography>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Typography variant="caption" style={styles.linkText}>Request Access</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <LoadingOverlay visible={loading} message="Authenticating..." />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoInner: {
    width: 28,
    height: 28,
    backgroundColor: theme.colors.secondary,
    borderRadius: 6,
  },
  title: {
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fonts.mono,
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fonts.mono,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fonts.mono,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.xl,
  },
  linkText: {
    color: theme.colors.primary,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  primaryButtonText: {
    color: theme.colors.background,
    letterSpacing: 1,
    fontFamily: theme.typography.fonts.mono,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
