import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { theme } from '../../constants/theme';
import { useSimulationStore } from '../../store/simulationStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { FanChart } from '../../components/charts/FanChart';
import { RiskTemperatureGauge } from '../../components/charts/RiskTemperatureGauge';
import { ProbabilityHistogram } from '../../components/charts/ProbabilityHistogram';
import { MetricsGrid } from '../../components/ui/MetricsGrid';
import { Cpu, Download, ArrowRight, TrendingDown, Layers } from 'lucide-react-native';

export function SimulationResultsScreen({ route, navigation }: any) {
  const { portfolioId } = route.params;
  const { currentStatus, result, error, clearResult } = useSimulationStore();
  const { portfolios } = usePortfolioStore();
  const portfolio = portfolios.find(p => p.id === portfolioId);

  useEffect(() => {
    return () => {
      // Don't clear immediately on unmount if they are just navigating away and back, 
      // but if we want a fresh state later we can call it.
    };
  }, []);

  if (currentStatus === 'idle' || currentStatus === 'running') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Typography variant="body" style={styles.loadingText}>
          {currentStatus === 'running' ? 'Running Monte Carlo Simulations...' : 'Initializing compute engine...'}
        </Typography>
        <Typography variant="caption" style={styles.loadingSub}>This may take a few moments for dense paths.</Typography>
      </View>
    );
  }

  if (currentStatus === 'failed') {
    return (
      <View style={styles.centerContainer}>
        <Typography variant="h3" style={{color: theme.colors.error, marginBottom: 10}}>Simulation Failed</Typography>
        <Typography variant="body" style={{textAlign: 'center', paddingHorizontal: 40}}>{error}</Typography>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Typography variant="button">Go Back</Typography>
        </TouchableOpacity>
      </View>
    );
  }

  if (!result || !portfolio) return null;

  const initialValue = portfolio.total_value || 100000;

  const riskScore = Math.min(100, Math.max(0, result.metrics.var_95 * 100 * 3)); // Heuristic normalization for 0-100 score

  const metricsData = [
    { label: 'VaR (95%)', value: `${(result.metrics.var_95 * 100).toFixed(2)}%`, highlight: 'negative' as const, helperText: 'Max loss in 95% of cases' },
    { label: 'CVaR (95%)', value: `${(result.metrics.cvar_95 * 100).toFixed(2)}%`, highlight: 'negative' as const, helperText: 'Avg loss beyond VaR' },
    { label: 'Sharpe Ratio', value: result.metrics.sharpe_ratio.toFixed(2), highlight: result.metrics.sharpe_ratio > 1 ? 'positive' as const : 'neutral' as const },
    { label: 'Max Drawdown', value: `${(result.metrics.max_drawdown * 100).toFixed(2)}%`, highlight: 'negative' as const },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Typography variant="h2" style={styles.title}>Model Results</Typography>
          <Typography variant="body" style={styles.subtitle}>{portfolio.name}</Typography>
          <View style={styles.badge}>
             <Typography variant="caption" style={styles.badgeText}>SIMULATED • NOT A PREDICTION</Typography>
          </View>
        </View>

        <View style={styles.topRow}>
          <View style={{flex: 1, alignItems: 'center'}}>
             <RiskTemperatureGauge value={riskScore / 100} />
          </View>
          <View style={styles.summaryBox}>
             <Typography variant="caption" style={styles.summaryLabel}>MEDIAN END VALUE</Typography>
             <Typography variant="h2" style={styles.summaryValue}>
               ${(initialValue * (1 + result.metrics.expected_return)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
             </Typography>
             
             <Typography variant="caption" style={[styles.summaryLabel, {marginTop: 16}]}>P5 WORST CASE</Typography>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {(TrendingDown as any)({ size: 16, color: theme.colors.error, style: {marginRight: 4} })}
                <Typography variant="h3" style={[styles.summaryValue, {color: theme.colors.error}]}>
                  ${(initialValue * (1 - result.metrics.var_95)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Typography>
              </View>
          </View>
        </View>

        <Typography variant="h3" style={styles.sectionTitle}>Probability Density</Typography>
        <FanChart 
          data={result.percentile_paths} 
          height={200} 
          initialValue={initialValue} 
        />

        <Typography variant="h3" style={[styles.sectionTitle, {marginTop: theme.spacing.xl}]}>Value Distribution</Typography>
        <ProbabilityHistogram 
          data={result.terminal_values || []} 
        />

        <Typography variant="h3" style={[styles.sectionTitle, {marginTop: theme.spacing.xl}]}>Risk Analytics</Typography>
        <MetricsGrid metrics={metricsData} />

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionCard, {borderColor: theme.colors.secondary}]}
            onPress={() => navigation.navigate('AI', { screen: 'AIChat', params: { portfolioId, workflow: 'var_explanation' } })}
          >
            {(Cpu as any)({ size: 24, color: theme.colors.secondary })}
            <Typography variant="button" style={[styles.actionTitle, {color: theme.colors.secondary}]}>Ask Oracle</Typography>
            <Typography variant="caption" style={styles.actionDesc}>Explain these results in plain English</Typography>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, {borderColor: theme.colors.border}]}>
            {(Download as any)({ size: 24, color: theme.colors.textSecondary })}
            <Typography variant="button" style={[styles.actionTitle, {color: theme.colors.textSecondary}]}>Export Report</Typography>
            <Typography variant="caption" style={styles.actionDesc}>Download PDF analysis (Pro)</Typography>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.primary,
    fontFamily: theme.typography.fonts.mono,
  },
  loadingSub: {
    marginTop: 8,
    color: theme.colors.textTertiary,
  },
  scroll: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    color: '#FFF',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  badgeText: {
    color: '#F59E0B',
    fontSize: 9,
    fontFamily: theme.typography.fonts.bold,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  summaryLabel: {
    color: theme.colors.textTertiary,
    fontFamily: theme.typography.fonts.mono,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: theme.typography.fonts.mono,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
    marginBottom: 40,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    marginTop: theme.spacing.sm,
    marginBottom: 4,
  },
  actionDesc: {
    textAlign: 'center',
    color: theme.colors.textTertiary,
    fontSize: 10,
  },
  backBtn: {
    marginTop: 20,
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
