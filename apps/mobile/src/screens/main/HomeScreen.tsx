import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { sharedTheme } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { usePortfolioStore, usePortfolios } from '../../store/portfolioStore';
import { useSimulationStore } from '../../store/simulationStore';
import { TierBadge } from '../../components/ui/TierBadge';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { useToast } from '../../context/ToastContext';
import { STRINGS } from '../../constants/strings';
import { useResponsive } from '../../hooks/useResponsive';
import { BiometricEnrollmentModal } from '../../components/auth/BiometricEnrollmentModal';
import { TermsConsentModal } from '../../components/auth/TermsConsentModal';
import { TrialRewardModal } from '../../components/rewards/TrialRewardModal';
import { MarketStatus } from '../../components/dashboard/MarketStatus';
import { InsightFeed, Insight } from '../../components/dashboard/InsightFeed';
import { supabase } from '../../services/supabase';
import { 
  Activity, 
  Cpu, 
  Shield, 
  BarChart3, 
  Zap, 
  TrendingUp,
  Terminal,
  Layers,
  Lock,
  Gift,
  PlusCircle,
  RefreshCw,
  Maximize2,
  ChevronRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react-native';
import { TIER_ENTITLEMENTS } from '@quantmind/shared-types';

export function HomeScreen({ navigation }: any) {
  const { user, tier } = useAuthStore();
  const { theme, isDark } = useTheme();
  const { width, breakpoint, isTablet, isLandscape } = useResponsive();
  const { fetchPortfolios, isLoading } = usePortfolioStore();
  const portfolios = usePortfolios();
  const { result, currentStatus } = useSimulationStore();
  const { isBiometricSupported, isBiometricEnabled, hasPromptedBiometrics, hasUsedTrial } = useAuthStore();
  
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isFeedExpanded, setIsFeedExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (!user) return;
    const allInsights: Insight[] = [];

    const { data: sims } = await supabase
      .from('simulations')
      .select('id, status, result, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (sims) {
      sims.forEach(s => allInsights.push({
        id: s.id,
        type: s.status === 'completed' ? 'success' : s.status === 'failed' ? 'error' : 'info',
        category: 'SYSTEM',
        message: s.status === 'completed' 
          ? `Simulation Result_${s.id.substring(0, 8)} finalized with optimal convergence.` 
          : s.status === 'failed'
          ? `Pipeline interruption detected on simulation_${s.id.substring(0, 8)}.`
          : `Simulation_${s.id.substring(0, 8)} enqueued to Secure compute.`,
        time: s.created_at
      }));
    }

    const { data: portData } = await supabase
      .from('portfolios')
      .select('id, name, total_value, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (portData) {
      portData.forEach(p => allInsights.push({
        id: `p-${p.id}`,
        type: 'success',
        category: 'DEPLOYMENT',
        message: `Secure Vault_${p.name.toUpperCase()} successfully initialized.`,
        time: p.created_at,
        metadata: { label: 'CAPITAL', value: `$${(p.total_value || 0).toLocaleString()}` }
      }));
    }

    setInsights(allInsights.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
  }, [user]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchPortfolios(), fetchInsights()]);
    setIsRefreshing(false);
  }, [fetchPortfolios, fetchInsights]);

  useEffect(() => {
    onRefresh();
    
    if (isBiometricSupported && !isBiometricEnabled && !hasPromptedBiometrics) {
      const timer = setTimeout(() => setShowBiometricModal(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isBiometricSupported, isBiometricEnabled, hasPromptedBiometrics]);

  const totalValue = portfolios.reduce((sum: number, p: any) => sum + (p.total_value || 0), 0);
  const riskScore = result?.metrics?.var_95 ? Math.round(result.metrics.var_95 * 100) : 0;
  
  const operatorName = user?.email?.split('@')[0].toUpperCase() || 'OPERATOR';
  const dynamicStyles = getStyles(theme, isDark, width, breakpoint);

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={dynamicStyles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.primary} 
          />
        }
      >
        {/* Header Section */}
        <View style={dynamicStyles.headerSection}>
          <View style={styles.statusRow}>
            <View style={styles.terminalBadge}>
              <Activity size={10} color={theme.primary} />
              <Typography variant="mono" style={[styles.terminalBadgeText, { color: theme.primary }]}>TERMINAL_ACTIVE</Typography>
            </View>
            <MarketStatus />
          </View>
          
          <View style={dynamicStyles.titleRow}>
            <View>
              <Typography variant="h1" style={dynamicStyles.mainTitle}>
                CONSOLE_<Typography variant="h1" style={{ color: theme.primary }}>{operatorName}</Typography>
              </Typography>
              <Typography variant="caption" style={dynamicStyles.subtitle}>Secure Portfolio Command & Control</Typography>
            </View>
            <TierBadge tier={tier as any} />
          </View>

          <TouchableOpacity 
            style={dynamicStyles.initBtn}
            onPress={() => navigation.navigate('Portfolios', { screen: 'PortfolioBuilder' })}
          >
            <PlusCircle size={16} color={theme.background} />
            <Typography variant="monoBold" style={[dynamicStyles.initBtnText, { color: theme.background }]}>INITIALIZE_STRATEGY</Typography>
          </TouchableOpacity>
        </View>

        {/* Global Summary Card */}
        <GlassCard intensity="high" style={dynamicStyles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Typography variant="mono" style={styles.summaryLabel}>TOTAL_ASSETS_UNDER_MANAGEMENT</Typography>
            <TouchableOpacity onPress={onRefresh} disabled={isRefreshing}>
              <RefreshCw size={14} color={theme.textTertiary} style={isRefreshing && { opacity: 0.5 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.valueRow}>
            <Typography variant="h1" style={[styles.currency, { color: theme.primary }]}>$</Typography>
            <Typography variant="h1" style={styles.totalAum}>
              {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Typography variant="mono" style={styles.statLabel}>RISK_INTENSITY</Typography>
              <Typography variant="monoBold" style={[styles.statValue, { color: '#FFD60A' }]}>{riskScore}% <Typography variant="caption" style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>NOMINAL</Typography></Typography>
            </View>
            <View style={styles.statItem}>
              <Typography variant="mono" style={styles.statLabel}>ACTIVE_SIMS</Typography>
              <Typography variant="monoBold" style={styles.statValue}>{currentStatus === 'running' ? '1' : '0'} <Typography variant="caption" style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>JOBS</Typography></Typography>
            </View>
            <View style={styles.statItem}>
              <Typography variant="mono" style={styles.statLabel}>DEPLOYMENTS</Typography>
              <Typography variant="monoBold" style={styles.statValue}>{portfolios.length} <Typography variant="caption" style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>TOTAL</Typography></Typography>
            </View>
          </View>
        </GlassCard>

        {/* Portfolio Insights Section */}
        <View style={dynamicStyles.sectionHeader}>
          <Typography variant="monoBold" style={dynamicStyles.sectionTitle}>VAULT_INSIGHTS</Typography>
          <TrendingUp size={14} color={theme.primary} />
        </View>
        
        <GlassCard intensity="medium" style={dynamicStyles.insightsCard}>
          <InsightFeed insights={insights.slice(0, 3)} />
          {insights.length > 3 && (
            <TouchableOpacity 
              style={dynamicStyles.expandBtn}
              onPress={() => setIsFeedExpanded(true)}
            >
              <Typography variant="mono" style={dynamicStyles.expandText}>ACCESS_FULL_DATA_STREAM</Typography>
              <ChevronRight size={14} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Functional Modules Grid */}
        <View style={dynamicStyles.sectionHeader}>
          <Typography variant="monoBold" style={dynamicStyles.sectionTitle}>FUNCTIONAL_MODULES</Typography>
        </View>
        
        <View style={dynamicStyles.moduleGrid}>
          <ModuleItem 
            title="STATION"
            sub="Asset Mgmt"
            Icon={TrendingUp}
            color={theme.primary}
            onPress={() => navigation.navigate('Portfolios', { screen: 'AssetManagement' })}
            width={dynamicStyles.moduleWidth}
          />
          <ModuleItem 
            title="PORTFOLIO"
            sub="Holdings"
            Icon={Shield}
            color={theme.textSecondary}
            onPress={() => navigation.navigate('Portfolios', { screen: 'PortfolioList' })}
            width={dynamicStyles.moduleWidth}
          />
          <ModuleItem 
            title="STRAT"
            sub="Builder"
            Icon={Layers}
            color={theme.secondary}
            onPress={() => navigation.navigate('Portfolios', { screen: 'PortfolioBuilder' })}
            width={dynamicStyles.moduleWidth}
          />
          <ModuleItem 
            title="MODEL"
            sub="Simulator"
            Icon={BarChart3}
            color="#F59E0B"
            onPress={() => navigation.navigate('Simulations', { screen: 'SimulationSetup' })}
            width={dynamicStyles.moduleWidth}
          />
          <ModuleItem 
            title="ASSISTANT"
            sub="AI Intel"
            Icon={Cpu}
            color="#10B981"
            onPress={() => navigation.navigate('AI', { screen: 'AIChatMain' })}
            locked={tier === 'free'}
            width={dynamicStyles.moduleWidth}
          />
        </View>

        {/* Security Alert Banner */}
        {tier === 'free' && !hasUsedTrial && (
          <TouchableOpacity onPress={() => setShowTrialModal(true)} style={styles.securityBanner}>
            <View style={[styles.securityIcon, { backgroundColor: theme.primary }]}>
              <ShieldCheck size={20} color={theme.background} />
            </View>
            <View style={styles.securityContent}>
              <Typography variant="monoBold" style={styles.securityTitle}>UPGRADE_RECOMMENDED</Typography>
              <Typography variant="caption" style={styles.securitySubtitle}>Aactivate 14D Plus clearance to access Secure modules.</Typography>
            </View>
            <ChevronRight size={16} color={theme.primary} />
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Expanded Feed Modal */}
      <Modal visible={isFeedExpanded} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#05070A' : '#FFF' }]}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">INSIGHT_STREAM</Typography>
              <TouchableOpacity onPress={() => setIsFeedExpanded(false)}>
                <ChevronDown size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <InsightFeed insights={insights} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BiometricEnrollmentModal 
        visible={showBiometricModal} 
        onClose={() => setShowBiometricModal(false)} 
      />
      <TermsConsentModal />
      <TrialRewardModal 
        isVisible={showTrialModal} 
        onClose={() => setShowTrialModal(false)} 
      />
    </View>
  );
}

function ModuleItem({ title, sub, Icon, color, onPress, locked, width }: any) {
  const { theme } = useTheme();
  const { showToast } = useToast();

  return (
    <TouchableOpacity 
      style={[styles.moduleItem, { width }]}
      onPress={locked ? () => showToast('ACCESS_RESTRICTED: Upgrade required.', 'error') : onPress}
    >
      <GlassCard intensity="low" style={styles.moduleCard}>
        <View style={[styles.moduleIcon, { backgroundColor: locked ? 'rgba(255,255,255,0.05)' : color + '15' }]}>
          {locked ? <Lock size={16} color="rgba(255,255,255,0.2)" /> : <Icon size={16} color={color} />}
        </View>
        <Typography variant="monoBold" style={[styles.moduleTitle, locked && { opacity: 0.5 }]}>{title}</Typography>
        <Typography variant="caption" style={styles.moduleSub}>{locked ? 'PLUS_ONLY' : sub}</Typography>
      </GlassCard>
    </TouchableOpacity>
  );
}

const getStyles = (theme: any, isDark: boolean, width: number, breakpoint: string) => {
  const isLarge = breakpoint === 'lg' || breakpoint === 'xl';
  const numColumns = isLarge ? 4 : (breakpoint === 'md' ? 3 : 2);
  const gap = 10;
  const padding = 20;
  const moduleWidth = (width - (padding * 2) - (gap * (numColumns - 1))) / numColumns;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scroll: {
      padding: padding,
      paddingTop: 10,
    },
    headerSection: {
      marginBottom: 24,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    mainTitle: {
      fontSize: isLarge ? 36 : 28,
      fontWeight: '900',
      letterSpacing: -1,
      lineHeight: isLarge ? 40 : 32,
    },
    subtitle: {
      fontSize: 10,
      color: '#848D97',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: 4,
    },
    initBtn: {
      backgroundColor: '#FFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
      maxWidth: isLarge ? 300 : '100%',
    },
    initBtnText: {
      fontSize: 10,
      letterSpacing: 1,
    },
    summaryCard: {
      padding: 24,
      borderRadius: 24,
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 10,
      color: '#848D97',
      letterSpacing: 2,
    },
    insightsCard: {
      padding: 16,
      borderRadius: 20,
      marginBottom: 24,
    },
    expandBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.05)',
    },
    expandText: {
      fontSize: 9,
      color: '#848D97',
      letterSpacing: 1,
    },
    moduleGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: gap,
      marginBottom: 24,
    },
  });

  return {
    ...styles,
    moduleWidth,
  };
};

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  terminalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  terminalBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#848D97',
    letterSpacing: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  currency: {
    fontSize: 24,
    marginRight: 4,
    marginTop: 4,
  },
  totalAum: {
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 8,
    color: '#848D97',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
  },
  moduleItem: {
    marginBottom: 10,
  },
  moduleCard: {
    padding: 16,
    borderRadius: 16,
    height: 110,
    justifyContent: 'center',
  },
  moduleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 12,
    letterSpacing: 1,
    color: '#FFF',
  },
  moduleSub: {
    fontSize: 8,
    color: '#848D97',
  },
  securityBanner: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 12,
    color: '#FFF',
    marginBottom: 2,
  },
  securitySubtitle: {
    fontSize: 9,
    color: '#848D97',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalScroll: {
    paddingBottom: 40,
  }
});
