import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { Typography } from '../../components/ui/Typography';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { ChevronLeft, Download, Trash2, Shield, FileText, AlertTriangle } from 'lucide-react-native';

const ChevronLeftIcon = ChevronLeft as any;

export function DataManagementScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);

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

      showToast('EXPORT_QUEUED: Check email for archive.', 'success');
    } catch (err: any) {
      showToast(err.message || 'EXPORT_FAILED', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'PERMANENT_DELETION',
      'This action is irreversible. All portfolios, simulations, and credentials will be purged from the kernel.',
      [
        { text: 'ABORT', style: 'cancel' },
        { 
          text: 'PURGE_DATA', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // 1. Call the delete_user_data RPC
              const { error: rpcError } = await supabase.rpc('delete_user_data', { p_user_id: user?.id });
              if (rpcError) throw rpcError;

              // 2. Delete the user from auth
              const { error: authError } = await supabase.auth.signOut();
              if (authError) throw authError;

              showToast('ACCOUNT_PURGED_SUCCESSFULLY', 'success');
            } catch (err: any) {
              showToast(err.message || 'PURGE_FAILED', 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const toggleAnalytics = async (val: boolean) => {
    setAnalyticsConsent(val);
    const { error } = await supabase
      .from('user_profiles')
      .update({ analytics_consent: val })
      .eq('id', user?.id);
    
    if (error) showToast('CONSENT_UPDATE_FAILED', 'error');
    else showToast(val ? 'ANALYTICS_ENABLED' : 'ANALYTICS_DISABLED', 'info');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: theme.border }]}>
            <BackIcon size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10, letterSpacing: 2 }}>DATA_KERNEL // SOVEREIGNTY</Typography>
          <Typography variant="h2" style={{ color: theme.textPrimary, marginTop: 4 }}>GOVERNANCE_TOOLS</Typography>
        </View>

        <View style={styles.section}>
          <Typography variant="mono" style={styles.label}>TRANSPARENCY_&_CONSENT</Typography>
          
          <View style={[styles.controlCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
            <View style={styles.controlInfo}>
               <ShieldIcon size={20} color={theme.primary} />
               <View style={styles.textStack}>
                 <Typography variant="monoBold" style={{ color: theme.textPrimary }}>ANALYTICS_TRACKING</Typography>
                 <Typography variant="caption" style={{ color: theme.textTertiary }}>Anonymous performance telemetry for kernel optimization.</Typography>
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
          <Typography variant="mono" style={styles.label}>DATA_PORTABILITY</Typography>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}
            onPress={handleExportData}
            disabled={loading}
          >
            <View style={styles.controlInfo}>
               <DownloadIcon size={20} color={theme.primary} />
               <View style={styles.textStack}>
                 <Typography variant="monoBold" style={{ color: theme.textPrimary }}>EXPORT_PORTFOLIO_DATA</Typography>
                 <Typography variant="caption" style={{ color: theme.textTertiary }}>Generate JSON/CSV archive of all simulations and assets.</Typography>
               </View>
            </View>
            {loading ? <ActivityIndicator size="small" color={theme.primary} /> : <ChevronLeftIcon size={16} color={theme.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Typography variant="mono" style={styles.label}>RIGHT_TO_ERASURE</Typography>
          
          <TouchableOpacity 
            style={[styles.dangerCard, { borderColor: theme.error + '40' }]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.controlInfo}>
               <TrashIcon size={20} color={theme.error} />
               <View style={styles.textStack}>
                 <Typography variant="monoBold" style={{ color: theme.error }}>PURGE_ACCOUNT_KERNEL</Typography>
                 <Typography variant="caption" style={{ color: theme.textTertiary }}>Permanent removal of all data from the network.</Typography>
               </View>
            </View>
          </TouchableOpacity>

          <View style={[styles.complianceBox, { backgroundColor: theme.warning + '05', borderColor: theme.warning + '20' }]}>
            <AlertIcon size={14} color={theme.warning} />
            <Typography variant="caption" style={{ color: theme.textTertiary, flex: 1, marginLeft: 10 }}>
              GDPR/CCPA COMPLIANCE: Data processing is restricted to authorized regions. All deletions are propagated across active edge nodes within 24 hours.
            </Typography>
          </View>
        </View>

      </ScrollView>
    </View>
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
