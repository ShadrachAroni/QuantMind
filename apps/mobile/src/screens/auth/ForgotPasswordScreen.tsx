import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, Dimensions } from 'react-native';
import { supabase } from '../../services/supabase';
import { Typography } from '../../components/ui/Typography';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { sharedTheme } from '../../constants/theme';
import { ChevronLeft, Key } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();

  const BackIcon = ChevronLeft as any;
  const KeyIcon = Key as any;

  const handleReset = async () => {
    if (!email) {
      showToast('IDENT_ERROR: Email required.', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'quantmind://auth/callback',
    });
    setLoading(false);

    // Always show success to prevent email enumeration (App Rules 10.2)
    showToast('REQUEST_ACKNOWLEDGED: Recovery link dispatched if user exists.', 'info');
    navigation.navigate('Login');
  };

  const dynamicStyles = getStyles(theme, isDark);

  return (
    <KeyboardAvoidingView 
      style={[dynamicStyles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={dynamicStyles.content}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
            <BackIcon size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>CREDENTIAL_RECOVERY_PROTOCOL</Typography>
          <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>ACCESS_RESTORE</Typography>
        </View>

        <View style={dynamicStyles.formContainer}>
          <Typography variant="body" style={[dynamicStyles.instructions, { color: theme.textSecondary }]}>
            Enter your institutional email address to request a kernel access override.
          </Typography>

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

          <TouchableOpacity 
            style={[dynamicStyles.primaryButton, { backgroundColor: theme.primary }]} 
            onPress={handleReset} 
            disabled={loading}
          >
            <Typography variant="monoBold" style={[dynamicStyles.primaryButtonText, { color: theme.background }]}>EXECUTE_RECOVERY</Typography>
            <KeyIcon size={16} color={theme.background} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </View>

      <LoadingOverlay visible={loading} message="SYNCHRONIZING_OVERRIDE..." />
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
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
  instructions: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 32,
  },
  formContainer: {
    gap: 8,
  },
  inputGroup: {
    marginBottom: 24,
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
  primaryButton: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    letterSpacing: 1,
  },
});
