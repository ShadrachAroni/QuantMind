import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Typography } from '../../components/ui/Typography';
import { useAuthStore } from '../../store/authStore';
import { TIER_ENTITLEMENTS, SubscriptionTier } from '@quantmind/shared-types';
import { 
  LogOut, 
  User as UserIcon, 
  Shield, 
  Bell, 
  Key, 
  Database, 
  ChevronRight, 
  FileText, 
  LifeBuoy, 
  BrainCircuit,
  Activity,
  Terminal,
  Cpu,
  Palette,
  CheckCircle2,
  Lock,
  Fingerprint
} from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { BiometricType } from '../../services/biometric';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { ThemeType, sharedTheme } from '../../constants/theme';

const { width } = Dimensions.get('window');

export function SettingsScreen() {
  const { user, tier, signOut, isBiometricSupported, isBiometricEnabled, setBiometricEnabled, biometricType, enrollBiometrics } = useAuthStore();
  const { theme, themeType, setThemeType, isDark } = useTheme();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  
  const UserIconAny = UserIcon as any;
  const LogOutIcon = LogOut as any;
  const ChevronRightIcon = ChevronRight as any;
  const TerminalIcon = Terminal as any;
  const CpuIcon = Cpu as any;
  const PaletteIcon = Palette as any;
  const CheckIcon = CheckCircle2 as any;
  const FingerprintIcon = Fingerprint as any;

  const handleSignOut = async () => {
    Alert.alert(
      'TERMINATE_SESSION',
      'Are you sure you want to de-authenticate from the terminal?',
      [
        { text: 'CANCEL', style: 'cancel' },
        { text: 'TERMINATE', onPress: signOut, style: 'destructive' }
      ]
    );
  };

  const dynamicStyles = getStyles(theme, isDark);

  const SettingRow = ({ icon: Icon, title, subtitle, onPress, color = theme.primary }: any) => {
    const IconAny = Icon as any;
    return (
      <TouchableOpacity style={dynamicStyles.settingRow} onPress={onPress} activeOpacity={0.7}>
        <View style={[dynamicStyles.settingIcon, { backgroundColor: color + '10', borderColor: color + '33' }]}>
          <IconAny size={18} color={color} />
        </View>
        <View style={dynamicStyles.settingText}>
          <Typography variant="monoBold" style={[dynamicStyles.settingTitle, { color: theme.textPrimary }]}>{title.toUpperCase()}</Typography>
          {subtitle && <Typography variant="caption" style={[dynamicStyles.settingSubtitle, { color: theme.textTertiary }]}>{subtitle}</Typography>}
        </View>
        <ChevronRightIcon size={16} color={theme.textTertiary} />
      </TouchableOpacity>
    );
  };

  const SettingToggle = ({ icon: Icon, title, subtitle, value, onValueChange, color = theme.primary }: any) => {
    const IconAny = Icon as any;
    return (
      <View style={dynamicStyles.settingRow}>
        <View style={[dynamicStyles.settingIcon, { backgroundColor: color + '10', borderColor: color + '33' }]}>
          <IconAny size={18} color={color} />
        </View>
        <View style={dynamicStyles.settingText}>
          <Typography variant="monoBold" style={[dynamicStyles.settingTitle, { color: theme.textPrimary }]}>{title.toUpperCase()}</Typography>
          {subtitle && <Typography variant="caption" style={[dynamicStyles.settingSubtitle, { color: theme.textTertiary }]}>{subtitle}</Typography>}
        </View>
        <TouchableOpacity 
          onPress={() => onValueChange(!value)}
          style={[
            dynamicStyles.toggleTrack, 
            { backgroundColor: value ? theme.primary : theme.border }
          ]}
        >
          <View style={[dynamicStyles.toggleThumb, { transform: [{ translateX: value ? 20 : 0 }] }, { backgroundColor: theme.background }]} />
        </TouchableOpacity>
      </View>
    );
  };

  const ThemeOption = ({ type, label, color }: { type: ThemeType, label: string, color: string }) => {
    const isActive = themeType === type;
    return (
      <TouchableOpacity 
        style={[
          dynamicStyles.themeOption, 
          isActive && { borderColor: color, backgroundColor: color + '10' }
        ]}
        onPress={() => setThemeType(type)}
      >
        <View style={[dynamicStyles.themeColor, { backgroundColor: color }]} />
        <Typography variant="mono" style={[dynamicStyles.themeLabel, { color: isActive ? theme.textPrimary : theme.textTertiary }]}>
          {label}
        </Typography>
        {isActive && <CheckIcon size={12} color={color} />}
      </TouchableOpacity>
    );
  };

  const entitlements = TIER_ENTITLEMENTS[tier as SubscriptionTier] || TIER_ENTITLEMENTS.free;

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.header}>
          <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>USER_MANAGEMENT_STATION</Typography>
          <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>PREFERENCES</Typography>
        </View>
        
        <GlassCard intensity="high" style={dynamicStyles.profileCard}>
          <View style={dynamicStyles.profileHeader}>
            <View style={[dynamicStyles.avatarContainer, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '33' }]}>
              <UserIconAny size={28} color={theme.primary} />
              <View style={dynamicStyles.avatarGlow}>
                <GlowEffect color={theme.primary} size={40} glowRadius={20} />
              </View>
            </View>
            <View style={dynamicStyles.userInfo}>
              <Typography variant="monoBold" style={[dynamicStyles.emailText, { color: theme.textPrimary }]}>{user?.email?.toUpperCase()}</Typography>
              <View style={[dynamicStyles.tierBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }]}>
                <CpuIcon size={10} color={theme.primary} />
                <Typography variant="mono" style={[dynamicStyles.tierText, { color: theme.primary }]}>OPERATOR_LEVEL: {tier.toUpperCase()}</Typography>
              </View>
            </View>
          </View>
          
          <View style={[dynamicStyles.systemStats, { borderTopColor: theme.border }]}>
            <View style={dynamicStyles.statItem}>
              <Typography variant="mono" style={[dynamicStyles.statLabel, { color: theme.textTertiary }]}>SESSION_STATUS</Typography>
              <View style={dynamicStyles.statusBadge}>
                <GlowEffect color={theme.primary} size={4} glowRadius={4} />
                <Typography variant="mono" style={[dynamicStyles.statusText, { color: theme.primary }]}>ACTIVE</Typography>
              </View>
            </View>
            <View style={[dynamicStyles.statDivider, { backgroundColor: theme.border }]} />
            <View style={dynamicStyles.statItem}>
              <Typography variant="mono" style={[dynamicStyles.statLabel, { color: theme.textTertiary }]}>UPTIME_SEC</Typography>
              <Typography variant="mono" style={[dynamicStyles.statValue, { color: theme.textSecondary }]}>12,492.3</Typography>
            </View>
          </View>
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// TERMINAL_INTERFACE</Typography>
        <GlassCard style={dynamicStyles.section}>
          <View style={dynamicStyles.themeGrid}>
            <ThemeOption type="dark" label="DARK_DEFAULT" color="#00D4FF" />
            <ThemeOption type="light" label="LIGHT_MINIMAL" color="#2563EB" />
            <ThemeOption type="binance" label="BINANCE_TERMINAL" color="#FCD535" />
            <ThemeOption type="terminal" label="CYBER_MATRIX" color="#00FF41" />
          </View>
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// BILLING_&_CLEARANCE</Typography>
        <GlassCard style={dynamicStyles.section}>
          <SettingRow 
            icon={Activity} 
            title="Subscription" 
            subtitle={`Current Level: ${tier.toUpperCase()}`} 
            onPress={() => navigation.navigate('Subscription')}
            color={tier === 'free' ? theme.textTertiary : theme.primary}
          />
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// SECURITY_&_ENCRYPTION</Typography>
        <GlassCard style={dynamicStyles.section}>
          {isBiometricSupported && (
            <SettingToggle 
              icon={FingerprintIcon} 
              title={biometricType === BiometricType.FACE_ID ? 'Face ID Access' : 'Biometric Access'}
              subtitle={isBiometricEnabled ? 'ENABLED_SECURE_LAYER' : 'DISABLED_FALLBACK_ONLY'}
              value={isBiometricEnabled}
              onValueChange={async (val: boolean) => {
                if (val) {
                  const success = await enrollBiometrics();
                  if (success) showToast('BIOMETRICS_ACTIVATED', 'success');
                } else {
                  await setBiometricEnabled(false);
                  showToast('BIOMETRICS_DEACTIVATED', 'info');
                }
              }}
            />
          )}
          <SettingRow 
            icon={Shield} 
            title="Multi-Factor Auth" 
            subtitle={!entitlements.allow_advanced_models && tier === 'free' ? 'ACCESS_DENIED (PLUS_ONLY)' : 'TOTP_CONFIGURATION'} 
            onPress={() => !entitlements.allow_advanced_models && tier === 'free' ? showToast('ACCESS_RESTRICTED: Upgrade required for MFA.', 'error') : navigation.navigate('MFA')}
            color={!entitlements.allow_advanced_models && tier === 'free' ? theme.textTertiary : theme.primary}
          />
          <SettingRow 
            icon={Key} 
            title="Active Keys" 
            subtitle="View and rotate session keys" 
            onPress={() => navigation.navigate('ActiveSessions')}
          />
          <SettingRow 
            icon={Lock} 
            title="Rotate Passphrase" 
            subtitle="Update security credentials" 
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingRow 
            icon={FileText} 
            title="Methodology" 
            subtitle="Risk model whitepaper" 
            onPress={() => navigation.navigate('ModelMethodology')}
          />
          <SettingRow icon={Bell} title="Alert Hub" subtitle="Real-time notification routing" />
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// AI_KERNEL_CONFIG</Typography>
        <GlassCard style={dynamicStyles.section}>
          <SettingRow
            icon={!entitlements.allow_ai_tuning ? Lock : BrainCircuit}
            title="AI Preferences"
            subtitle={!entitlements.allow_ai_tuning ? 'ACCESS_DENIED (PLUS_ONLY)' : 'Model tuning & cognitive overrides'}
            onPress={() => !entitlements.allow_ai_tuning ? showToast('ACCESS_RESTRICTED: Upgrade required for AI tuning.', 'error') : navigation.navigate('AIPreferences')}
            color={!entitlements.allow_ai_tuning ? theme.textTertiary : theme.secondary}
          />
          <SettingRow
            icon={!entitlements.allow_ai_tuning ? Lock : Shield}
            title="Custom AI Models"
            subtitle={!entitlements.allow_ai_tuning ? 'ACCESS_DENIED (PLUS_ONLY)' : 'Connect your own API keys'}
            onPress={() => !entitlements.allow_ai_tuning ? showToast('ACCESS_RESTRICTED: Upgrade required for custom AI.', 'error') : navigation.navigate('CustomAIIntegrations')}
            color={!entitlements.allow_ai_tuning ? theme.textTertiary : theme.primary}
          />
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// DATA_STORAGE_&_RULES</Typography>
        <GlassCard style={dynamicStyles.section}>
          <SettingRow 
            icon={Database} 
            title="Data Extraction" 
            subtitle="Portfolio export (JSON/CSV)" 
            onPress={() => navigation.navigate('DataManagement')}
          />
          <SettingRow 
            icon={FileText} 
            title="Policy Docs" 
            subtitle="Terms and privacy compliance" 
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// EXTERNAL_LINKS</Typography>
        <GlassCard style={dynamicStyles.section}>
          <SettingRow 
            icon={LifeBuoy} 
            title="Support Bridge" 
            subtitle="Open channel to QuantMind HQ" 
            onPress={() => navigation.navigate('Support')}
            color="#10B981"
          />
          <SettingRow 
            icon={History} 
            title="What's New" 
            subtitle="View system update logs" 
            onPress={() => navigation.navigate('Changelog')}
            color={theme.primary}
          />
        </GlassCard>

        <TouchableOpacity 
          style={[dynamicStyles.logoutBtn, { borderColor: theme.error + '33', backgroundColor: theme.error + '10' }]} 
          onPress={handleSignOut}
        >
          <View style={dynamicStyles.logoutContent}>
            <LogOutIcon size={18} color={theme.error} />
            <Typography variant="monoBold" style={[dynamicStyles.logoutText, { color: theme.error }]}>KILL_SESSION</Typography>
          </View>
        </TouchableOpacity>

        <View style={dynamicStyles.footer}>
          <TerminalIcon size={12} color={theme.textTertiary} />
          <Typography variant="mono" style={[dynamicStyles.versionText, { color: theme.textTertiary }]}>QUANTMIND_OS_V1.0.4_STABLE // BUILD_942</Typography>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: sharedTheme.spacing.xl,
    paddingTop: 64,
  },
  header: {
    marginBottom: 32,
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
  profileCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 20,
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    zIndex: -1,
  },
  userInfo: {
    flex: 1,
  },
  emailText: {
    fontSize: 14,
    marginBottom: 6,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  tierText: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
  systemStats: {
    flexDirection: 'row',
    paddingTop: 20,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 9,
  },
  statValue: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  section: {
    borderRadius: 20,
    marginBottom: 32,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  settingSubtitle: {
    fontSize: 9,
    marginTop: 2,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  themeGrid: {
    padding: 16,
    gap: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  themeColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeLabel: {
    fontSize: 11,
    flex: 1,
    letterSpacing: 1,
  },
  logoutBtn: {
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  logoutText: {
    fontSize: 12,
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 40,
    opacity: 0.4,
  },
  versionText: {
    fontSize: 8,
  },
});
