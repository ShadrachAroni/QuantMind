import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';

import { Typography } from '../../components/ui/Typography';
import { useAuthStore } from '../../store/authStore';
import { usePortfolioStore, usePortfolios } from '../../store/portfolioStore';
import { useSimulationStore } from '../../store/simulationStore';
import { SubscriptionTier } from '@quantmind/shared-types';
import { Settings2, Play, Cpu, Activity, Zap, Layers, ChevronLeft } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { sharedTheme } from '../../constants/theme';
import { useTranslation } from '../../lib/i18n';

const { width } = Dimensions.get('window');


const SIMULATION_MODELS = [
  { id: 'gbm', name: 'MODEL_GBM', desc: 'DESC_GBM' },
  { id: 'fat_tails', name: 'MODEL_FAT_TAILS', desc: 'DESC_FAT_TAILS' },
  { id: 'jump_diffusion', name: 'MODEL_JUMP_DIFFUSION', desc: 'DESC_JUMP_DIFFUSION' },
  { id: 'regime_switching', name: 'MODEL_REGIME_SWITCHING', desc: 'DESC_REGIME_SWITCHING' },
] as const;


export function SimulationScreen({ route, navigation }: any) {
  const { tier, powerShifts, usePowerShift, tierConfigs, interfaceLanguage } = useAuthStore();
  const portfolios = usePortfolios();
  const { runSimulation } = useSimulationStore();
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const t = useTranslation(interfaceLanguage);


  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(route.params?.portfolioId || null);
  const [paths, setPaths] = useState(1000);
  const [horizon, setHorizon] = useState(252);
  const [model, setModel] = useState<'gbm' | 'fat_tails' | 'jump_diffusion' | 'regime_switching'>('gbm');

  const entitlements = tierConfigs[tier as SubscriptionTier] || tierConfigs.free;
  const maxPaths = entitlements.maxPaths;

  const PlayIcon = Play as any;
  const LayersIcon = Layers as any;
  const BackIcon = ChevronLeft as any;
  const ZapIcon = Zap as any;

  const dynamicStyles = getStyles(theme, isDark);

  const handleRun = async () => {
    if (!selectedPortfolioId) {
      showToast(t('SELECTION_ERROR_PORTFOLIO'), 'error');
      return;
    }

    await runSimulation(selectedPortfolioId, {
      portfolio_id: selectedPortfolioId,
      num_paths: paths,
      time_horizon_years: horizon / 252,
      model_type: model,
      initial_value: portfolios.find(p => p.id === selectedPortfolioId)?.total_value || 100000,
      risk_free_rate: 0.04,
    });
    navigation.navigate('SimulationResults', { portfolioId: selectedPortfolioId });
  };

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.header}>
           <View style={dynamicStyles.headerTop}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
                 <BackIcon size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              <View style={[dynamicStyles.statusBadge, { backgroundColor: theme.secondary + '10', borderColor: theme.secondary + '33' }]}>
                 <GlowEffect color={theme.secondary} size={6} glowRadius={6} />
                 <Typography variant="mono" style={[dynamicStyles.statusText, { color: theme.secondary }]}>{t('COMPUTE_READY')}</Typography>
              </View>
           </View>
           <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>{t('ENGINE_CONFIGURATION_V4.2')}</Typography>
           <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>{t('COMPUTE_SETUP')}</Typography>
        </View>

        <Typography variant="mono" style={[dynamicStyles.sectionLabel, { color: theme.textSecondary }]}>{t('TARGET_CONSTRUCT')}</Typography>

        <GlassCard style={dynamicStyles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dynamicStyles.portList}>
            {portfolios.map(p => {
              const selected = selectedPortfolioId === p.id;
              return (
                <TouchableOpacity 
                  key={p.id}
                  style={[dynamicStyles.portItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: theme.border }, selected && { borderColor: theme.primary + '66', backgroundColor: theme.primary + '10' }]}
                  onPress={() => setSelectedPortfolioId(p.id)}
                  activeOpacity={0.8}
                >
                  <Typography variant="monoBold" style={[dynamicStyles.portName, { color: theme.textSecondary }, selected && { color: theme.primary }]}>
                    {p.name.toUpperCase()}
                  </Typography>
                  <Typography variant="caption" style={[dynamicStyles.portVal, { color: theme.textTertiary }]}>
                    ${p.total_value?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                  {selected && <GlowEffect color={theme.primary} size={40} glowRadius={20} style={dynamicStyles.itemGlow} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </GlassCard>

        <Typography variant="mono" style={[dynamicStyles.sectionLabel, { color: theme.textSecondary }]}>{t('KERNEL_LOGIC')}</Typography>

        <GlassCard style={dynamicStyles.section}>
          {SIMULATION_MODELS.map(m => {
            const selected = model === m.id;
            const isAdvanced = m.id !== 'gbm';
            const locked = isAdvanced && !entitlements.allowAdvancedModels;

            const handleModelPress = () => {
              if (locked) {
                if (powerShifts > 0) {
                  Alert.alert(
                    t('POWER_SHIFT_AVAILABLE'),
                    `Use 1 of ${powerShifts} daily Power Shifts to trial the ${t(m.name)} engine for this session?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: t('USE_POWER_SHIFT'), 
                        onPress: () => {
                          usePowerShift();
                          setModel(m.id);
                          showToast(t('POWER_SHIFT_ACTIVATED'), 'success');
                        } 
                      }
                    ]
                  );
                } else {

                  navigation.navigate('Subscription');
                }
              } else {
                setModel(m.id);
              }
            };

            return (
              <TouchableOpacity 
                key={m.id}
                style={[dynamicStyles.modelItem, selected && { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}
                onPress={handleModelPress}
                activeOpacity={0.7}
              >
                <View style={dynamicStyles.modelInfo}>
                  <View style={[dynamicStyles.modelIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: theme.border }, selected && { backgroundColor: theme.primary + '20' }]}>
                    <LayersIcon size={16} color={selected ? theme.primary : theme.textTertiary} />
                  </View>
                  <View>
                    <Typography variant="monoBold" style={[dynamicStyles.modelName, { color: theme.textSecondary }, selected && { color: theme.primary }]}>
                      {t(m.name).toUpperCase()} {locked && ` ${t('LOCKED_TAG')}`}
                    </Typography>
                    <Typography variant="caption" style={[dynamicStyles.modelDesc, { color: theme.textTertiary }]}>{t(m.desc)}</Typography>
                  </View>

                </View>
                {locked ? (
                  <View style={dynamicStyles.shiftBadgeInline}>
                    <ZapIcon size={10} color={theme.primary} />
                    <Typography variant="mono" style={{ fontSize: 9, color: theme.primary }}>{powerShifts}</Typography>
                  </View>
                ) : (
                  <View style={[dynamicStyles.radio, { borderColor: theme.border }, selected && { borderColor: theme.primary }]}>
                    {selected && <View style={[dynamicStyles.radioInner, { backgroundColor: theme.primary }]} />}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </GlassCard>

        <View style={dynamicStyles.splitRow}>
          <View style={{ flex: 1 }}>
            <Typography variant="mono" style={[dynamicStyles.sectionLabel, { color: theme.textSecondary }]}>{t('ITERATIONS')}</Typography>
            <GlassCard style={dynamicStyles.controlCard}>
              <View style={dynamicStyles.counter}>
                <TouchableOpacity onPress={() => setPaths(Math.max(100, paths - 500))} style={[dynamicStyles.countBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                  <Typography variant="h3" style={{ color: theme.textSecondary }}>-</Typography>
                </TouchableOpacity>
                <Typography variant="monoBold" style={[dynamicStyles.countVal, { color: theme.textPrimary }]}>{paths}</Typography>
                <TouchableOpacity 
                   onPress={() => {
                     if (paths + 500 > maxPaths) {
                       showToast(t('LIMIT_REACHED_INFO', { tier: tier.toUpperCase(), maxPaths }), 'error');
                     } else {
                       setPaths(paths + 500);
                     }
                   }} 
                   style={[dynamicStyles.countBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}
                >
                  <Typography variant="h3" style={{ color: theme.primary }}>+</Typography>
                </TouchableOpacity>
              </View>
              <Typography variant="caption" style={[dynamicStyles.limitText, { color: theme.textTertiary }]}>{t('MAX_INFO', { max: maxPaths, tier: tier.toUpperCase() })}</Typography>
            </GlassCard>
          </View>

          <View style={{ flex: 1, marginLeft: 16 }}>
            <Typography variant="mono" style={[dynamicStyles.sectionLabel, { color: theme.textSecondary }]}>{t('HORIZON_D')}</Typography>
            <GlassCard style={dynamicStyles.controlCard}>
              <View style={dynamicStyles.counter}>
                <TouchableOpacity onPress={() => setHorizon(Math.max(30, horizon - 30))} style={[dynamicStyles.countBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                  <Typography variant="h3" style={{ color: theme.textSecondary }}>-</Typography>
                </TouchableOpacity>
                <Typography variant="monoBold" style={[dynamicStyles.countVal, { color: theme.textPrimary }]}>{horizon}</Typography>
                <TouchableOpacity onPress={() => setHorizon(Math.min(2520, horizon + 30))} style={[dynamicStyles.countBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                  <Typography variant="h3" style={{ color: theme.primary }}>+</Typography>
                </TouchableOpacity>
              </View>
              <Typography variant="caption" style={[dynamicStyles.limitText, { color: theme.textTertiary }]}>{t('HORIZON_WINDOW_INFO')}</Typography>
            </GlassCard>
          </View>
        </View>


        <TouchableOpacity 
          style={[dynamicStyles.submitBtn, { backgroundColor: theme.primary }, !selectedPortfolioId && { opacity: 0.3 }]}
          onPress={handleRun}
          disabled={!selectedPortfolioId}
          activeOpacity={0.8}
        >
          <GlowEffect color={theme.background} size={width - 48} glowRadius={30} style={dynamicStyles.btnGlow} />
          <PlayIcon size={20} color={theme.background} style={{ marginRight: 12 }} />
          <Typography variant="monoBold" style={[dynamicStyles.submitText, { color: theme.background }]}>{t('COMMIT_COMPUTE_JOB')}</Typography>
        </TouchableOpacity>

        <View style={dynamicStyles.footer}>
           <ZapIcon size={12} color={theme.textTertiary} />
           <Typography variant="mono" style={[dynamicStyles.footerText, { color: theme.textTertiary }]}>{t('MONTE_CARLO_ENGINE')}</Typography>
        </View>


        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    letterSpacing: 1,
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
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  section: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 32,
  },
  portList: {
    gap: 12,
    paddingRight: 12,
  },
  portItem: {
    width: 140,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
  },
  portName: {
    fontSize: 12,
    marginBottom: 4,
  },
  portVal: {
    fontSize: 10,
  },
  itemGlow: {
    position: 'absolute',
    opacity: 0.2,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  modelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  modelIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelName: {
    fontSize: 12,
    marginBottom: 2,
  },
  modelDesc: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  shiftBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  splitRow: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  controlCard: {
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  countBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countVal: {
    fontSize: 18,
  },
  limitText: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
  submitBtn: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginTop: 8,
  },
  btnGlow: {
    position: 'absolute',
  },
  submitText: {
    fontSize: 14,
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
    marginBottom: 40,
    opacity: 0.3,
  },
  footerText: {
    fontSize: 7,
    letterSpacing: 1,
  },
});
