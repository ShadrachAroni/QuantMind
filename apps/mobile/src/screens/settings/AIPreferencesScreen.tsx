import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { useAuthStore } from '../../store/authStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { 
  ChevronLeft, 
  Zap, 
  Brain, 
  Activity, 
  Mic, 
  AlertTriangle, 
  Cpu, 
  Globe, 
  Layers,
  Shield,
  ZapOff,
  TrendingUp,
  Building2,
  BrainCircuit
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { sharedTheme } from '../../constants/theme';
import { AIPersona } from '../../store/authStore';

const { width } = Dimensions.get('window');

// ─── Types & Metadata ────────────────────────────────────────────────────────

type AIModel = 'haiku' | 'sonnet' | 'opus';
type AIExpertise = 'beginner' | 'intermediate' | 'advanced';

const PERSONA_INFO: Record<AIPersona, { title: string; subtitle: string; icon: any; color: string; description: string }> = {
  DEFAULT: {
    title: 'BALANCED_ORACLE',
    subtitle: 'STANDARD_COG',
    icon: BrainCircuit,
    color: '#00D4FF',
    description: 'Optimal equilibrium between preservation and growth-oriented insights.',
  },
  AGGRESSIVE: {
    title: 'KINETIC_ALPHA',
    subtitle: 'HIGH_VOL_EXPERT',
    icon: TrendingUp,
    color: '#F43F5E',
    description: 'Prioritizes high-yield opportunities and momentum-driven risk profiles.',
  },
  CONSERVATIVE: {
    title: 'SECURE_SENTINEL',
    subtitle: 'RISK_ADVERSE_LOGIC',
    icon: Shield,
    color: '#10B981',
    description: 'Maximum emphasis on capital preservation and defensive algorithmic strategy.',
  },
  INSTITUTIONAL: {
    title: 'PRIME_BROKER_AI',
    subtitle: 'MULTI_FACTOR_GRID',
    icon: Building2,
    color: '#7B5FFF',
    description: 'Simulates top-tier hedge fund modeling and complex institutional heuristics.',
  },
};

const MODEL_INFO: Record<AIModel, { title: string; description: string; latency: string; cognition: string; color: string; glowColor: string; accentBg: string }> = {
  haiku: {
    title: 'Quantum Haiku',
    description: 'Lightning-fast execution for high-frequency analysis.',
    latency: '120ms avg',
    cognition: 'Level 3 Gen',
    color: '#2DD4BF',
    glowColor: 'rgba(45, 212, 191, 0.25)',
    accentBg: 'rgba(45, 212, 191, 0.12)',
  },
  sonnet: {
    title: 'Quantum Sonnet',
    description: 'Balanced depth for complex portfolio analysis.',
    latency: '380ms avg',
    cognition: 'Level 4 Gen',
    color: '#00D4FF',
    glowColor: 'rgba(0, 212, 255, 0.25)',
    accentBg: 'rgba(0, 212, 255, 0.12)',
  },
  opus: {
    title: 'Quantum Opus',
    description: 'Maximum reasoning power for deep strategic synthesis.',
    latency: '1.2s avg',
    cognition: 'Level 5 Gen',
    color: '#7B5FFF',
    glowColor: 'rgba(123, 95, 255, 0.25)',
    accentBg: 'rgba(123, 95, 255, 0.12)',
  },
};

const MODELS: AIModel[] = ['haiku', 'sonnet', 'opus'];
const EXPERTISE_LEVELS: AIExpertise[] = ['beginner', 'intermediate', 'advanced'];

// ─── Component ────────────────────────────────────────────────────────────────

