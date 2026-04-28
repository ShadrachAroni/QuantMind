import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Typography } from '../../components/ui/Typography';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../lib/i18n';
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
  Fingerprint,
  HelpCircle,
  Globe,
  MapPin,
  History,
  Info
} from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { BiometricType } from '../../services/biometric';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { ThemeType, sharedTheme } from '../../constants/theme';

const { width } = Dimensions.get('window');

export function SettingsScreen() {
  const { 
    user, tier, signOut, 
    isBiometricSupported, isBiometricEnabled, setBiometricEnabled, 
    biometricType, enrollBiometrics,
    region, interfaceLanguage, aiPersona,
    updateRegion, updateInterfaceLanguage,
    tierConfigs
  } = useAuthStore();
  const { theme, themeType, setThemeType, isDark } = useTheme();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  const t = useTranslation(interfaceLanguage);

  const [selModal, setSelModal] = React.useState<{ visible: boolean, type: 'lang' | 'region' }>({ visible: false, type: 'lang' });
  
  const GlobeIcon = Globe as any;
  const MapPinIcon = MapPin as any;
  
  const UserIconAny = UserIcon as any;
  const LogOutIcon = LogOut as any;
  const ChevronRightIcon = ChevronRight as any;
  const TerminalIcon = Terminal as any;
  const CpuIcon = Cpu as any;
  const PaletteIcon = Palette as any;
  const CheckIcon = CheckCircle2 as any;
  const FingerprintIcon = Fingerprint as any;
  const InfoIcon = Info as any;

  const handleSignOut = async () => {
    Alert.alert(
      t('TERMINATE_SESSION'),
      t('Log_Out_Confirm'),
      [
        { text: t('CANCEL'), style: 'cancel' },
        { text: t('TERMINATE'), onPress: signOut, style: 'destructive' }
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
          <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>{t('USER_MANAGEMENT_STATION')}</Typography>
          <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>{t('PREFERENCES')}</Typography>
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
                <Typography variant="mono" style={[dynamicStyles.tierText, { color: theme.primary }]}>{t('CURRENT_LEVEL', { level: tier.toUpperCase() })}</Typography>
              </View>
            </View>
          </View>
          
          <View style={[dynamicStyles.systemStats, { borderTopColor: theme.border }]}>
            <View style={dynamicStyles.statItem}>
              <Typography variant="mono" style={[dynamicStyles.statLabel, { color: theme.textTertiary }]}>{t('SESSION_STATUS')}</Typography>
              <View style={dynamicStyles.statusBadge}>
                <GlowEffect color={theme.primary} size={4} glowRadius={4} />
                <Typography variant="mono" style={[dynamicStyles.statusText, { color: theme.primary }]}>{t('ACTIVE')}</Typography>
              </View>
            </View>
            <View style={[dynamicStyles.statDivider, { backgroundColor: theme.border }]} />
            <View style={dynamicStyles.statItem}>
              <Typography variant="mono" style={[dynamicStyles.statLabel, { color: theme.textTertiary }]}>{t('UPTIME_SEC')}</Typography>
              <Typography variant="mono" style={[dynamicStyles.statValue, { color: theme.textSecondary }]}>12,492.3</Typography>
            </View>
          </View>
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// {t('TERMINAL_INTERFACE')}</Typography>
        <GlassCard style={dynamicStyles.section}>
          <View style={dynamicStyles.themeGrid}>
            <ThemeOption type="dark" label={t('DARK_DEFAULT')} color="#00D4FF" />
            <ThemeOption type="light" label={t('LIGHT_MINIMAL')} color="#2563EB" />
            <ThemeOption type="binance" label={t('BINANCE_TERMINAL')} color="#FCD535" />
            <ThemeOption type="terminal" label={t('CYBER_MATRIX')} color="#00FF41" />
          </View>
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// {t('TERMINAL_LOCALIZATION')}</Typography>
        <GlassCard style={dynamicStyles.section}>
          <SettingRow 
            icon={GlobeIcon} 
            title="Communication Protocol" 
            subtitle={
              interfaceLanguage === 'ENGLISH_INTL' ? t('ENGLISH_INTERNATIONAL') : 
              interfaceLanguage === 'DEUTSCH_EU' ? t('GERMAN_EUROPE') :
              interfaceLanguage === 'FRENCH_EU' ? t('FRENCH_EUROPE') : t('SPANISH_EUROPE')
            } 
            onPress={() => setSelModal({ visible: true, type: 'lang' })}
          />
          <SettingRow 
            icon={MapPinIcon} 
            title="Institutional Protocol" 
            subtitle={region === 'US_EAST_NY' ? t('REGION_US') : region === 'EU_WEST_LDN' ? t('REGION_EU') : t('REGION_AF')} 
            onPress={() => setSelModal({ visible: true, type: 'region' })}
          />
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// {t('BILLING_CLEARANCE')}</Typography>
        <GlassCard style={dynamicStyles.section}>
          <SettingRow 
            icon={Activity} 
            title="Clearance Level" 
            subtitle={`Current Level: ${tier.toUpperCase()}`} 
            onPress={() => navigation.navigate('Subscription')}
            color={tier === 'free' ? theme.textTertiary : theme.primary}
          />
          <SettingRow 
            icon={History} 
            title={t('Billing_History')} 
            subtitle={t('BILLING_HISTORY_SUB')} 
            onPress={() => navigation.navigate('BillingHistory')}
            color={theme.primary}
          />
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// {t('SECURITY_ENCRYPTION')}</Typography>
        <GlassCard style={dynamicStyles.section}>
          {isBiometricSupported && (
            <SettingToggle 
              icon={FingerprintIcon} 
              title={biometricType === BiometricType.FACE_ID ? t('FACE_ID_ACCESS') : t('BIOMETRIC_ACCESS')}
              subtitle={isBiometricEnabled ? t('ENABLED_SECURE_LAYER') : t('DISABLED_FALLBACK_ONLY')}
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
            title={t('MFA_TITLE')} 
            subtitle={!entitlements.allow_advanced_models && tier === 'free' ? t('ACCESS_DENIED_PLUS') : t('TOTP_CONFIGURATION')} 
            onPress={() => !entitlements.allow_advanced_models && tier === 'free' ? showToast(t('MFA_UPGRADE_REQUIRED'), 'error') : navigation.navigate('MFA')}
            color={!entitlements.allow_advanced_models && tier === 'free' ? theme.textTertiary : theme.primary}
          />
          <SettingRow 
            icon={Key} 
            title={t('ACTIVE_KEYS')} 
            subtitle={t('ACTIVE_KEYS_SUB')} 
            onPress={() => navigation.navigate('ActiveSessions')}
          />
          <SettingRow 
            icon={Lock} 
            title={t('ROTATE_PASSPHRASE')} 
            subtitle={t('ROTATE_PASSPHRASE_SUB')} 
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingRow 
            icon={FileText} 
            title={t('METHODOLOGY')} 
            subtitle={t('METHODOLOGY_SUB')} 
            onPress={() => navigation.navigate('ModelMethodology')}
          />
          <SettingRow icon={Bell} title={t('ALERT_HUB')} subtitle={t('ALERT_HUB_SUB')} />
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// {t('AI_KERNEL_CONFIG')}</Typography>
        <GlassCard style={dynamicStyles.section}>
          <SettingRow
            icon={!entitlements.allow_ai_tuning ? Lock : BrainCircuit}
            title={t('AI_PREFERENCES')}
            subtitle={!entitlements.allow_ai_tuning ? t('ACCESS_DENIED_PLUS') : t('AI_PERSONA_LABEL', { persona: aiPersona.replace('_', ' ') })}
            onPress={() => !entitlements.allow_ai_tuning ? showToast(t('AI_TUNING_UPGRADE_REQUIRED'), 'error') : navigation.navigate('AIPreferences')}
            color={!entitlements.allow_ai_tuning ? theme.textTertiary : theme.secondary}
          />
          <SettingRow
            icon={!entitlements.allow_ai_tuning ? Lock : Shield}
            title={t('CUSTOM_AI_MODELS')}
            subtitle={!entitlements.allow_ai_tuning ? t('ACCESS_DENIED_PLUS') : t('CUSTOM_AI_MODELS_SUB')}
            onPress={() => !entitlements.allow_ai_tuning ? showToast(t('CUSTOM_AI_UPGRADE_REQUIRED'), 'error') : navigation.navigate('CustomAIIntegrations')}
            color={!entitlements.allow_ai_tuning ? theme.textTertiary : theme.primary}
          />
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// {t('DATA_STORAGE_RULES')}</Typography>
        <GlassCard style={dynamicStyles.section}>
          <SettingRow 
            icon={Database} 
            title={t('DATA_EXTRACTION')} 
            subtitle={t('DATA_EXTRACTION_SUB')} 
            onPress={() => navigation.navigate('DataManagement')}
          />
          <SettingRow 
            icon={FileText} 
            title={t('POLICY_DOCS')} 
            subtitle={t('POLICY_DOCS_SUB')} 
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionHeader, { color: theme.textSecondary }]}>// {t('EXTERNAL_LINKS')}</Typography>
        <GlassCard style={dynamicStyles.section}>
          <SettingRow 
            icon={InfoIcon} 
            title={t('About_Protocol')} 
            subtitle={t('About_Protocol_Sub')} 
            onPress={() => navigation.navigate('AboutApp')}
            color={theme.primary}
          />
          <SettingRow 
            icon={HelpCircle} 
            title={t('Operational_Manual')} 
            subtitle={t('Operational_Manual_Sub')} 
            onPress={() => navigation.navigate('HowToUse')}
            color={theme.primary}
          />
          <SettingRow 
            icon={LifeBuoy} 
            title={t('Institutional_Care')} 
            subtitle={t('SUPPORT_BRIDGE_SUB')} 
            onPress={() => navigation.navigate('Support')}
            color="#10B981"
          />
          <SettingRow 
            icon={History} 
            title={t('WHATS_NEW')} 
            subtitle={t('WHATS_NEW_SUB')} 
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
            <Typography variant="monoBold" style={[dynamicStyles.logoutText, { color: theme.error }]}>{t('KILL_SESSION')}</Typography>
          </View>
        </TouchableOpacity>

        <View style={dynamicStyles.footer}>
          <TerminalIcon size={12} color={theme.textTertiary} />
          <Typography variant="mono" style={[dynamicStyles.versionText, { color: theme.textTertiary }]}>QUANTMIND_OS_V1.0.4_STABLE // BUILD_942</Typography>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={selModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setSelModal({ ...selModal, visible: false })}
      >
        <Pressable 
          style={dynamicStyles.modalOverlay} 
          onPress={() => setSelModal({ ...selModal, visible: false })}
        >
          <GlassCard intensity="high" style={dynamicStyles.modalContent}>
            <Typography variant="monoBold" style={[dynamicStyles.modalTitle, { color: theme.textPrimary }]}>
              {selModal.type === 'lang' ? "SELECT COMMUNICATION PROTOCOL" : "SELECT INSTITUTIONAL PROTOCOL"}
            </Typography>
            
            {selModal.type === 'lang' ? (
              <>
                <TouchableOpacity 
                  style={dynamicStyles.modalOption} 
                  onPress={async () => {
                    await updateInterfaceLanguage('ENGLISH_INTL');
                    setSelModal({ ...selModal, visible: false });
                    showToast(t('LANGUAGE_UPDATED'), 'success');
                  }}
                >
                  <Typography variant="mono" style={{ color: interfaceLanguage === 'ENGLISH_INTL' ? theme.primary : theme.textSecondary }}>
                    ENGLISH_INTL {interfaceLanguage === 'ENGLISH_INTL' && '// ACTIVE'}
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={dynamicStyles.modalOption} 
                  onPress={async () => {
                    await updateInterfaceLanguage('DEUTSCH_EU');
                    setSelModal({ ...selModal, visible: false });
                    showToast(t('LANGUAGE_UPDATED'), 'success');
                  }}
                >
                  <Typography variant="mono" style={{ color: interfaceLanguage === 'DEUTSCH_EU' ? theme.primary : theme.textSecondary }}>
                    DEUTSCH_EU {interfaceLanguage === 'DEUTSCH_EU' && '// ACTIVE'}
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={dynamicStyles.modalOption} 
                  onPress={async () => {
                    await updateInterfaceLanguage('FRENCH_EU');
                    setSelModal({ ...selModal, visible: false });
                    showToast(t('LANGUAGE_UPDATED'), 'success');
                  }}
                >
                  <Typography variant="mono" style={{ color: interfaceLanguage === 'FRENCH_EU' ? theme.primary : theme.textSecondary }}>
                    FRENCH_EU {interfaceLanguage === 'FRENCH_EU' && '// ACTIVE'}
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={dynamicStyles.modalOption} 
                  onPress={async () => {
                    await updateInterfaceLanguage('ESPANOL_EU');
                    setSelModal({ ...selModal, visible: false });
                    showToast(t('LANGUAGE_UPDATED'), 'success');
                  }}
                >
                  <Typography variant="mono" style={{ color: interfaceLanguage === 'ESPANOL_EU' ? theme.primary : theme.textSecondary }}>
                    ESPANOL_EU {interfaceLanguage === 'ESPANOL_EU' && '// ACTIVE'}
                  </Typography>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={dynamicStyles.modalOption} 
                  onPress={async () => {
                    await updateRegion('US_EAST_NY');
                    setSelModal({ ...selModal, visible: false });
                    showToast(t('REGION_UPDATED'), 'success');
                  }}
                >
                  <Typography variant="mono" style={{ color: region === 'US_EAST_NY' ? theme.primary : theme.textSecondary }}>
                    US_EAST_NY {region === 'US_EAST_NY' && '// ACTIVE'}
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={dynamicStyles.modalOption} 
                  onPress={async () => {
                    await updateRegion('EU_WEST_LDN');
                    setSelModal({ ...selModal, visible: false });
                    showToast(t('REGION_UPDATED'), 'success');
                  }}
                >
                  <Typography variant="mono" style={{ color: region === 'EU_WEST_LDN' ? theme.primary : theme.textSecondary }}>
                    EU_WEST_LDN {region === 'EU_WEST_LDN' && '// ACTIVE'}
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={dynamicStyles.modalOption} 
                  onPress={async () => {
                    await updateRegion('AF_WEST_LOS');
                    setSelModal({ ...selModal, visible: false });
                    showToast(t('REGION_UPDATED'), 'success');
                  }}
                >
                  <Typography variant="mono" style={{ color: region === 'AF_WEST_LOS' ? theme.primary : theme.textSecondary }}>
                    AF_WEST_LOS {region === 'AF_WEST_LOS' && '// ACTIVE'}
                  </Typography>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity 
              style={[dynamicStyles.closeModalBtn, { borderColor: theme.border }]}
              onPress={() => setSelModal({ ...selModal, visible: false })}
            >
              <Typography variant="mono" style={{ color: theme.textTertiary }}>{t('CANCEL')}</Typography>
            </TouchableOpacity>
          </GlassCard>
        </Pressable>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 14,
    marginBottom: 8,
    letterSpacing: 1,
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  closeModalBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
});
