import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../services/supabase';
import { Typography } from '../../components/ui/Typography';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { ChevronLeft, Monitor, Smartphone, Globe, LogOut, ShieldCheck, Zap } from 'lucide-react-native';

export function ActiveSessionsScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Mock sessions for UI demonstration (Rule 10.5)
  // Real session listing requires an Edge Function with Service Role access to auth.sessions
  const [sessions, setSessions] = useState([
    { id: '1', device: 'iPhone 15 Pro', location: 'London, UK', current: true, type: 'mobile', lastActive: 'ACTIVE_NOW' },
    { id: '2', device: 'Desktop (Chrome)', location: 'London, UK', current: false, type: 'web', lastActive: '12_MIN_AGO' },
    { id: '3', device: 'iPad Air', location: 'Paris, FR', current: false, type: 'tablet', lastActive: '2_DAYS_AGO' },
  ]);

  const BackIcon = ChevronLeft as any;
  const MonitorIcon = Monitor as any;
  const SmartphoneIcon = Smartphone as any;
  const GlobeIcon = Globe as any;
  const LogOutIcon = LogOut as any;
  const ShieldCheckIcon = ShieldCheck as any;
  const ZapIcon = Zap as any;

  const handleRevokeOthers = async () => {
    Alert.alert(
      'REVOKE_REMOTE_ACCESS',
      'This will terminate all sessions except the current one. Continue?',
      [
        { text: 'ABORT', style: 'cancel' },
        { 
          text: 'PERFORM_REVOCATION', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { error } = await supabase.auth.signOut({ scope: 'others' });
            setLoading(false);
            
            if (error) {
              showToast(error.message, 'error');
            } else {
              showToast('REMOTE_SESSIONS_TERMINATED', 'success');
              setSessions(sessions.filter(s => s.current));
            }
          }
        }
      ]
    );
  };

  const getDeviceIcon = (type: string) => {
    if (type === 'mobile') return <SmartphoneIcon size={20} color={theme.textPrimary} />;
    if (type === 'web') return <MonitorIcon size={20} color={theme.textPrimary} />;
    return <GlobeIcon size={20} color={theme.textPrimary} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: theme.border }]}>
            <BackIcon size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10, letterSpacing: 2 }}>SESSION_KERNEL // GOVERNANCE</Typography>
          <Typography variant="h2" style={{ color: theme.textPrimary, marginTop: 4 }}>ACTIVE_ACCESS_KEYS</Typography>
        </View>

        <View style={styles.statusBox}>
          <View style={[styles.statusBanner, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
            <ShieldCheckIcon size={24} color={theme.primary} />
            <View style={styles.bannerText}>
              <Typography variant="monoBold" style={{ color: theme.primary, fontSize: 12 }}>KERNEL_INTEGRITY: SECURE</Typography>
              <Typography variant="caption" style={{ color: theme.textSecondary }}>Monitoring {sessions.length} authorized access points.</Typography>
            </View>
          </View>
        </View>

        <Typography variant="mono" style={styles.label}>ENTRIES_FOUND</Typography>
        
        <View style={styles.sessionList}>
          {sessions.map((session) => (
            <View key={session.id} style={[styles.sessionCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: theme.border }]}>
               <View style={styles.sessionMain}>
                 <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                   {getDeviceIcon(session.type)}
                 </View>
                 <View style={styles.sessionInfo}>
                   <View style={styles.deviceRow}>
                    <Typography variant="monoBold" style={{ color: theme.textPrimary, fontSize: 13 }}>{session.device}</Typography>
                    {session.current && (
                      <View style={[styles.currentBadge, { backgroundColor: theme.success + '20' }]}>
                        <ZapIcon size={8} color={theme.success} />
                        <Typography variant="mono" style={{ color: theme.success, fontSize: 7, marginLeft: 4 }}>CURRENT</Typography>
                      </View>
                    )}
                   </View>
                   <Typography variant="caption" style={{ color: theme.textTertiary }}>{session.location} • {session.lastActive}</Typography>
                 </View>
               </View>
            </View>
          ))}
        </View>

        {sessions.length > 1 && (
          <TouchableOpacity 
            style={[styles.revokeBtn, { borderColor: theme.error }]} 
            onPress={handleRevokeOthers}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={theme.error} /> : (
              <>
                <Typography variant="monoBold" style={{ color: theme.error }}>TERMINATE_REMOTE_SESSIONS</Typography>
                <LogOutIcon size={16} color={theme.error} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <Typography variant="caption" style={{ color: theme.textTertiary, textAlign: 'center' }}>
            Per QuantMind Security Protocol §10.5, all session invalidations are immediate across the global edge network.
          </Typography>
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
  statusBox: {
    marginBottom: 24,
  },
  statusBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 16,
  },
  sessionList: {
    gap: 12,
  },
  sessionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sessionMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    marginLeft: 16,
    flex: 1,
    gap: 4,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  revokeBtn: {
    marginTop: 32,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  infoBox: {
    marginTop: 40,
    paddingHorizontal: 20,
    opacity: 0.6,
  },
});
