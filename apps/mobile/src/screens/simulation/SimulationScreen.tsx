import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useSimulationStore } from '../../store/simulationStore';
import { Settings2, Play } from 'lucide-react-native';

const SIMULATION_MODELS = [
  { id: 'gbm', name: 'Standard (GBM)', desc: 'Geometric Brownian Motion' },
  { id: 'fat_tails', name: 'Fat Tails (t-dist)', desc: 'Accounts for extreme market events' },
] as const;

export function SimulationScreen({ route, navigation }: any) {
  const { tier } = useAuthStore();
  const { portfolios } = usePortfolioStore();
  const { runSimulation } = useSimulationStore();

  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(route.params?.portfolioId || null);
  const [paths, setPaths] = useState(1000);
  const [horizon, setHorizon] = useState(252);
  const [model, setModel] = useState<'gbm' | 'fat_tails'>('gbm');

  const maxPaths = tier === 'free' ? 2000 : 10000;

  const handleRun = async () => {
    if (!selectedPortfolioId) {
      Alert.alert('Selection Required', 'Please select a portfolio to simulate.');
      return;
    }
    await runSimulation(selectedPortfolioId, {
      portfolio_id: selectedPortfolioId,
      num_paths: paths,
      time_horizon_years: horizon / 252, // Convert days to years
      model_type: model,
      initial_value: portfolios.find(p => p.id === selectedPortfolioId)?.total_value || 100000,
      risk_free_rate: 0.04,
    });
    // Navigate immediately to results to show loading state
    navigation.navigate('SimulationResults', { portfolioId: selectedPortfolioId });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
              {(Settings2 as any)({ stroke: theme.colors.secondary, size: 24 })}
          </View>
          <Typography variant="h2" style={styles.title}>Model Configuration</Typography>
          <Typography variant="body" style={styles.subtitle}>Calibrate Monte Carlo parameters</Typography>
        </View>

        <View style={styles.card}>
          <Typography variant="caption" style={styles.label}>TARGET PORTFOLIO</Typography>
          <View style={styles.portfolioList}>
            {portfolios.map(p => (
              <TouchableOpacity 
                key={p.id}
                style={[
                  styles.portfolioItem, 
                  selectedPortfolioId === p.id && styles.portfolioItemSelected
                ]}
                onPress={() => setSelectedPortfolioId(p.id)}
              >
                <Typography variant="body" style={[styles.portName, selectedPortfolioId === p.id && {color: theme.colors.background}]}>
                  {p.name}
                </Typography>
                <Typography variant="caption" style={[styles.portValue, selectedPortfolioId === p.id && {color: theme.colors.background}]}>
                  ${p.total_value?.toLocaleString() || '0'}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Typography variant="caption" style={styles.label}>SIMULATION MODEL</Typography>
          <View style={styles.modelList}>
            {SIMULATION_MODELS.map(m => (
              <TouchableOpacity 
                key={m.id}
                style={[
                  styles.modelItem, 
                  model === m.id && styles.modelItemSelected
                ]}
                onPress={() => setModel(m.id)}
                disabled={m.id === 'fat_tails' && tier === 'free'}
              >
                <View>
                  <Typography variant="body" style={[styles.modelName, model === m.id && {color: theme.colors.primary}]}>
                    {m.name} {m.id === 'fat_tails' && tier === 'free' ? '(PRO)' : ''}
                  </Typography>
                  <Typography variant="caption" style={styles.modelDesc}>{m.desc}</Typography>
                </View>
                <View style={[styles.radio, model === m.id && styles.radioSelected]}>
                  {model === m.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.cardRow}>
          <View style={[styles.card, {flex: 1, marginRight: theme.spacing.md}]}>
            <Typography variant="caption" style={styles.label}>ITERATIONS (PATHS)</Typography>
            <View style={styles.controlRow}>
              <TouchableOpacity onPress={() => setPaths(Math.max(100, paths - 500))} style={styles.btn}>
                <Typography variant="h3">-</Typography>
              </TouchableOpacity>
              <Typography variant="h3" style={{fontFamily: theme.typography.fonts.mono}}>{paths}</Typography>
              <TouchableOpacity onPress={() => setPaths(Math.min(maxPaths, paths + 500))} style={styles.btn}>
                <Typography variant="h3">+</Typography>
              </TouchableOpacity>
            </View>
            <Typography variant="caption" style={styles.limitText}>Max {maxPaths} ({tier.toUpperCase()})</Typography>
          </View>

          <View style={[styles.card, {flex: 1}]}>
             <Typography variant="caption" style={styles.label}>HORIZON (DAYS)</Typography>
             <View style={styles.controlRow}>
              <TouchableOpacity onPress={() => setHorizon(Math.max(30, horizon - 30))} style={styles.btn}>
                <Typography variant="h3">-</Typography>
              </TouchableOpacity>
              <Typography variant="h3" style={{fontFamily: theme.typography.fonts.mono}}>{horizon}</Typography>
              <TouchableOpacity onPress={() => setHorizon(Math.min(2520, horizon + 30))} style={styles.btn}>
                <Typography variant="h3">+</Typography>
              </TouchableOpacity>
            </View>
            <Typography variant="caption" style={styles.limitText}>1 year = 252 days</Typography>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.runButton, !selectedPortfolioId && {opacity: 0.5}]}
          onPress={handleRun}
          disabled={!selectedPortfolioId}
        >
          <View style={{marginRight: 8}}>
            {(Play as any)({ size: 20, color: theme.colors.background, strokeWidth: 2 })}
          </View>
          <Typography variant="button" style={{color: theme.colors.background}}>SUBMIT JOB</Typography>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.roundness.md,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.textSecondary,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  cardRow: {
    flexDirection: 'row',
  },
  label: {
    color: theme.colors.textTertiary,
    fontFamily: theme.typography.fonts.mono,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  portfolioList: {
    gap: theme.spacing.sm,
  },
  portfolioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  portfolioItemSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  portName: {
    fontFamily: theme.typography.fonts.bold,
  },
  portValue: {
    fontFamily: theme.typography.fonts.mono,
  },
  modelList: {
    gap: theme.spacing.sm,
  },
  modelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modelItemSelected: {
    borderColor: theme.colors.primary,
  },
  modelName: {
    fontFamily: theme.typography.fonts.bold,
    marginBottom: 2,
  },
  modelDesc: {
    color: theme.colors.textTertiary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.xs,
  },
  btn: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.sm,
  },
  limitText: {
    marginTop: 8,
    color: theme.colors.textTertiary,
    fontSize: 10,
    textAlign: 'center',
  },
  runButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: 40,
  },
});
