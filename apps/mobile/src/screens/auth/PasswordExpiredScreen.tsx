import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { Lock, RefreshCw, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { sharedTheme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export function PasswordExpiredScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { signOut } = useAuthStore();
  
  const LockIcon = Lock as any;
  const RefreshIcon = RefreshCw as any;
  const AlertIcon = AlertTriangle as any;

  const handleReset = () => {
    // Navigate to Forgot Password
    navigation.navigate('ForgotPassword');
  };

  const dynamicStyles = getStyles(theme, isDark);

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={isDark ? ['#05060B', '#1A0F0F', '#05060B'] : [theme.background, '#FFF5F5', theme.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ 
          position: 'absolute', 
          top: height * 0.1, 
          left: width * 0.25, 
          width: 300, 
          height: 300, 
          borderRadius: 150, 
          backgroundColor: '#FF444408',
        }} />
      </View>
      <View style={dynamicStyles.content}>
        <GlassCard intensity="high" style={[dynamicStyles.card, { borderColor: '#FF44444D' }]}>
          <View style={dynamicStyles.header}>
            <View style={[dynamicStyles.iconWrapper, { backgroundColor: '#FF44441A', borderColor: '#FF44444D' }]}>
              <GlowEffect color="#FF4444" size={60} glowRadius={30} style={dynamicStyles.glow} />
              <LockIcon size={32} color="#FF4444" />
            </View>
            <Typography variant="mono" style={[dynamicStyles.statusText, { color: '#FF4444' }]}>PROTOCOL_VIOLATION: ACCESS_EXPIRED</Typography>
          </View>

          <View style={dynamicStyles.body}>
            <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>ROTATION_REQUIRED</Typography>
            <Typography variant="body" style={[dynamicStyles.description, { color: theme.textSecondary }]}>
              Your current access key has exceeded the 60-day security threshold. QuantMind core protocols require a mandatory credential rotation.
            </Typography>

            <View style={[dynamicStyles.alertBox, { backgroundColor: isDark ? 'rgba(255,68,68,0.05)' : 'rgba(255,68,68,0.02)', borderColor: '#FF444426' }]}>
              <AlertIcon size={16} color="#FF4444" />
              <Typography variant="mono" style={[dynamicStyles.alertText, { color: theme.textSecondary }]}>
                SESSION_LOCKED // RESET_REQUIRED_FOR_ENTRY
              </Typography>
            </View>
          </View>

          <TouchableOpacity 
            style={[dynamicStyles.resetBtn, { backgroundColor: '#FF4444' }]} 
            onPress={handleReset}
            activeOpacity={0.8}
          >
            <Typography variant="monoBold" style={[dynamicStyles.resetText, { color: '#FFFFFF' }]}>INITIATE_ROTATION</Typography>
            <RefreshIcon size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.logoutBtn} onPress={signOut}>
            <Typography variant="mono" style={[dynamicStyles.logoutText, { color: theme.textTertiary }]}>TERMINATE_SESSION</Typography>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    padding: 32,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  glow: {
    position: 'absolute',
    opacity: 0.5,
  },
  statusText: {
    fontSize: 10,
    letterSpacing: 2,
  },
  body: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    letterSpacing: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 24,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  alertText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  resetBtn: {
    width: '100%',
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  resetText: {
    fontSize: 14,
    letterSpacing: 1,
  },
  logoutBtn: {
    padding: 12,
  },
  logoutText: {
    fontSize: 10,
    letterSpacing: 1,
  },
});