export function AIPreferencesScreen({ navigation }: any) {
  const { aiPrefs, aiPersona, aiRiskSensitivity, updateAIPreferences, updateAIPersona, updateAIRiskSensitivity } = useAuthStore();
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();

  const [localPrefs, setLocalPrefs] = useState({
    ai_model: aiPrefs?.ai_model ?? 'sonnet',
    ai_expertise: aiPrefs?.ai_expertise ?? 'intermediate',
    ai_portfolio_doctor: aiPrefs?.ai_portfolio_doctor ?? true,
    ai_voice_synthesis: aiPrefs?.ai_voice_synthesis ?? false,
    ai_risk_alerts: aiPrefs?.ai_risk_alerts ?? true,
  });
  const [localPersona, setLocalPersona] = useState<AIPersona>(aiPersona);
  const [localRisk, setLocalRisk] = useState(aiRiskSensitivity);
  const [saving, setSaving] = useState(false);

  const BackIcon = ChevronLeft as any;
  const BrainIcon = Brain as any;
  const ActivityIcon = Activity as any;
  const MicIcon = Mic as any;
  const AlertIcon = AlertTriangle as any;
  const CpuIcon = Cpu as any;
  const GlobeIcon = Globe as any;
  const BrainCircuitIcon = BrainCircuit as any;

  const selectedModel = MODEL_INFO[localPrefs.ai_model as AIModel];
  const expertiseIndex = EXPERTISE_LEVELS.indexOf(localPrefs.ai_expertise as AIExpertise);
  const expertisePct = expertiseIndex === 0 ? '15%' : expertiseIndex === 1 ? '50%' : '85%';
  const riskPct = `${localRisk}%`;

  const dynamicStyles = getStyles(theme, isDark);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAIPreferences(localPrefs as any);
      await updateAIPersona(localPersona);
      await updateAIRiskSensitivity(localRisk);
      showToast('AI_KERNEL_STABILIZED: Cognitive patterns synced.', 'success');
      navigation.goBack();
    } catch (err: any) {
      showToast(err.message.toUpperCase(), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backButton, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
          <BackIcon size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        <Typography variant="h1" style={[dynamicStyles.headerTitle, { color: theme.textPrimary }]}>AI_KERNEL_GUI</Typography>
      </View>

      <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
        
        <Typography variant="h3" style={[dynamicStyles.sectionLabel, { color: theme.textTertiary }]}>PHASE_1: COGNITIVE_PERSONA</Typography>
        <View style={dynamicStyles.personaGrid}>
          {(['DEFAULT', 'AGGRESSIVE', 'CONSERVATIVE', 'INSTITUTIONAL'] as AIPersona[]).map((p) => {
            const info = PERSONA_INFO[p];
            const active = localPersona === p;
            const Icon = info.icon;
            return (
              <TouchableOpacity 
                key={p} 
                onPress={() => setLocalPersona(p)}
                activeOpacity={0.8}
                style={dynamicStyles.personaItem}
              >
                <GlassCard 
                  intensity={active ? 'high' : 'low'} 
                  style={[
                    dynamicStyles.personaCard, 
                    active && { borderColor: info.color + '66', backgroundColor: info.color + '10' }
                  ]}
                >
                  <View style={[dynamicStyles.personaIconBox, { backgroundColor: active ? info.color + '22' : theme.background + '44' }]}>
                    <Icon size={20} color={active ? info.color : theme.textTertiary} />
                  </View>
                  <Typography variant="monoBold" style={[dynamicStyles.personaTitle, { color: active ? theme.textPrimary : theme.textSecondary }]}>{info.title}</Typography>
                  <Typography variant="mono" style={[dynamicStyles.personaSubtitle, { color: active ? info.color : theme.textTertiary }]}>{info.subtitle}</Typography>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        <GlassCard intensity="low" style={dynamicStyles.personaDescBox}>
          <Typography variant="caption" style={{ color: PERSONA_INFO[localPersona].color, fontFamily: sharedTheme.typography.fonts.mono }}>
            PERSONA_INTELLIGENCE: {PERSONA_INFO[localPersona].description}
          </Typography>
        </GlassCard>

        <Typography variant="h3" style={[dynamicStyles.sectionLabel, { color: theme.textTertiary, marginTop: 12 }]}>PHASE_2: RISK_SENSITIVITY_THRESHOLD</Typography>
        <GlassCard style={dynamicStyles.controlCard}>
          <View style={dynamicStyles.controlHeader}>
            <Typography variant="mono" style={[dynamicStyles.controlMeta, { color: theme.textTertiary }]}>SENSITIVITY_INDEX</Typography>
            <Typography variant="monoBold" style={{ color: localRisk > 70 ? theme.error : localRisk > 40 ? theme.primary : theme.secondary }}>
              {localRisk.toString().padStart(3, '0')}%
            </Typography>
          </View>
          <View style={[dynamicStyles.sliderTrack, { backgroundColor: theme.border + '33' }]}>
            <View style={[dynamicStyles.sliderFill, { width: riskPct as any, backgroundColor: localRisk > 70 ? theme.error : theme.primary }]} />
            <TouchableOpacity 
              activeOpacity={1}
              style={{ position: 'absolute', width: '100%', height: 40, top: -20 }}
              onPress={(e) => {
                const newRisk = Math.round((e.nativeEvent.locationX / (width - 64)) * 100);
                setLocalRisk(Math.max(0, Math.min(100, newRisk)));
              }}
            />
            <View style={[dynamicStyles.sliderThumb, { left: riskPct as any, borderColor: localRisk > 70 ? theme.error : theme.primary }]} />
          </View>
          <Typography variant="caption" style={{ color: theme.textTertiary, textAlign: 'center', fontSize: 8 }}>ADJUST SLIDER TO CALIBRATE COGNITIVE RISK FILTER</Typography>
        </GlassCard>

        <Typography variant="h3" style={[dynamicStyles.sectionLabel, { color: theme.textTertiary }]}>PHASE_3: CORE_LOGIC_SYNTHESIS</Typography>
        <GlassCard style={dynamicStyles.modelGrid}>
          <View style={[dynamicStyles.modelTabRow, { backgroundColor: theme.border + '22' }]}>
            {MODELS.map((m) => {
              const active = localPrefs.ai_model === m;
              const info = MODEL_INFO[m as AIModel];
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    dynamicStyles.modelTab,
                    active && { backgroundColor: info.accentBg, borderColor: info.color + '44' },
                  ]}
                  onPress={() => setLocalPrefs(p => ({ ...p, ai_model: m }))}
                >
                  <Typography
                    variant="mono"
                    style={[dynamicStyles.modelTabText, { color: active ? info.color : theme.textTertiary }]}
                  >
                    {m.toUpperCase()}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={dynamicStyles.modelDetail}>
            <View style={[dynamicStyles.modelIconBox, { backgroundColor: selectedModel.accentBg, borderColor: selectedModel.color + '44' }]}>
               <GlowEffect color={selectedModel.color} size={30} glowRadius={15} style={dynamicStyles.iconGlow} />
               <Zap size={24} color={selectedModel.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="h2" style={[dynamicStyles.modelTitle, { color: theme.textPrimary }]}>{selectedModel.title.toUpperCase()}</Typography>
              <Typography variant="caption" style={[dynamicStyles.modelDesc, { color: theme.textTertiary }]}>{selectedModel.description}</Typography>
            </View>
          </View>

          <View style={dynamicStyles.statsRow}>
            <GlassCard intensity="low" style={dynamicStyles.statTile}>
              <Typography variant="mono" style={[dynamicStyles.statLabel, { color: selectedModel.color }]}>LATENCY</Typography>
              <Typography variant="body" style={[dynamicStyles.statValue, { color: theme.textPrimary }]}>{selectedModel.latency}</Typography>
            </GlassCard>
            <GlassCard intensity="low" style={dynamicStyles.statTile}>
              <Typography variant="mono" style={[dynamicStyles.statLabel, { color: selectedModel.color }]}>COGNITION</Typography>
              <Typography variant="body" style={[dynamicStyles.statValue, { color: theme.textPrimary }]}>{selectedModel.cognition}</Typography>
            </GlassCard>
          </View>
        </GlassCard>

        <Typography variant="h3" style={[dynamicStyles.sectionLabel, { color: theme.textTertiary }]}>PHASE_4: VERBOSITY_TUNING</Typography>
        <GlassCard style={dynamicStyles.expertiseCard}>
          <View style={dynamicStyles.expertiseHeader}>
            <Typography variant="mono" style={[dynamicStyles.expertiseMeta, { color: theme.textTertiary }]}>LINGUISTIC_DENSITY</Typography>
            <Typography variant="mono" style={{ color: theme.primary }}>{localPrefs.ai_expertise.toUpperCase()}</Typography>
          </View>
          <View style={[dynamicStyles.sliderTrack, { backgroundColor: theme.border + '33' }]}>
            <View style={[dynamicStyles.sliderFill, { width: expertisePct as any, backgroundColor: theme.primary }]} />
            <View style={[dynamicStyles.sliderThumb, { left: expertisePct as any, borderColor: theme.primary }]} />
          </View>
          <View style={dynamicStyles.levelRow}>
            {EXPERTISE_LEVELS.map((lvl) => {
              const active = localPrefs.ai_expertise === lvl;
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[dynamicStyles.levelBtn, active && { backgroundColor: theme.primary + '10' }]}
                  onPress={() => setLocalPrefs(p => ({ ...p, ai_expertise: lvl as AIExpertise }))}
                >
                  <Typography variant="caption" style={[dynamicStyles.levelBtnText, { color: active ? theme.primary : theme.textTertiary }]}>{lvl.toUpperCase()}</Typography>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        <Typography variant="h3" style={[dynamicStyles.sectionLabel, { color: theme.textTertiary }]}>PHASE_5: COGNITIVE_LAYERS</Typography>
        
        <ToggleRow
          Icon={ActivityIcon}
          title="PORTFOLIO DOCTOR"
          subtitle="ACTIVE RISK HEALING"
          activeColor={theme.secondary}
          value={localPrefs.ai_portfolio_doctor}
          onValueChange={(v: boolean) => setLocalPrefs(p => ({ ...p, ai_portfolio_doctor: v }))}
          theme={theme}
        />

        <ToggleRow
          Icon={MicIcon}
          title="VOICE SYNTHESIS"
          subtitle="NEURAL AUDITORY KERNEL"
          activeColor={theme.primary}
          value={localPrefs.ai_voice_synthesis}
          onValueChange={(v: boolean) => setLocalPrefs(p => ({ ...p, ai_voice_synthesis: v }))}
          theme={theme}
        />

        <ToggleRow
          Icon={AlertIcon}
          title="HAWK-EYE ALERTS"
          subtitle="MAX RISK SENSITIVITY"
          activeColor={theme.error}
          value={localPrefs.ai_risk_alerts}
          onValueChange={(v: boolean) => setLocalPrefs(p => ({ ...p, ai_risk_alerts: v }))}
          theme={theme}
        />

        <TouchableOpacity
          style={[dynamicStyles.saveButton, saving && { opacity: 0.6 }, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <>
              <BrainIcon size={20} color={theme.background} />
              <Typography variant="button" style={[dynamicStyles.saveButtonText, { color: theme.background }]}>SYNCHRONIZE_LOGIC_KERNEL</Typography>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function ToggleRow({ Icon, title, subtitle, activeColor, value, onValueChange, theme }: any) {
  return (
    <GlassCard style={styles.toggleCard}>
      <View style={styles.toggleLeft}>
        <View style={[styles.toggleIconBox, value && { borderColor: activeColor + '88' }, { borderColor: theme.border, backgroundColor: theme.background + '33' }]}>
          <Icon size={18} color={value ? activeColor : theme.textTertiary} />
        </View>
        <View>
          <Typography variant="monoBold" style={[styles.toggleTitle, value && { color: activeColor }, { color: theme.textPrimary }]}>{title}</Typography>
          <Typography variant="caption" style={[styles.toggleSub, { color: theme.textTertiary }]}>{subtitle}</Typography>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: activeColor }}
        thumbColor={value ? '#FFF' : '#475569'}
        ios_backgroundColor={theme.border}
      />
    </GlassCard>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: { letterSpacing: 2, fontSize: 20 },
  scroll: { padding: 24 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 12, marginLeft: 4 },
  personaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  personaItem: { width: (width - 60) / 2 },
  personaCard: { padding: 16, borderRadius: 16, gap: 8, height: 140 },
  personaIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  personaTitle: { fontSize: 11, letterSpacing: 0.5 },
  personaSubtitle: { fontSize: 8, letterSpacing: 0.5 },
  personaDescBox: { padding: 12, borderRadius: 12, marginBottom: 32 },
  controlCard: { padding: 20, marginBottom: 32 },
  controlHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  controlMeta: { fontSize: 9, letterSpacing: 1 },
  sliderTrack: { height: 4, borderRadius: 2, marginBottom: 20, position: 'relative' },
  sliderFill: { position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 2 },
  sliderThumb: { position: 'absolute', top: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFF', borderWidth: 3, marginLeft: -8 },
  modelGrid: { padding: 16, marginBottom: 32 },
  modelTabRow: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4, marginBottom: 20 },
  modelTab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  modelTabText: { fontSize: 10, fontWeight: '700' },
  modelDetail: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  modelIconBox: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  iconGlow: { position: 'absolute', opacity: 0.4 },
  modelTitle: { letterSpacing: 1, fontSize: 15 },
  modelDesc: { fontSize: 9, lineHeight: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statTile: { flex: 1, padding: 12, borderRadius: 12 },
  statLabel: { fontSize: 8, letterSpacing: 1, marginBottom: 4 },
  statValue: { fontFamily: sharedTheme.typography.fonts.mono, fontSize: 11 },
  expertiseCard: { padding: 20, marginBottom: 32 },
  expertiseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  expertiseMeta: { fontSize: 9, letterSpacing: 1 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  levelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  levelBtnText: { fontSize: 9 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
    marginTop: 20,
    shadowColor: '#7B5FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: { fontWeight: '800', letterSpacing: 1, fontSize: 13 },
});

const styles = StyleSheet.create({
  toggleCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 12, borderRadius: 16 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  toggleIconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  toggleTitle: { fontSize: 12, letterSpacing: 0.5 },
  toggleSub: { fontSize: 8, letterSpacing: 1, marginTop: 2 },
});
