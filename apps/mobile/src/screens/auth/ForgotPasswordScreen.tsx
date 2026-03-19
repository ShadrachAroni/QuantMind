import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { supabase } from '../../services/supabase';
import { theme } from '../../constants/theme';
import { Typography } from '../../components/ui/Typography';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'quantmind://auth/callback',
    });
    setLoading(false);

    // Always show success to prevent email enumeration (App Rules 10.2)
    Alert.alert(
      'Request Received', 
      'If this email exists in our system, a password reset link has been sent.',
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Typography variant="button" style={styles.backText}>← Back</Typography>
          </TouchableOpacity>
          <Typography variant="h2" style={styles.title}>Credential Recovery</Typography>
        </View>

        <View style={styles.formContainer}>
          <Typography variant="body" style={styles.instructions}>
            Enter your institution email address requested during registration.
          </Typography>

          <View style={styles.inputGroup}>
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

          <TouchableOpacity style={styles.primaryButton} onPress={handleReset} disabled={loading}>
            <Typography variant="button" style={styles.primaryButtonText}>REQUEST RESET</Typography>
          </TouchableOpacity>
        </View>
      </View>

      <LoadingOverlay visible={loading} message="Processing..." />
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
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    marginBottom: theme.spacing.md,
  },
  backText: {
    color: theme.colors.textSecondary,
  },
  title: {
    color: '#FFFFFF',
  },
  instructions: {
    marginBottom: theme.spacing.xl,
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputGroup: {
    marginBottom: theme.spacing.xl,
  },
  input: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.background,
    letterSpacing: 1,
    fontFamily: theme.typography.fonts.mono,
  },
});
