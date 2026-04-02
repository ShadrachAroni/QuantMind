import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../lib/i18n';
import { Typography } from '../../components/ui/Typography';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { sharedTheme } from '../../constants/theme';
import { 
  ChevronLeft, 
  Download, 
  Trash2, 
  Shield, 
  FileText, 
  AlertTriangle,
  Lock,
  Mail,
  ShieldAlert,
  X,
  ArrowRight,
  Info,
  CheckCircle2
} from 'lucide-react-native';
import { Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { GlassCard } from '../../components/ui/GlassCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const LockIcon = Lock as any;
const MailIcon = Mail as any;
const ShieldAlertIcon = ShieldAlert as any;
const CloseIcon = X as any;
const ArrowIcon = ArrowRight as any;
const InfoIcon = Info as any;
const CheckIcon = CheckCircle2 as any;

const ChevronLeftIcon = ChevronLeft as any;

export function DataManagementScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const { user, interfaceLanguage } = useAuthStore();
  const t = useTranslation(interfaceLanguage);
  const [loading, setLoading] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);

  // Deletion Wizard State
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1); // Warning -> Verify -> Confirm -> Success
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verificationType, setVerificationType] = useState<'password' | 'otp'>('password');
  const [isLethal, setIsLethal] = useState(false); // Sub-state for loading during terminal actions

  const BackIcon = ChevronLeft as any;
  const DownloadIcon = Download as any;
  const TrashIcon = Trash2 as any;
  const ShieldIcon = Shield as any;
  const FileTextIcon = FileText as any;
  const AlertIcon = AlertTriangle as any;

  const handleExportData = async () => {
    setLoading(true);
    try {
      // Trigger the export-user-data edge function
      const { data, error } = await supabase.functions.invoke('export-user-data');
      
      if (error) throw error;

      showToast(t('EXPORT_QUEUED'), 'success');
    } catch (err: any) {
      showToast(err.message || t('EXPORT_FAILED'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setIsDeleting(true);
    setCurrentStep(1);
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: user?.email!,
        options: { shouldCreateUser: false }
      });
      if (otpError) throw otpError;
      setVerificationType('otp');
      showToast(t('OTP_SENT'), 'info');
    } catch (err: any) {
      showToast(err.message || t('OTP_FAILED'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalPurge = async () => {
    setIsLethal(true);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('delete-account', {
        body: {
          verificationType,
          password: verificationType === 'password' ? password : null,
          otpToken: verificationType === 'otp' ? otpCode : null,
        }
      });

      if (funcError) throw funcError;
      if (data?.error) throw new Error(data.error);

      setCurrentStep(4);
      setTimeout(async () => {
        await supabase.auth.signOut();
        setIsDeleting(false);
        // Navigation will automatically handle logout redirect via auth store listener
      }, 3000);
    } catch (err: any) {
      showToast(err.message || t('PURGE_FAILED'), 'error');
      if (err.message?.includes('INVALID')) {
        setCurrentStep(2);
      }
    } finally {
      setIsLethal(false);
    }
  };

  const toggleAnalytics = async (val: boolean) => {
    setAnalyticsConsent(val);
    const { error } = await supabase
      .from('user_profiles')
      .update({ analytics_consent: val })
      .eq('id', user?.id);
    
    if (error) showToast(t('CONSENT_UPDATE_FAILED'), 'error');
    else showToast(val ? t('ANALYTICS_ENABLED') : t('ANALYTICS_DISABLED'), 'info');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: theme.border }]}>
            <BackIcon size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10, letterSpacing: 2 }}>{t('DATA_SOVEREIGNTY')}</Typography>
          <Typography variant="h2" style={{ color: theme.textPrimary, marginTop: 4 }}>{t('GOVERNANCE_TOOLS')}</Typography>
        </View>

        <View style={styles.section}>
          <Typography variant="mono" style={styles.label}>{t('TRANSPARENCY_CONSENT')}</Typography>
          
          <View style={[styles.controlCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
            <View style={styles.controlInfo}>
               <ShieldIcon size={20} color={theme.primary} />
               <View style={styles.textStack}>
                 <Typography variant="monoBold" style={{ color: theme.textPrimary }}>{t('ANALYTICS_TRACKING')}</Typography>
                 <Typography variant="caption" style={{ color: theme.textTertiary }}>{t('ANALYTICS_DESC')}</Typography>
               </View>
            </View>
            <Switch 
              value={analyticsConsent} 
              onValueChange={toggleAnalytics}
              trackColor={{ false: theme.border, true: theme.primary + '50' }}
              thumbColor={analyticsConsent ? theme.primary : '#ccc'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="mono" style={styles.label}>{t('DATA_PORTABILITY')}</Typography>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}
            onPress={handleExportData}
            disabled={loading}
          >
            <View style={styles.controlInfo}>
               <DownloadIcon size={20} color={theme.primary} />
               <View style={styles.textStack}>
                 <Typography variant="monoBold" style={{ color: theme.textPrimary }}>{t('EXPORT_PORTFOLIO_DATA')}</Typography>
                 <Typography variant="caption" style={{ color: theme.textTertiary }}>{t('EXPORT_DESC')}</Typography>
               </View>
            </View>
            {loading ? <ActivityIndicator size="small" color={theme.primary} /> : <ChevronLeftIcon size={16} color={theme.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Typography variant="mono" style={styles.label}>{t('RIGHT_TO_ERASURE')}</Typography>
          
          <TouchableOpacity 
            style={[styles.dangerCard, { borderColor: theme.error + '40' }]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.controlInfo}>
               <TrashIcon size={20} color={theme.error} />
               <View style={styles.textStack}>
                 <Typography variant="monoBold" style={{ color: theme.error }}>{t('PURGE_ACCOUNT_KERNEL')}</Typography>
                 <Typography variant="caption" style={{ color: theme.textTertiary }}>{t('PURGE_DESC')}</Typography>
               </View>
            </View>
          </TouchableOpacity>

          <View style={[styles.complianceBox, { backgroundColor: theme.warning + '05', borderColor: theme.warning + '20' }]}>
            <AlertIcon size={14} color={theme.warning} />
            <Typography variant="caption" style={{ color: theme.textTertiary, flex: 1, marginLeft: 10 }}>
              {t('GDPR_COMPLIANCE')}
            </Typography>
          </View>
        </View>

      </ScrollView>

      {/* Account Deletion Wizard Modal */}
      <Modal visible={isDeleting} transparent animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={wizardStyles.overlay}
        >
          <GlassCard intensity="high" style={wizardStyles.container}>
            {isLethal && (
              <View style={wizardStyles.loadingOverlay}>
                <ActivityIndicator size="large" color={theme.error} />
                <Typography variant="monoBold" style={{ color: theme.error, marginTop: 16 }}>{t('PURGING_NODE')}</Typography>
              </View>
            )}

            <View style={wizardStyles.header}>
              <View>
                <Typography variant="mono" style={{ color: theme.error, fontSize: 10 }}>{t('TERMINATION_PROTOCOL')}</Typography>
                <Typography variant="h3" style={{ color: theme.textPrimary }}>{t('ACCOUNT_EXIT')}</Typography>
              </View>
              <TouchableOpacity onPress={() => setIsDeleting(false)} disabled={isLethal} style={wizardStyles.closeBtn}>
                <CloseIcon size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>

            {currentStep === 1 && (
              <View style={wizardStyles.step}>
                <View style={[wizardStyles.warningIconBox, { backgroundColor: theme.error + '10', borderColor: theme.error + '30' }]}>
                  <AlertIcon size={32} color={theme.error} />
                </View>
                <Typography variant="body" style={wizardStyles.desc}>
                  {t('DELETE_WARNING', { irreversible: t('IRREVERSIBLE') })}
                </Typography>
                
                <View style={[wizardStyles.purgeList, { backgroundColor: theme.error + '05', borderColor: theme.error + '20' }]}>
                  <View style={wizardStyles.purgeItem}>
                    <TrashIcon size={12} color={theme.error} />
                    <Typography variant="caption" style={wizardStyles.purgeText}>{t('PORTFOLIO_NODES_ASSETS')}</Typography>
                  </View>
                  <View style={wizardStyles.purgeItem}>
                    <TrashIcon size={12} color={theme.error} />
                    <Typography variant="caption" style={wizardStyles.purgeText}>{t('SIMULATION_HISTORY')}</Typography>
                  </View>
                  <View style={wizardStyles.purgeItem}>
                    <TrashIcon size={12} color={theme.error} />
                    <Typography variant="caption" style={wizardStyles.purgeText}>{t('SUPPORT_COMMUNICATIONS')}</Typography>
                  </View>
                </View>

                <View style={wizardStyles.actions}>
                  <TouchableOpacity style={wizardStyles.cancelBtn} onPress={() => setIsDeleting(false)}>
                    <Typography variant="monoBold" style={{ color: theme.textTertiary }}>{t('ABORT')}</Typography>
                  </TouchableOpacity>
                  <TouchableOpacity style={[wizardStyles.nextBtn, { backgroundColor: theme.error }]} onPress={() => setCurrentStep(2)}>
                    <Typography variant="monoBold" style={{ color: '#fff' }}>{t('I_UNDERSTAND')}</Typography>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {currentStep === 2 && (
              <View style={wizardStyles.step}>
                <View style={[wizardStyles.warningIconBox, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                  <ShieldAlertIcon size={32} color={theme.primary} />
                </View>
                <Typography variant="mono" style={wizardStyles.label}>{verificationType === 'password' ? t('CREDENTIAL_VERIFICATION') : t('OTP_VERIFICATION')}</Typography>
                
                <View style={[wizardStyles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
                  <View style={wizardStyles.iconBox}>
                    {verificationType === 'password' ? <LockIcon size={16} color={theme.primary} /> : <MailIcon size={16} color={theme.primary} />}
                  </View>
                  <TextInput
                    style={[wizardStyles.input, { color: theme.textPrimary }]}
                    secureTextEntry={verificationType === 'password'}
                    value={verificationType === 'password' ? password : otpCode}
                    onChangeText={verificationType === 'password' ? setPassword : setOtpCode}
                    placeholder={verificationType === 'password' ? t('ENTER_SECRET_KEY') : '000000'}
                    placeholderTextColor={theme.textTertiary}
                    autoFocus
                  />
                </View>

                <TouchableOpacity onPress={handleSendOtp} style={{ alignSelf: 'center', marginTop: 12 }}>
                  <Typography variant="caption" style={{ color: theme.primary }}>{verificationType === 'password' ? t('USE_EMAIL_OTP') : t('RESEND_OTP')}</Typography>
                </TouchableOpacity>

                <View style={wizardStyles.actions}>
                  <TouchableOpacity style={wizardStyles.cancelBtn} onPress={() => setCurrentStep(1)}>
                    <Typography variant="monoBold" style={{ color: theme.textTertiary }}>{t('BACK')}</Typography>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[wizardStyles.nextBtn, { backgroundColor: theme.primary }]} 
                    disabled={verificationType === 'password' ? !password : otpCode.length < 6}
                    onPress={() => setCurrentStep(3)}
                  >
                    <Typography variant="monoBold" style={{ color: theme.background }}>{t('AUTHENTICATE')}</Typography>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {currentStep === 3 && (
              <View style={wizardStyles.step}>
                <View style={[wizardStyles.warningIconBox, { backgroundColor: theme.error + '20', borderColor: theme.error }]}>
                  <AlertIcon size={32} color={theme.error} />
                </View>
                
                <View style={[wizardStyles.finalBox, { borderColor: theme.error + '40' }]}>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <InfoIcon size={14} color={theme.error} />
                    <Typography variant="monoBold" style={{ color: theme.error, fontSize: 10 }}>{t('IMMEDIATE_DISCONNECT')}</Typography>
                  </View>
                  <Typography variant="caption" style={{ color: theme.textTertiary }}>
                    {t('PURGE_BROADCAST_DESC')}
                  </Typography>
                </View>

                <View style={wizardStyles.actions}>
                  <TouchableOpacity style={wizardStyles.cancelBtn} onPress={() => setCurrentStep(2)}>
                    <Typography variant="monoBold" style={{ color: theme.textTertiary }}>{t('ABORT')}</Typography>
                  </TouchableOpacity>
                  <TouchableOpacity style={[wizardStyles.nextBtn, { backgroundColor: theme.error }]} onPress={handleFinalPurge}>
                    <Typography variant="monoBold" style={{ color: '#fff' }}>{t('EXECUTE_PURGE')}</Typography>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {currentStep === 4 && (
              <View style={wizardStyles.step}>
                <View style={[wizardStyles.warningIconBox, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                  <CheckIcon size={32} color={theme.primary} />
                </View>
                <Typography variant="h3" style={{ color: theme.textPrimary, textAlign: 'center' }}>{t('PURGE_COMPLETE')}</Typography>
                <Typography variant="mono" style={{ color: theme.textTertiary, textAlign: 'center', marginTop: 8 }}>{t('REDIRECT_INITIATED')}</Typography>
              </View>
            )}

          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const wizardStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,7,10,0.95)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    padding: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,7,10,0.8)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  closeBtn: {
    padding: 4,
  },
  step: {
    gap: 20,
  },
  warningIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  desc: {
    textAlign: 'center',
    lineHeight: 20,
  },
  purgeList: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  purgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  purgeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    letterSpacing: 1,
  },
  label: {
    fontSize: 9,
    letterSpacing: 2,
    textAlign: 'center',
    color: '#848D97',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 60,
  },
  iconBox: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: (sharedTheme as any).typography.fonts.mono,
  },
  finalBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 69, 58, 0.05)',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nextBtn: {
    flex: 2,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingTop: 64,
  },
  header: {
    marginBottom: 32,
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
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 4,
  },
  controlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  dangerCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  controlInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  textStack: {
    flex: 1,
    gap: 4,
  },
  complianceBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
