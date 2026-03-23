import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../services/supabase';
import { Typography } from '../../components/ui/Typography';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { ChevronLeft, Lock, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { zxcvbn } from '@zxcvbn-ts/core';

export function ChangePasswordScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const BackIcon = ChevronLeft as any;
  const LockIcon = Lock as any;

  const validatePassword = (pass: string) => {
    const result = zxcvbn(pass);
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    
    return {
      score: result.score,
      isValid: pass.length >= 12 && hasUpperCase && hasLowerCase && hasNumber && hasSpecial && result.score >= 3
    };
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast('All fields required.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passphrases do not match.', 'error');
      return;
    }

    const { isValid, score } = validatePassword(newPassword);
    if (!isValid) {
      showToast('Entropy too low. Follow protocol requirements.', 'error');
      return;
    }

    setLoading(true);
    // Note: currentPassword verification usually happens on the server or via a fresh login
    // In Supabase, updatePassword only takes the new password if the user is logged in
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    setLoading(false);

    if (error) {
      showToast(error.message.toUpperCase(), 'error');
    } else {
      showToast('PASSPHRASE_UPDATED_SUCCESSFULLY', 'success');
      navigation.goBack();
    }
  };

  const report = newPassword ? validatePassword(newPassword) : { score: 0, isValid: false };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: theme.border }]}>
            <BackIcon size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10, letterSpacing: 2 }}>SECURITY_KERNEL // ROTATION</Typography>
          <Typography variant="h2" style={{ color: theme.textPrimary, marginTop: 4 }}>PASSPHRASE_UPDATE</Typography>
        </View>

        <View style={styles.form}>
           <View style={styles.inputGroup}>
            <Typography variant="caption" style={[styles.label, { color: theme.textTertiary }]}>CURRENT_PASSPHRASE</Typography>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder="••••••••••••"
                placeholderTextColor={theme.textTertiary}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Typography variant="caption" style={[styles.label, { color: theme.textTertiary }]}>NEW_SECURE_PASSPHRASE</Typography>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder="••••••••••••"
                placeholderTextColor={theme.textTertiary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>
            {newPassword.length > 0 && <PasswordStrengthMeter score={report.score} />}
          </View>

          <View style={styles.inputGroup}>
            <Typography variant="caption" style={[styles.label, { color: theme.textTertiary }]}>CONFIRM_NEW_PASSPHRASE</Typography>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder="••••••••••••"
                placeholderTextColor={theme.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={[styles.requirements, { backgroundColor: theme.primary + '05', borderColor: theme.border }]}>
            <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 8, marginBottom: 8 }}>PROTOCOL_REQUIREMENTS:</Typography>
            <Typography variant="caption" style={{ color: theme.textSecondary, marginBottom: 4 }}>• Minimum 12 characters</Typography>
            <Typography variant="caption" style={{ color: theme.textSecondary, marginBottom: 4 }}>• Mixed case, numbers & symbols</Typography>
            <Typography variant="caption" style={{ color: theme.textSecondary }}>• Professional grade entropy (zxcvbn ≥ 3)</Typography>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={theme.background} /> : (
              <>
                <Typography variant="monoBold" style={{ color: theme.background }}>UPDATE_PASSPHRASE</Typography>
                <LockIcon size={16} color={theme.background} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 40,
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
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 9,
    letterSpacing: 2,
    marginLeft: 4,
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1,
  },
  input: {
    padding: 16,
    fontSize: 14,
    fontFamily: 'JetBrains Mono',
  },
  requirements: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  submitBtn: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
});
