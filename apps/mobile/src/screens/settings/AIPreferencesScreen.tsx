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
import { ChevronLeft, Zap, Brain, Activity, Mic, AlertTriangle, Cpu, Globe, Layers } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { sharedTheme } from '../../constants/theme';

const { width } = Dimensions.get('window');

// ─── Types ──────────────────────────────────────────────────────────────────

type AIModel = 'haiku' | 'sonnet' | 'opus';
type AIExpertise = 'beginner' | 'intermediate' | 'advanced';

interface AIPrefs {
  ai_model: AIModel;
  ai_expertise: AIExpertise;
  ai_portfolio_doctor: boolean;
  ai_voice_synthesis: boolean;
  ai_risk_alerts: boolean;
}

// ─── Model metadata ───────────────────────────────────────────────────────────

const MODEL_INFO: Record<AIModel, { title: string; description: string; latency: string; cognition: string; color: string; glowColor: string; accentBg: string }> = {
  haiku: {
    title: 'Quantum Haiku',
    description: 'Lightning-fast execution for high-frequency analysis and instant market responses.',
    latency: '120ms avg',
    cognition: 'Level 3 Gen',
    color: '#2DD4BF',
    glowColor: 'rgba(45, 212, 191, 0.25)',
    accentBg: 'rgba(45, 212, 191, 0.12)',
  },
  sonnet: {
    title: 'Quantum Sonnet',
    description: 'Balanced cognitive depth for complex portfolio analysis and nuanced risk assessment.',
    latency: '380ms avg',
    cognition: 'Level 4 Gen',
    color: '#00D4FF',
    glowColor: 'rgba(0, 212, 255, 0.25)',
    accentBg: 'rgba(0, 212, 255, 0.12)',
  },
  opus: {
    title: 'Quantum Opus',
    description: 'Maximum reasoning power for deep multi-factor modeling and strategic synthesis.',
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
  const { aiPrefs, updateAIPreferences } = useAuthStore();
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();

  const [localPrefs, setLocalPrefs] = useState<AIPrefs>({
    ai_model: aiPrefs?.ai_model ?? 'sonnet',
    ai_expertise: aiPrefs?.ai_expertise ?? 'intermediate',
    ai_portfolio_doctor: aiPrefs?.ai_portfolio_doctor ?? true,
    ai_voice_synthesis: aiPrefs?.ai_voice_synthesis ?? false,
    ai_risk_alerts: aiPrefs?.ai_risk_alerts ?? true,
  });
  const [saving, setSaving] = useState(false);

  const BackIcon = ChevronLeft as any;
  const ZapIcon = Zap as any;
  const BrainIcon = Brain as any;
  const ActivityIcon = Activity as any;
  const MicIcon = Mic as any;
  const AlertIcon = AlertTriangle as any;
  const CpuIcon = Cpu as any;
  const GlobeIcon = Globe as any;

  const selectedModel = MODEL_INFO[localPrefs.ai_model];
  const expertiseIndex = EXPERTISE_LEVELS.indexOf(localPrefs.ai_expertise);
  const sliderPct = expertiseIndex === 0 ? '15%' : expertiseIndex === 1 ? '50%' : '85%';

  const dynamicStyles = getStyles(theme, isDark);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAIPreferences(localPrefs);
      showToast('CONFIG_APPLIED: Logic kernel re-synchronized.', 'success');
      navigation.goBack();
    } catch (err: any) {
      showToast(err.message.toUpperCase(), 'error');
    } finally {
      setSaving(false);
    }
  };

  const setModel = (m: AIModel) => setLocalPrefs(p => ({ ...p, ai_model: m }));
  const setExpertise = (e: AIExpertise) => setLocalPrefs(p => ({ ...p, ai_expertise: e }));

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backButton, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
          <BackIcon size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        <Typography variant="h1" style={[dynamicStyles.headerTitle, { color: theme.textPrimary }]}>AI CONTROL</Typography>
      </View>

      <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
        <Typography variant="h3" style={[dynamicStyles.sectionLabel, { color: theme.textTertiary }]}>CORE ENGINE SELECTION</Typography>
        <GlassCard style={dynamicStyles.modelGrid}>
          <View style={[dynamicStyles.modelTabRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }]}>
            {MODELS.map((m) => {
              const active = localPrefs.ai_model === m;
              const info = MODEL_INFO[m];
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    dynamicStyles.modelTab,
                    active && { backgroundColor: info.accentBg, borderColor: info.color + '44' },
                  ]}
                  onPress={() => setModel(m)}
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
               <ZapIcon size={24} color={selectedModel.color} />
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

        <Typography variant="h3" style={[dynamicStyles.sectionLabel, { color: theme.textTertiary }]}>NARRATIVE EXPERTISE</Typography>
        <GlassCard style={dynamicStyles.expertiseCard}>
          <View style={dynamicStyles.expertiseHeader}>
            <Typography variant="mono" style={[dynamicStyles.expertiseMeta, { color: theme.textTertiary }]}>VERBOSITY_ADAPT</Typography>
            <Typography variant="mono" style={{ color: theme.primary }}>
              {localPrefs.ai_expertise.toUpperCase()}
            </Typography>
          </View>

          <View style={[dynamicStyles.sliderTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <View style={[dynamicStyles.sliderFill, { width: sliderPct, backgroundColor: theme.primary }]} />
            <GlowEffect color={theme.primary} size={20} glowRadius={10} style={[dynamicStyles.thumbGlow, { left: sliderPct }]} />
            <View style={[dynamicStyles.sliderThumb, { left: sliderPct, borderColor: theme.primary }]} />
          </View>

          <View style={dynamicStyles.levelRow}>
            {EXPERTISE_LEVELS.map((lvl) => {
              const active = localPrefs.ai_expertise === lvl;
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[dynamicStyles.levelBtn, active && { backgroundColor: theme.primary + '10' }]}
                  onPress={() => setExpertise(lvl)}
                >
                  <Typography
                    variant="caption"
                    style={[dynamicStyles.levelBtnText, { color: active ? theme.primary : theme.textTertiary }]}
                  >
                    {lvl.toUpperCase()}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        <Typography variant="h3" style={[dynamicStyles.sectionLabel, { color: theme.textTertiary }]}>COGNITIVE PLUGINS</Typography>
        
        <ToggleRow
          Icon={ActivityIcon}
          title="PORTFOLIO DOCTOR"
          subtitle="ACTIVE RISK HEALING"
          activeColor={theme.secondary}
          value={localPrefs.ai_portfolio_doctor}
          onValueChange={(v) => setLocalPrefs(p => ({ ...p, ai_portfolio_doctor: v }))}
          theme={theme}
        />

        <ToggleRow
          Icon={MicIcon}
          title="VOICE SYNTHESIS"
          subtitle="NEURAL AUDITORY KERNEL"
          activeColor={theme.primary}
          value={localPrefs.ai_voice_synthesis}
          onValueChange={(v) => setLocalPrefs(p => ({ ...p, ai_voice_synthesis: v }))}
          theme={theme}
        />

        <ToggleRow
          Icon={AlertIcon}
          title="HAWK-EYE ALERTS"
          subtitle="MAX RISK SENSITIVITY"
          activeColor={theme.error}
          value={localPrefs.ai_risk_alerts}
          onValueChange={(v) => setLocalPrefs(p => ({ ...p, ai_risk_alerts: v }))}
          theme={theme}
        />

        <View style={dynamicStyles.footerStats}>
          <GlassCard style={dynamicStyles.footerStatTile}>
            <CpuIcon size={20} color={theme.primary} />
            <Typography variant="mono" style={[dynamicStyles.footerStatValue, { color: theme.textPrimary }]}>2.4 PB</Typography>
            <Typography variant="caption" style={[dynamicStyles.footerStatLabel, { color: theme.textTertiary }]}>MEM_ALLOC</Typography>
          </GlassCard>
          <GlassCard style={dynamicStyles.footerStatTile}>
            <GlobeIcon size={20} color={theme.secondary} />
            <Typography variant="mono" style={[dynamicStyles.footerStatValue, { color: theme.textPrimary }]}>GLOBAL</Typography>
            <Typography variant="caption" style={[dynamicStyles.footerStatLabel, { color: theme.textTertiary }]}>NODE_AFFINITY</Typography>
          </GlassCard>
        </View>

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
              <Typography variant="button" style={[dynamicStyles.saveButtonText, { color: theme.background }]}>RE-SYNC KERNEL</Typography>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ─── Toggle Row sub-component ────────────────────────────────────────────────

function ToggleRow({
  Icon, title, subtitle, activeColor, value, onValueChange, theme
}: {
  Icon: any; title: string; subtitle: string;
  activeColor: string;
  value: boolean; onValueChange: (v: boolean) => void;
  theme: any;
}) {
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sharedTheme.spacing.xl,
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
  headerTitle: {
    letterSpacing: 2,
    fontSize: 22,
  },
  scroll: {
    padding: sharedTheme.spacing.xl,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 4,
  },
  modelGrid: {
    padding: 16,
    marginBottom: 24,
  },
  modelTabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 20,
  },
  modelTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modelTabText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modelDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  modelIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    opacity: 0.5,
  },
  modelTitle: {
    letterSpacing: 1,
    fontSize: 16,
  },
  modelDesc: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statTile: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: sharedTheme.typography.fonts.mono,
    fontSize: 12,
  },
  expertiseCard: {
    padding: 20,
    marginBottom: 24,
  },
  expertiseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  expertiseMeta: {
    fontSize: 9,
    letterSpacing: 1,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    marginBottom: 24,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 2,
  },
  thumbGlow: {
    position: 'absolute',
    top: -8,
    marginLeft: -10,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 3,
    marginLeft: -8,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelBtnText: {
    fontSize: 9,
  },
  footerStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 32,
  },
  footerStatTile: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  footerStatValue: {
    fontSize: 16,
    marginTop: 12,
  },
  footerStatLabel: {
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: sharedTheme.spacing.lg,
    borderRadius: sharedTheme.radius.md,
    gap: sharedTheme.spacing.md,
    shadowColor: '#7B5FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    fontWeight: '800',
    letterSpacing: 1,
  },
});

const styles = StyleSheet.create({
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  toggleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTitle: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  toggleSub: {
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 2,
  },
});
