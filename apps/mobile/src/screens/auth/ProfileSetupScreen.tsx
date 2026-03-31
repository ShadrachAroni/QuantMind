import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { supabase } from '../../services/supabase';
import { Typography } from '../../components/ui/Typography';
import { GlassCard } from '../../components/ui/GlassCard';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { hexToRgba } from '../../utils/themeUtils';
import { Brain, Globe, Shield, Activity, ChevronRight, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const REGIONS = [
  { id: 'US_EAST_NY', name: 'US East (New York)', signal: 'LOW_LATENCY' },
  { id: 'EU_WEST_LDN', name: 'Europe West (London)', signal: 'OPTIMAL' },
  { id: 'AP_SOUTH_SIN', name: 'Asia Pacific (Singapore)', signal: 'STABLE' },
];

const EXPERTISE_LEVELS = [
  { id: 'beginner', name: 'NEOPHYTE', desc: 'Standard narrative adaptation. High-clarity explanations.' },
  { id: 'intermediate', name: 'PRACTITIONER', desc: 'Balanced technicality. Focus on correlation clusters.' },
  { id: 'advanced', name: 'ARCHITECT', desc: 'Raw stochastic data. Minimal narrative padding.' },
];

const PERSONAS = [
  { id: 'ANALYTICAL_COLD', name: 'ANALYTICAL' },
  { id: 'AGGRESSIVE_STOCHASTIC', name: 'AGGRESSIVE' },
  { id: 'QUANTUM_EQUILIBRIUM', name: 'EQUILIBRIUM' },
];

export function ProfileSetupScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { theme, isDark } = useTheme();
  const { user, setOnboardingCompleted } = useAuthStore();

  // Profile State
  const [region, setRegion] = useState('US_EAST_NY');
  const [expertise, setExpertise] = useState('intermediate');
  const [persona, setPersona] = useState('ANALYTICAL_COLD');
  const [analyticsConsent, setAnalyticsConsent] = useState(true);

  const BrainIcon = Brain as any;
  const GlobeIcon = Globe as any;
  const ShieldIcon = Shield as any;
  const ActivityIcon = Activity as any;
  const ChevronIcon = ChevronRight as any;
  const CheckIcon = Check as any;

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          region,
          ai_expertise: expertise,
          ai_persona: persona,
          analytics_consent: analyticsConsent,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local store to trigger navigation change
      setOnboardingCompleted(true);
    } catch (err: any) {
      console.error('Mobile onboarding sync failure:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const dynamicStyles = getStyles(theme, isDark);

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <StatusBar hidden={true} />
      
      <LinearGradient
        colors={[
          hexToRgba(theme.primary, 0.05),
          theme.background,
        ]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.header}>
          <View style={[dynamicStyles.iconWrapper, { backgroundColor: hexToRgba(theme.primary, 0.1), borderColor: hexToRgba(theme.primary, 0.2) }]}>
            <BrainIcon size={32} color={theme.primary} />
          </View>
          <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>NEURAL CALIBRATION</Typography>
          <Typography variant="body" style={[dynamicStyles.subtitle, { color: theme.textSecondary }]}>
            Configure your operator profile to optimize throughput.
          </Typography>

          <View style={dynamicStyles.progressContainer}>
            {[1, 2, 3].map(i => (
              <View 
                key={i} 
                style={[
                  dynamicStyles.progressDot, 
                  { 
                    backgroundColor: step >= i ? theme.primary : hexToRgba(theme.textTertiary, 0.1),
                    width: step === i ? 24 : 8
                  }
                ]} 
              />
            ))}
          </View>
        </View>

        <GlassCard intensity="high" style={[dynamicStyles.card, { borderColor: theme.border }]}>
          {step === 1 && (
            <View style={dynamicStyles.stepContent}>
              <View style={dynamicStyles.stepHeader}>
                <GlobeIcon size={18} color={theme.primary} />
                <Typography variant="monoBold" style={{ color: theme.textPrimary, marginLeft: 8 }}>REGIONAL_LATENCY</Typography>
              </View>
              
              <View style={dynamicStyles.optionsGrid}>
                {REGIONS.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => setRegion(r.id)}
                    style={[
                      dynamicStyles.optionButton,
                      { 
                        backgroundColor: region === r.id ? hexToRgba(theme.primary, 0.05) : 'rgba(0,0,0,0.02)',
                        borderColor: region === r.id ? theme.primary : theme.border
                      }
                    ]}
                  >
                    <View>
                      <Typography variant="h4" style={{ color: region === r.id ? theme.primary : theme.textPrimary }}>{r.name}</Typography>
                      <Typography variant="caption" style={{ color: theme.textTertiary, fontStyle: 'italic' }}>{r.signal}</Typography>
                    </View>
                    {region === r.id && <CheckIcon size={18} color={theme.primary} />}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[dynamicStyles.primaryButton, { backgroundColor: theme.primary }]} onPress={nextStep}>
                <Typography variant="monoBold" style={{ color: theme.background }}>CONTINUE_PROTOCOL</Typography>
                <ChevronIcon size={18} color={theme.background} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={dynamicStyles.stepContent}>
              <View style={dynamicStyles.stepHeader}>
                <BrainIcon size={18} color={theme.primary} />
                <Typography variant="monoBold" style={{ color: theme.textPrimary, marginLeft: 8 }}>NEURAL_ADAPTATION</Typography>
              </View>

              <View style={dynamicStyles.optionsGrid}>
                {EXPERTISE_LEVELS.map(lev => (
                  <TouchableOpacity
                    key={lev.id}
                    onPress={() => setExpertise(lev.id)}
                    style={[
                      dynamicStyles.optionButton,
                      { 
                        backgroundColor: expertise === lev.id ? hexToRgba(theme.primary, 0.05) : 'rgba(0,0,0,0.02)',
                        borderColor: expertise === lev.id ? theme.primary : theme.border,
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: 16
                      }
                    ]}
                  >
                    <Typography variant="h4" style={{ color: expertise === lev.id ? theme.primary : theme.textPrimary }}>{lev.name}</Typography>
                    <Typography variant="caption" style={{ color: theme.textTertiary, marginTop: 4 }}>{lev.desc}</Typography>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={dynamicStyles.personaSection}>
                <Typography variant="caption" style={{ color: theme.textTertiary, marginBottom: 12 }}>AI_PERSONA_PREFERENCE</Typography>
                <View style={dynamicStyles.personaGrid}>
                  {PERSONAS.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setPersona(p.id)}
                      style={[
                        dynamicStyles.personaButton,
                        { 
                          backgroundColor: persona === p.id ? hexToRgba(theme.primary, 0.1) : 'rgba(0,0,0,0.02)',
                          borderColor: persona === p.id ? theme.primary : theme.border
                        }
                      ]}
                    >
                      <Typography variant="caption" style={{ color: persona === p.id ? theme.primary : theme.textTertiary, fontSize: 8 }}>{p.name}</Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={dynamicStyles.buttonRow}>
                <TouchableOpacity style={[dynamicStyles.secondaryButton, { borderColor: theme.border }]} onPress={prevStep}>
                  <Typography variant="monoBold" style={{ color: theme.textSecondary }}>BACK</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={[dynamicStyles.primaryButton, { backgroundColor: theme.primary, flex: 2 }]} onPress={nextStep}>
                  <Typography variant="monoBold" style={{ color: theme.background }}>PROCEED</Typography>
                  <ChevronIcon size={18} color={theme.background} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={dynamicStyles.stepContent}>
              <View style={dynamicStyles.stepHeader}>
                <ShieldIcon size={18} color={theme.primary} />
                <Typography variant="monoBold" style={{ color: theme.textPrimary, marginLeft: 8 }}>FINAL_COMPLIANCE</Typography>
              </View>

              <GlassCard intensity="low" style={dynamicStyles.consentBox}>
                <View style={dynamicStyles.consentRow}>
                  <TouchableOpacity
                    onPress={() => setAnalyticsConsent(!analyticsConsent)}
                    style={[
                      dynamicStyles.checkbox,
                      { 
                        borderColor: analyticsConsent ? theme.primary : theme.border,
                        backgroundColor: analyticsConsent ? theme.primary + '15' : 'transparent'
                      }
                    ]}
                  >
                    {analyticsConsent && <CheckIcon size={12} color={theme.primary} />}
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Typography variant="h4" style={{ color: theme.textPrimary, fontSize: 12 }}>STOCHASTIC_ANALYTICS</Typography>
                    <Typography variant="caption" style={{ color: theme.textTertiary, marginTop: 4 }}>
                      Enable anonymized collection to refine neural models and platform stability.
                    </Typography>
                  </View>
                </View>
              </GlassCard>

              <View style={[dynamicStyles.statusBox, { backgroundColor: hexToRgba(theme.primary, 0.05), borderColor: hexToRgba(theme.primary, 0.2) }]}>
                <ActivityIcon size={18} color={theme.primary} />
                <Typography variant="caption" style={{ color: theme.primary, marginLeft: 12, flex: 1 }}>All systems calibrated. Network handshake pending validation.</Typography>
              </View>

              <View style={dynamicStyles.buttonRow}>
                <TouchableOpacity style={[dynamicStyles.secondaryButton, { borderColor: theme.border }]} onPress={prevStep}>
                  <Typography variant="monoBold" style={{ color: theme.textSecondary }}>BACK</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={[dynamicStyles.primaryButton, { backgroundColor: theme.primary, flex: 2, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 }]} onPress={handleComplete}>
                  <Typography variant="monoBold" style={{ color: theme.background }}>DEPLOY_PROFILE</Typography>
                  <CheckIcon size={18} color={theme.background} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </GlassCard>

        <Typography variant="mono" style={dynamicStyles.footerText}>
          QuantMind Institutional Node // SECURE_HANDSHAKE
        </Typography>
      </ScrollView>

      <LoadingOverlay visible={loading} message="SYNCING_IDENTITY_PROTOCOL..." />
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },
  card: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
  },
  stepContent: {
    gap: 24,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsGrid: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  primaryButton: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  personaSection: {
    marginTop: 8,
  },
  personaGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  personaButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  consentBox: {
    padding: 20,
    borderRadius: 20,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 8,
    opacity: 0.3,
    letterSpacing: 2,
  },
});
