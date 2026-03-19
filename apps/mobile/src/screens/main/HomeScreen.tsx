import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useSimulationStore } from '../../store/simulationStore';
import { TierBadge } from '../../components/ui/TierBadge';
import { Plus, Activity, Cpu, Settings } from 'lucide-react-native';

export function HomeScreen({ navigation }: any) {
  const { user, tier } = useAuthStore();
  const { portfolios, fetchPortfolios, isLoading } = usePortfolioStore();
  const { result } = useSimulationStore();
  
  const ActivityIcon = Activity as any;
  const CpuIcon = Cpu as any;
  const SettingsIcon = Settings as any;

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const totalValue = portfolios.reduce((sum, p) => sum + (p.total_value || 0), 0);

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchPortfolios} tintColor={theme.colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Typography variant="body" style={styles.greeting}>Welcome back,</Typography>
            <Typography variant="h2" style={styles.email}>{user?.email}</Typography>
          </View>
          <TierBadge tier={tier as any} />
        </View>

        <View style={styles.allocationCard}>
          <Typography variant="caption" style={styles.cardLabel}>TOTAL CAPITAL ALLOCATION</Typography>
          <Typography variant="h1" style={styles.totalValue}>
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
          <View style={styles.portfolioCount}>
            <ActivityIcon size={14} color={theme.colors.primary} />
            <Typography variant="caption" style={styles.portfolioCountText}>
              Across {portfolios.length} active portfolios
            </Typography>
          </View>
        </View>

        <Typography variant="h3" style={styles.sectionTitle}>System Modules</Typography>
        
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.gridItem} 
            onPress={() => navigation.navigate('Portfolios', { screen: 'PortfolioList' })}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 217, 255, 0.1)' }]}>
              <ActivityIcon size={24} color={theme.colors.primary} />
            </View>
            <Typography variant="body" style={styles.gridTitle}>Vault</Typography>
            <Typography variant="caption" style={styles.gridDesc}>Manage Holdings</Typography>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem} 
            onPress={() => navigation.navigate('Simulations', { screen: 'SimulationSetup' })}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
              <ActivityIcon size={24} color={theme.colors.secondary} />
            </View>
            <Typography variant="body" style={styles.gridTitle}>Model</Typography>
            <Typography variant="caption" style={styles.gridDesc}>Run Simulations</Typography>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem} 
            onPress={() => navigation.navigate('AI', { screen: 'AIChat' })}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <CpuIcon size={24} color="#10B981" />
            </View>
            <Typography variant="body" style={styles.gridTitle}>Oracle</Typography>
            <Typography variant="caption" style={styles.gridDesc}>AI Assistant</Typography>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem} 
            onPress={() => navigation.navigate('Settings', { screen: 'SettingsMain' })}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(148, 163, 184, 0.1)' }]}>
              <SettingsIcon size={24} color={theme.colors.textSecondary} />
            </View>
            <Typography variant="body" style={styles.gridTitle}>Prefs</Typography>
            <Typography variant="caption" style={styles.gridDesc}>System Config</Typography>
          </TouchableOpacity>
        </View>

        <Typography variant="h3" style={styles.sectionTitle}>Recent Activity</Typography>
        {result ? (
          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Typography variant="caption" style={{ color: theme.colors.primary }}>SIMULATION COMPLETE</Typography>
              <Typography variant="caption">{new Date().toLocaleTimeString()}</Typography>
            </View>
            <Typography variant="body">Portfolio VaR calculated at {(result.metrics.var_95 * 100).toFixed(2)}%</Typography>
            <TouchableOpacity onPress={() => navigation.navigate('Simulations', { screen: 'SimulationResults' })}>
              <Typography variant="button" style={styles.viewLink}>VIEW RESULTS →</Typography>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Typography variant="body">No recent system activity.</Typography>
          </View>
        )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  email: {
    color: theme.colors.textPrimary,
  },
  allocationCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.roundness.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  cardLabel: {
    color: theme.colors.textTertiary,
    fontFamily: theme.typography.fonts.mono,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  totalValue: {
    fontFamily: theme.typography.fonts.mono,
    marginBottom: theme.spacing.md,
  },
  portfolioCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioCountText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
  sectionTitle: {
    marginBottom: theme.spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  gridItem: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  gridTitle: {
    fontFamily: theme.typography.fonts.mono,
    fontWeight: '700',
    marginBottom: 4,
  },
  gridDesc: {
    color: theme.colors.textTertiary,
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  viewLink: {
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
    fontSize: 12,
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
});
