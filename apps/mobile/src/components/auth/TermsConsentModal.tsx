import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { GlowEffect } from '../ui/GlowEffect';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Shield, Check, Terminal, ScrollText } from 'lucide-react-native';
import { supabase } from '../../services/supabase';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function TermsConsentModal() {
  const { needsTosConsent, latestTosVersion, acceptTerms, isLoading } = useAuthStore();
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [content, setContent] = useState<string>('');
  const [fetchingContent, setFetchingContent] = useState(true);

  useEffect(() => {
    if (needsTosConsent && latestTosVersion) {
      fetchTosContent();
    }
  }, [needsTosConsent, latestTosVersion]);

  const fetchTosContent = async () => {
    setFetchingContent(true);
    try {
      const { data, error } = await supabase
        .from('tos_versions')
        .select('content')
        .eq('version', latestTosVersion)
        .single();
      
      if (error) throw error;
      setContent(data.content);
    } catch (e) {
      console.error('Failed to fetch ToS content', e);
      // No toast here as it might spam during init
    } finally {
      setFetchingContent(false);
    }
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    if (isCloseToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!isAccepted) return;
    
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const ip = data.ip || '0.0.0.0';

      await acceptTerms(ip);
      showToast('AUDIT_EVENT: Protocol consent recorded.', 'success');
    } catch (e) {
      showToast('Acknowledgment failed. Terminal link unstable.', 'error');
    }
  };

  if (!needsTosConsent) return null;

  const ShieldIcon = Shield as any;
  const CheckIcon = Check as any;
  const TerminalIcon = Terminal as any;
  const ScrollIcon = ScrollText as any;

  return (
    <Modal visible={true} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.backgroundGlow}>
          <GlowEffect color={theme.primary} size={400} glowRadius={200} />
        </View>

        <GlassCard intensity="high" style={styles.container}>
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '33' }]}>
              <ShieldIcon size={24} color={theme.primary} />
            </View>
            <View style={styles.headerText}>
              <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10 }}>COMPLIANCE_PROTOCOL_REQUIRED</Typography>
              <Typography variant="h3" style={{ color: theme.textPrimary, letterSpacing: 2 }}>TERMS_OF_SERVICE</Typography>
              <Typography variant="caption" style={{ color: theme.primary }}>VERSION: {latestTosVersion}</Typography>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.contentContainer}>
            {fetchingContent ? (
              <View style={styles.loader}>
                <ActivityIndicator color={theme.primary} size="large" />
                <Typography variant="mono" style={{ color: theme.textTertiary, marginTop: 12 }}>DECRYPTING_VERSION_{latestTosVersion}...</Typography>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <ScrollView 
                  style={styles.scrollView}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  <Typography variant="mono" style={[styles.tosText, { color: theme.textSecondary }]}>
                    {content}
                  </Typography>
                  <View style={{ height: 40 }} />
                </ScrollView>
                
                {!hasScrolledToBottom && (
                  <View style={[styles.scrollHint, { backgroundColor: theme.background + 'EE', borderColor: theme.primary + '33' }]}>
                    <Typography variant="mono" style={{ color: theme.primary, fontSize: 10 }}>SCROLL_TO_END_TO_ACTIVATE</Typography>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setIsAccepted(!isAccepted)}
              disabled={!hasScrolledToBottom}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: isAccepted ? theme.primary : theme.textTertiary, backgroundColor: isAccepted ? theme.primary + '20' : 'transparent' },
                !hasScrolledToBottom && { opacity: 0.3 }
              ]}>
                {isAccepted && <CheckIcon size={14} color={theme.primary} />}
              </View>
              <Typography variant="body" style={[
                styles.checkboxLabel, 
                { color: isAccepted ? theme.textPrimary : theme.textTertiary },
                !hasScrolledToBottom && { opacity: 0.3 }
              ]}>
                I explicitly acknowledge and accept the terms of the QuantMind Operating Protocol.
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.acceptButton, 
                { backgroundColor: isAccepted ? theme.primary : theme.textTertiary + '33' },
                (!isAccepted || isLoading) && { opacity: 0.5 }
              ]}
              onPress={handleAccept}
              disabled={!isAccepted || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.background} size="small" />
              ) : (
                <>
                  <TerminalIcon size={18} color={theme.background} />
                  <Typography variant="monoBold" style={[styles.acceptText, { color: theme.background }]}>ACCEPT_PROTOCOL</Typography>
                </>
              )}
            </TouchableOpacity>
            
            <View style={styles.auditNote}>
              <Typography variant="caption" style={{ color: theme.textTertiary, fontSize: 8 }}>
                AUDIT_LOGGING_ACTIVE // IP_TRACE: CAPTURED
              </Typography>
            </View>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backgroundGlow: {
    position: 'absolute',
    opacity: 0.3,
  },
  container: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.1,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  tosText: {
    fontSize: 12,
    lineHeight: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  footer: {
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  acceptButton: {
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  acceptText: {
    fontSize: 13,
    letterSpacing: 2,
  },
  auditNote: {
    marginTop: 12,
    alignItems: 'center',
    opacity: 0.4,
  }
});
