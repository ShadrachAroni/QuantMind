import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { useSimulationStore } from '../../store/simulationStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { FanChart } from '../../components/charts/FanChart';
import { RiskTemperatureGauge } from '../../components/charts/RiskTemperatureGauge';
import { ProbabilityHistogram } from '../../components/charts/ProbabilityHistogram';
import { MetricsGrid } from '../../components/ui/MetricsGrid';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { Cpu, Download, ArrowDown, Layers, ChevronLeft, ShieldAlert, Zap, Activity, Info, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { sharedTheme } from '../../constants/theme';
import { STRINGS } from '../../constants/strings';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { GatedFeature } from '../../components/ui/GatedFeature';
import { useAuthStore } from '../../store/authStore';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

export function SimulationResultsScreen({ route, navigation }: any) {
  const { portfolioId } = route.params;
  const { currentStatus, result, error } = useSimulationStore();
  const { portfolios } = usePortfolioStore();
  const { theme, isDark } = useTheme();
  const { tier, powerShifts, usePowerShift } = useAuthStore();
  const portfolio = portfolios.find(p => p.id === portfolioId);

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (currentStatus === 'running') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [currentStatus]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.8 + (pulse.value - 1) * 4,
  }));

  const CpuIcon = Cpu as any;
  const DownloadIcon = Download as any;
  const BackIcon = ChevronLeft as any;
  const AlertIcon = ShieldAlert as any;
  const TrendDownIcon = ArrowDown as any;
  const ZapIcon = Zap as any;
  const ActivityIcon = Activity as any;
  const InfoIcon = Info as any;
  const LayersIcon = Layers as any;
  const SparklesIcon = Sparkles as any;

  const dynamicStyles = getStyles(theme, isDark);

  if (currentStatus === 'idle' || currentStatus === 'running') {
    return (
      <View style={[dynamicStyles.centerContainer, { backgroundColor: theme.background }]}>
        <Animated.View style={[dynamicStyles.loaderContainer, animatedStyle]}>
          <GlowEffect color={theme.primary} size={120} glowRadius={60} style={dynamicStyles.loaderGlow} />
          <ActivityIndicator size="small" color={theme.primary} />
        </Animated.View>
        <Typography variant="monoBold" style={[dynamicStyles.loadingText, { color: theme.primary }]}>
          {currentStatus === 'running' ? STRINGS.CONVOLVING_PATHS : STRINGS.INITIALIZING_COMPUTE}
        </Typography>
        <Typography variant="caption" style={[dynamicStyles.loadingSub, { color: theme.textTertiary }]}>{STRINGS.MONTE_CARLO_ENGINE}</Typography>
        
        <View style={[dynamicStyles.computeLog, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
          <Typography variant="mono" style={[dynamicStyles.logLine, { color: theme.textTertiary }]}>[SYS] ATTACHING_KERNEL... OK</Typography>
          <Typography variant="mono" style={[dynamicStyles.logLine, { color: theme.textTertiary }]}>[NET] FETCHING_MARKET_DYNAMICS... OK</Typography>
          <Typography variant="mono" style={[dynamicStyles.logLine, { color: theme.textTertiary }]}>[CPU] PARALLEL_PROCESSING_INIT... BUSY</Typography>
        </View>
      </View>
    );
  }

  if (currentStatus === 'failed') {
    return (
      <View style={[dynamicStyles.centerContainer, { backgroundColor: theme.background }]}>
        <AlertIcon size={48} color={theme.error} />
        <Typography variant="h2" style={{color: theme.error, marginTop: 24, letterSpacing: 2}}>{STRINGS.KERNEL_PANIC}</Typography>
        <Typography variant="mono" style={{textAlign: 'center', paddingHorizontal: 40, marginTop: 12, color: theme.textSecondary, fontSize: 10}}>
          {error?.toUpperCase() || 'UNEXPECTED_SIMULATION_TERMINATION'}
        </Typography>
        <TouchableOpacity style={[dynamicStyles.rebootBtn, { borderColor: theme.primary }]} onPress={() => navigation.goBack()}>
          <Typography variant="mono" style={{color: theme.primary, fontSize: 12}}>{STRINGS.REBOOT_SESSION}</Typography>
        </TouchableOpacity>
      </View>
    );
  }

  if (!result || !portfolio) return null;

  const initialValue = portfolio.total_value || 100000;
  const riskScore = Math.min(100, Math.max(0, result.metrics.var_95 * 100 * 3));

  const metricsData = [
    { label: 'VaR (95%)', value: `${(result.metrics.var_95 * 100).toFixed(2)}%`, highlight: 'negative' as const, helperText: 'Max loss in 95% of cases' },
    { label: 'CVaR (95%)', value: `${(result.metrics.cvar_95 * 100).toFixed(2)}%`, highlight: 'negative' as const, helperText: 'Avg loss beyond VaR' },
    { label: 'Sharpe Ratio', value: result.metrics.sharpe_ratio.toFixed(2), highlight: result.metrics.sharpe_ratio > 1 ? 'positive' as const : 'neutral' as const },
    { label: 'Max Drawdown', value: `${(result.metrics.max_drawdown * 100).toFixed(2)}%`, highlight: 'negative' as const },
  ];

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
            <BackIcon size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View>
            <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>{STRINGS.COMPUTE_REPORT}</Typography>
            <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>{STRINGS.SIM_RESULTS}</Typography>
          </View>
        </View>

        <View style={dynamicStyles.topRow}>
          <GlassCard style={dynamicStyles.gaugeCard}>
             <RiskTemperatureGauge value={riskScore / 100} />
             <Typography variant="mono" style={[dynamicStyles.gaugeLabel, { color: theme.textTertiary }]}>RISK_INDEX</Typography>
          </GlassCard>
          
          <GlassCard intensity="high" style={dynamicStyles.summaryCard}>
             <View>
               <Typography variant="mono" style={[dynamicStyles.summaryLabel, { color: theme.textTertiary }]}>EXPECTED_MEDIAN</Typography>
               <View style={dynamicStyles.valRow}>
                 <Typography variant="h2" style={[dynamicStyles.summaryValue, { color: theme.textPrimary, fontFamily: sharedTheme.typography.fonts.mono }]}>
                   ${(initialValue * (1 + result.metrics.expected_return)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                 </Typography>
                 <ZapIcon size={12} color={theme.primary} />
               </View>
             </View>
             
             <View style={[dynamicStyles.divider, { backgroundColor: theme.border }]} />

             <View>
               <Typography variant="mono" style={[dynamicStyles.summaryLabel, { color: theme.textTertiary }]}>P5_TAIL_VAR</Typography>
               <View style={dynamicStyles.riskRow}>
                 <TrendDownIcon size={14} color={theme.error} />
                 <Typography variant="h2" style={[dynamicStyles.summaryValue, {color: theme.error, fontFamily: sharedTheme.typography.fonts.mono}]}>
                   ${(initialValue * (1 - result.metrics.var_95)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                 </Typography>
               </View>
             </View>
          </GlassCard>
        </View>

        <View style={dynamicStyles.sectionHeader}>
           <ActivityIcon size={14} color={theme.textTertiary} />
           <Typography variant="h3" style={[dynamicStyles.sectionTitle, { color: theme.textSecondary }]}>PROBABILITY_CONE</Typography>
        </View>
        <GlassCard style={dynamicStyles.chartCard}>
          <FanChart 
            data={result.percentile_paths} 
            height={180} 
            initialValue={initialValue} 
          />
        </GlassCard>

        <View style={[dynamicStyles.sectionHeader, { marginTop: 32 }]}>
           <LayersIcon size={14} color={theme.textTertiary} />
           <Typography variant="h3" style={[dynamicStyles.sectionTitle, { color: theme.textSecondary }]}>TERMINAL_DENSITY</Typography>
        </View>
        <GatedFeature 
          locked={tier === 'free'} 
          featureName="Terminal Density Analysis" 
          requiredTier="BASIC"
          style={dynamicStyles.chartCard}
        >
          <ProbabilityHistogram 
            data={result.terminal_values || []} 
          />
        </GatedFeature>

        <View style={[dynamicStyles.sectionHeader, { marginTop: 32 }]}>
           <InfoIcon size={14} color={theme.textTertiary} />
           <Typography variant="h3" style={[dynamicStyles.sectionTitle, { color: theme.textSecondary }]}>INSTITUTIONAL_METRICS</Typography>
        </View>
        <MetricsGrid metrics={metricsData} />

        <View style={dynamicStyles.actionRow}>
          <TouchableOpacity 
            onPress={() => {
              if (tier === 'free' || tier === 'basic') {
                if (powerShifts > 0) {
                  Alert.alert(
                    "POWER SHIFT AVAILABLE",
                    `You have ${powerShifts} daily Power Shifts remaining. Use 1 to initiate Oracle decoding?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "USE_POWER_SHIFT", 
                        onPress: () => {
                          usePowerShift();
                          navigation.navigate('AI', { screen: 'AIChat', params: { portfolioId, simulationResultId: result.id, workflow: 'var_explanation' } });
                        } 
                      }
                    ]
                  );
                } else {
                  navigation.navigate('Subscription');
                }
              } else {
                navigation.navigate('AI', { screen: 'AIChat', params: { portfolioId, simulationResultId: result.id, workflow: 'var_explanation' } });
              }
            }}
            activeOpacity={0.8}
            style={dynamicStyles.actionButtonWrapper}
          >
            <GlassCard style={[dynamicStyles.actionCard, {borderColor: theme.secondary + '33'}]}>
              <SparklesIcon size={24} color={theme.secondary} />
              <Typography variant="monoBold" style={[dynamicStyles.actionTitle, {color: theme.secondary}]}>ORACLE_DECODE</Typography>
              <View style={dynamicStyles.badgeRow}>
                <Typography variant="caption" style={[dynamicStyles.actionDesc, { color: theme.textTertiary }]}>AI_DRIVEN_RISK_LOGIC</Typography>
                {(tier === 'free' || tier === 'basic') && (
                  <View style={[dynamicStyles.shiftBadge, { backgroundColor: theme.primary + '22' }]}>
                    <ZapIcon size={8} color={theme.primary} />
                    <Typography variant="mono" style={{ fontSize: 7, color: theme.primary }}>{powerShifts}</Typography>
                  </View>
                )}
              </View>
            </GlassCard>
          </TouchableOpacity>

          <GatedFeature 
            locked={tier === 'free' || tier === 'basic'} 
            featureName="Bulk Data Export" 
            requiredTier="PRO"
            style={dynamicStyles.actionButtonWrapper}
          >
            <TouchableOpacity style={dynamicStyles.actionButtonWrapper} activeOpacity={0.8}>
              <GlassCard style={dynamicStyles.actionCard}>
                <DownloadIcon size={20} color={theme.textSecondary} />
                <Typography variant="monoBold" style={[dynamicStyles.actionTitle, {color: theme.textSecondary}]}>EXPORT_XLS</Typography>
                <Typography variant="caption" style={[dynamicStyles.actionDesc, { color: theme.textTertiary }]}>INSTITUTIONAL_DATA_DUMP</Typography>
              </GlassCard>
            </TouchableOpacity>
          </GatedFeature>
        </View>

        <View style={dynamicStyles.footer}>
           <Typography variant="mono" style={[dynamicStyles.footerText, { color: theme.textTertiary }]}>ALPHA_KERNEL // PORTFOLIO_ID: {portfolio.id.slice(0, 8).toUpperCase()} // NON_DETERMINISTIC_MODEL</Typography>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderGlow: {
    position: 'absolute',
  },
  loadingText: {
    marginTop: 24,
    letterSpacing: 2,
    fontSize: 12,
  },
  loadingSub: {
    marginTop: 8,
    fontSize: 9,
    letterSpacing: 1,
  },
  computeLog: {
    marginTop: 40,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
  },
  logLine: {
    fontSize: 8,
    marginBottom: 4,
  },
  scroll: {
    padding: sharedTheme.spacing.xl,
    paddingTop: 64,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  subHeader: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    letterSpacing: 1,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 12,
  },
  gaugeCard: {
    flex: 0.45,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  gaugeLabel: {
    fontSize: 8,
    marginTop: 8,
    letterSpacing: 1.5,
  },
  summaryCard: {
    flex: 0.55,
    padding: 20,
    justifyContent: 'space-between',
    borderRadius: 20,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  summaryLabel: {
    fontSize: 8,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  valRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryValue: {
    fontSize: 20,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 2,
  },
  chartCard: {
    padding: 16,
    paddingBottom: 24,
    borderRadius: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 20,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  actionCard: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
    borderRadius: 20,
  },
  actionTitle: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 11,
    letterSpacing: 1,
  },
  actionDesc: {
    textAlign: 'center',
    fontSize: 8,
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  footer: {
    marginTop: 32,
    marginBottom: 60,
    alignItems: 'center',
    opacity: 0.3,
  },
  footerText: {
    fontSize: 7,
    textAlign: 'center',
    letterSpacing: 1,
  },
  rebootBtn: {
    marginTop: 32,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
