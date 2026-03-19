import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Typography } from '../../components/ui/Typography';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User as UserIcon, Shield, Bell, Key, Database, ChevronRight, FileText, LifeBuoy } from 'lucide-react-native';

export function SettingsScreen() {
  const { user, tier, signOut } = useAuthStore();
  const navigation = useNavigation<any>();
  
  const UserIconAny = UserIcon as any;
  const LogOutIcon = LogOut as any;
  const ChevronRightIcon = ChevronRight as any;

  const handleSignOut = async () => {
    Alert.alert(
      'Initialize Logout',
      'Are you sure you want to terminate your session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Terminate', onPress: signOut, style: 'destructive' }
      ]
    );
  };

  const SettingRow = ({ icon: Icon, title, subtitle, onPress }: any) => {
    const IconAny = Icon as any;
    return (
      <TouchableOpacity style={styles.settingRow} onPress={onPress}>
        <View style={styles.settingIcon}>
          <IconAny size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Typography variant="body" style={styles.settingTitle}>{title}</Typography>
          {subtitle && <Typography variant="caption" style={styles.settingSubtitle}>{subtitle}</Typography>}
        </View>
        <ChevronRightIcon size={20} color={theme.colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Typography variant="h2" style={styles.pageTitle}>System Preferences</Typography>
        
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarPlaceholder}>
              <UserIconAny size={32} color={theme.colors.textSecondary} />
            </View>
            <View>
              <Typography variant="h3" style={styles.emailText}>{user?.email}</Typography>
              <Typography variant="body" style={styles.tierText}>Access Level: <Typography variant="button" style={{color: theme.colors.primary}}>{tier.toUpperCase()}</Typography></Typography>
            </View>
          </View>
        </View>

        <Typography variant="caption" style={styles.sectionHeader}>SECURITY & ACCESS</Typography>
        <View style={styles.section}>
          <SettingRow 
            icon={Shield} 
            title="Multi-Factor Auth (MFA)" 
            subtitle={tier === 'free' ? 'Upgrade required' : 'Configure TOTP'} 
            onPress={() => tier === 'free' ? Alert.alert('Upgrade Required', 'MFA is a Plus/Pro feature.') : null}
          />
          <SettingRow icon={Key} title="Active Sessions" subtitle="View & revoke access" />
          <SettingRow icon={Bell} title="System Notifications" subtitle="Alert routing preferences" />
        </View>

        <Typography variant="caption" style={styles.sectionHeader}>DATA & PRIVACY</Typography>
        <View style={styles.section}>
          <SettingRow icon={Database} title="Export Data" subtitle="Request portfolio archives" />
          <SettingRow 
            icon={Shield} 
            title="Privacy Policy" 
            subtitle="Data protection & §11 Compliance" 
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <SettingRow 
            icon={FileText} 
            title="Terms of Service" 
            subtitle="Institutional usage agreement" 
            onPress={() => navigation.navigate('TermsOfService')}
          />
        </View>

        <Typography variant="caption" style={styles.sectionHeader}>SUPPORT</Typography>
        <View style={styles.section}>
          <SettingRow 
            icon={LifeBuoy} 
            title="Help & Support" 
            subtitle="Contact AI Assistant or Human Agent" 
            onPress={() => navigation.navigate('Support')}
          />
        </View>

        <View style={styles.dangerZone}>
            <TouchableOpacity onPress={() => Alert.alert('Destructive Action', 'Contact support to permanently delete your data.')}>
              <Typography variant="body" style={styles.dangerText}>Delete Operator Account</Typography>
            </TouchableOpacity>
          </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOutIcon size={20} color={theme.colors.error} />
          <Typography variant="button" style={styles.logoutText}>TERMINATE SESSION</Typography>
        </TouchableOpacity>

        <Typography variant="caption" style={styles.versionText}>QuantMind OS v1.0.0 (Build 492)</Typography>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
  },
  pageTitle: {
    color: '#FFF',
    marginBottom: theme.spacing.xl,
  },
  profileCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.roundness.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xxl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emailText: {
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  tierText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fonts.mono,
  },
  sectionHeader: {
    color: theme.colors.textTertiary,
    fontFamily: theme.typography.fonts.mono,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
    marginLeft: 4,
  },
  section: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xxl,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingIcon: {
    marginRight: theme.spacing.md,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fonts.medium,
  },
  settingSubtitle: {
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  dangerZone: {
    padding: theme.spacing.lg,
  },
  dangerText: {
    color: theme.colors.error,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    marginBottom: theme.spacing.xl,
  },
  logoutText: {
    color: theme.colors.error,
    marginLeft: 12,
    letterSpacing: 1,
  },
  versionText: {
    textAlign: 'center',
    fontFamily: theme.typography.fonts.mono,
    color: theme.colors.textTertiary,
  },
});
