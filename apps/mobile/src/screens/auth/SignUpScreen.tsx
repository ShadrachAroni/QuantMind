import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../../services/supabase';
import { theme } from '../../constants/theme';
import { Typography } from '../../components/ui/Typography';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';

// A simple zxcvbn shim since we don't have the npm package installed in this task
function estimateStrength(password: string) {
  let score = 0;
  if (password.length > 8) score += 1;
  if (password.length > 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  return Math.min(4, score);
}

export function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  
  const score = password ? estimateStrength(password) : 0;

  const handleSignUp = async () => {
    if (!email || !password || !dob) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // Crude Age Verification (App Rules 10.1)
    const birthYear = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();
    if (isNaN(birthYear) || (currentYear - birthYear < 13)) {
      Alert.alert('Access Denied', 'You must be at least 13 years old to use QuantMind.');
      return;
    }

    if (score < 2) {
      Alert.alert('Security Notice', 'Please use a stronger password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Registration failed', error.message);
    } else {
      Alert.alert('Success', 'Check your email for the confirmation link.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Typography variant="h2" style={styles.title}>Operator Registration</Typography>
          <Typography variant="body" style={styles.subtitle}>Secure access provision</Typography>
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
            <Typography variant="caption" style={styles.label}>SECURE PASSPHRASE</Typography>
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor={theme.colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {password.length > 0 && <PasswordStrengthMeter score={score} />}
          </View>

          <View style={styles.inputGroup}>
            <Typography variant="caption" style={styles.label}>DATE OF BIRTH (YYYY-MM-DD)</Typography>
            <TextInput
              style={styles.input}
              placeholder="1990-01-01"
              placeholderTextColor={theme.colors.textTertiary}
              value={dob}
              onChangeText={setDob}
            />
            <Typography variant="caption" style={styles.helperText}>Required for compliance per App Rules §10.1.</Typography>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp} disabled={loading}>
            <Typography variant="button" style={styles.primaryButtonText}>PROVISION ACCESS</Typography>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Typography variant="caption">Existing operator? </Typography>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Typography variant="caption" style={styles.linkText}>Initialize Session</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <LoadingOverlay visible={loading} message="Provisioning..." />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fonts.mono,
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
  },
  helperText: {
    marginTop: 4,
    color: theme.colors.textTertiary,
    fontSize: 10,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
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
  linkText: {
    color: theme.colors.primary,
  },
});
