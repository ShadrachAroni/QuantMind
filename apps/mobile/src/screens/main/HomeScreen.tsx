import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { sharedTheme } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useSimulationStore } from '../../store/simulationStore';
import { TierBadge } from '../../components/ui/TierBadge';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { TickerTape } from '../../components/ui/TickerTape';
import { useToast } from '../../context/ToastContext';
import { STRINGS } from '../../constants/strings';
import { BiometricEnrollmentModal } from '../../components/auth/BiometricEnrollmentModal';
import { TermsConsentModal } from '../../components/auth/TermsConsentModal';
import { TrialRewardModal } from '../../components/rewards/TrialRewardModal';
import { 
  Activity, 
  Cpu, 
  Settings, 
  Shield, 
  BarChart3, 
  Zap, 
  TrendingUp,
  Terminal,
  Layers,
  Lock,
  Gift
} from 'lucide-react-native';
import { TIER_ENTITLEMENTS, SubscriptionTier } from '@quantmind/shared-types';

const { width } = Dimensions.get('window');

export function HomeScreen({ navigation }: any) {
  const { user, tier } = useAuthStore();
  const { theme, isDark } = useTheme();
  const { portfolios, fetchPortfolios, isLoading } = usePortfolioStore();
  const { result } = useSimulationStore();
  const { isBiometricSupported, isBiometricEnabled, hasPromptedBiometrics, hasUsedTrial } = useAuthStore();
  const [showBiometricModal, setShowBiometricModal] = React.useState(false);
  const [showTrialModal, setShowTrialModal] = React.useState(false);
  
  const ActivityIcon = Activity as any;
  const CpuIcon = Cpu as any;
  const SettingsIcon = Settings as any;
  const ShieldIcon = Shield as any;
  const ChartIcon = BarChart3 as any;
  const ZapIcon = Zap as any;
  const TrendIcon = TrendingUp as any;
  const TerminalIcon = Terminal as any;
  const LayersIcon = Layers as any;
  const GiftIcon = Gift as any;

  useEffect(() => {
    fetchPortfolios();
    
    // Check if we should prompt for biometrics
    if (isBiometricSupported && !isBiometricEnabled && !hasPromptedBiometrics) {
      const timer = setTimeout(() => setShowBiometricModal(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isBiometricSupported, isBiometricEnabled, hasPromptedBiometrics]);

  const totalValue = portfolios.reduce((sum, p) => sum + (p.total_value || 0), 0);
  const dynamicStyles = getStyles(theme, isDark);

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <TickerTape />
      <ScrollView 
        contentContainerStyle={dynamicStyles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={fetchPortfolios} 
            tintColor={theme.primary} 
            progressBackgroundColor={theme.surface}
          />
        }
      >
        {/* Top Bar */}
        <View style={dynamicStyles.topBar}>
          <View>
            <Typography variant="mono" style={dynamicStyles.greeting}>ACCESS_GRANTED // {user?.email?.split('@')[0].toUpperCase()}</Typography>
            <Typography variant="h1" style={[dynamicStyles.mainTitle, { color: theme.textPrimary }]}>{STRINGS.TERMINAL_DASH}</Typography>
          </View>
          <TierBadge tier={tier as any} />
        </View>

        {/* Global Allocation GlassCard */}
        <GlassCard intensity="high" style={dynamicStyles.allocationCard}>
          <View style={dynamicStyles.cardHeader}>
            <View style={dynamicStyles.statusRow}>
              <GlowEffect color={theme.primary} size={6} glowRadius={8} />
              <Typography variant="mono" style={[dynamicStyles.statusText, { color: theme.primary }]}>{STRINGS.SYSTEM_ACTIVE}</Typography>
            </View>
            <TrendIcon size={16} color={theme.primary} />
          </View>
          
          <Typography variant="mono" style={dynamicStyles.cardLabel}>{STRINGS.TOTAL_CAPITAL_ALLOCATION}</Typography>
          <View style={dynamicStyles.valueRow}>
            <Typography variant="h1" style={[dynamicStyles.currencySymbol, { color: theme.primary }]}>$</Typography>
            <Typography variant="h1" style={[dynamicStyles.totalValue, { color: theme.textPrimary }]}>
              {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </View>
          
          <View style={dynamicStyles.cardFooter}>
            <View style={dynamicStyles.assetCount}>
              <LayersIcon size={12} color={theme.textTertiary} />
              <Typography variant="caption" style={dynamicStyles.assetCountText}>
                {portfolios.length} {STRINGS.ACTIVE_PORTFOLIOS}
              </Typography>
            </View>
            <Typography variant="mono" style={[dynamicStyles.deltaText, { color: totalValue >= 100000 ? theme.primary : '#FF453A' }]}>
              {totalValue >= 100000 ? '+' : ''}{((totalValue - 100000) / 1000).toFixed(2)}% <TrendIcon size={10} color={totalValue >= 100000 ? theme.primary : '#FF453A'} />
            </Typography>
          </View>
        </GlassCard>

        {/* Trial Promotion Banner */}
        {tier === 'free' && !hasUsedTrial && (
          <TouchableOpacity onPress={() => setShowTrialModal(true)}>
            <GlassCard intensity="medium" style={dynamicStyles.trialBanner}>
              <View style={dynamicStyles.trialHeader}>
                <View style={[dynamicStyles.rewardTag, { backgroundColor: '#D4AF37' + '22' }]}>
                  <GiftIcon size={10} color="#D4AF37" />
                  <Typography variant="monoBold" style={[dynamicStyles.rewardTagText, { color: '#D4AF37' }]}>
                    {STRINGS.REWARD_AVAILABLE}
                  </Typography>
                </View>
                <ZapIcon size={12} color="#D4AF37" fill="#D4AF37" />
              </View>
              <Typography variant="monoBold" style={dynamicStyles.trialTitle}>{STRINGS.CLAIM_PLUS_TRIAL}</Typography>
              <Typography variant="caption" style={dynamicStyles.trialSubtitle}>EXPERIENCE_INSTITUTIONAL_CLEARANCE_NOW</Typography>
            </GlassCard>
          </TouchableOpacity>
        )}

        <Typography variant="h3" style={dynamicStyles.sectionTitle}>{STRINGS.CORE_MODULES}</Typography>
        
        <View style={dynamicStyles.grid}>
          <ModuleItem 
            title={STRINGS.STATION}
            desc={STRINGS.ASSET_MGMT}
            Icon={TrendIcon}
            color={theme.primary}
            onPress={() => navigation.navigate('Portfolios', { screen: 'AssetManagement' })}
            locked={!(TIER_ENTITLEMENTS as any)[(tier || 'free')]?.allow_asset_management}
          />
          <ModuleItem 
            title={STRINGS.VAULT}
            desc={STRINGS.ASSET_HOLDINGS}
            Icon={ShieldIcon}
            color={theme.textSecondary}
            onPress={() => navigation.navigate('Portfolios', { screen: 'PortfolioList' })}
          />
          <ModuleItem 
            title={STRINGS.STRAT}
            desc={STRINGS.MODEL_BUILDER}
            Icon={LayersIcon}
            color={theme.secondary}
            onPress={() => navigation.navigate('Portfolios', { screen: 'PortfolioBuilder' })}
          />
          <ModuleItem 
            title={STRINGS.MODEL}
            desc={STRINGS.SIM_ENGINE}
            Icon={ChartIcon}
            color="#F59E0B"
            onPress={() => navigation.navigate('Simulations', { screen: 'SimulationSetup' })}
          />
          <ModuleItem 
            title={STRINGS.ORACLE}
            desc={STRINGS.AI_ASSISTANT}
            Icon={CpuIcon}
            color="#10B981"
            onPress={() => navigation.navigate('AI', { screen: 'AIChatMain' })}
          />
        </View>

        <Typography variant="h3" style={dynamicStyles.sectionTitle}>{STRINGS.REAL_TIME_FEED}</Typography>
        {result ? (
          <GlassCard style={dynamicStyles.activityCard}>
            <View style={dynamicStyles.activityHeader}>
              <View style={dynamicStyles.activityTag}>
                <GlowEffect color={theme.primary} size={4} glowRadius={4} />
                <Typography variant="mono" style={[dynamicStyles.tagText, { color: theme.primary }]}>{STRINGS.SIM_COMPLETE}</Typography>
              </View>
              <Typography variant="mono" style={dynamicStyles.timestamp}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
            </View>
            <Typography variant="body" style={[dynamicStyles.activityMsg, { color: isDark ? '#E2E8F0' : theme.textPrimary }]}>
              Portfolio VaR calculated at <Typography variant="monoBold" style={{ color: theme.primary }}>{((result?.metrics?.var_95 || 0) * 100).toFixed(2)}%</Typography>
            </Typography>
            <TouchableOpacity 
              style={[dynamicStyles.viewResultBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}
              onPress={() => navigation.navigate('Simulations', { screen: 'SimulationResults' })}
            >
              <Typography variant="mono" style={[dynamicStyles.viewLink, { color: theme.primary }]}>{STRINGS.ACCESS_RESULTS_DATA_STREAM}</Typography>
              <ZapIcon size={12} color={theme.primary} />
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <GlassCard intensity="low" style={dynamicStyles.emptyState}>
            <TerminalIcon size={20} color={theme.textTertiary} style={{ marginBottom: 12 }} />
            <Typography variant="mono" style={dynamicStyles.emptyText}>{STRINGS.WAITING_FOR_DATA_INPUT}</Typography>
          </GlassCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

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

function ModuleItem({ title, desc, Icon, color, onPress, locked }: any) {
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const dynamicStyles = getStyles(theme, isDark);
  const IconAny = Icon as any;
  const LockIcon = Lock as any;

  return (
    <TouchableOpacity 
      style={[dynamicStyles.gridItemWrapper, locked && { opacity: 0.7 }]} 
      onPress={locked ? () => showToast('ACCESS_RESTRICTED: Upgrade required.', 'error') : onPress}
      activeOpacity={locked ? 0.9 : 0.7}
    >
      <GlassCard style={dynamicStyles.gridItem}>
        <View style={[dynamicStyles.iconBox, { backgroundColor: locked ? theme.surfaceLight : color + '15', borderColor: locked ? theme.border : color + '33' }]}>
          {locked ? (
            <LockIcon size={20} color={theme.textTertiary} />
          ) : (
            <IconAny size={20} color={color} />
          )}
        </View>
        <Typography variant="monoBold" style={[dynamicStyles.gridTitle, { color: locked ? theme.textTertiary : theme.textPrimary }]}>{title}</Typography>
        <Typography variant="caption" style={[dynamicStyles.gridDesc, { color: theme.textTertiary }]}>{locked ? 'LOCKED_MODULE' : desc}</Typography>
        
        {locked && (
          <View style={[dynamicStyles.lockBadge, { backgroundColor: theme.primary }]}>
            <LockIcon size={8} color={theme.background} />
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scroll: {
    padding: sharedTheme.spacing.xl,
    paddingTop: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 24,
  },
  greeting: {
    fontSize: 10,
    color: theme.textTertiary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  mainTitle: {
    letterSpacing: 2,
    fontSize: 24,
  },
  allocationCard: {
    padding: 24,
    marginBottom: 32,
    borderRadius: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 9,
    color: theme.primary,
    letterSpacing: 1,
  },
  cardLabel: {
    color: theme.textTertiary,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 24,
    color: theme.primary,
    marginTop: 4,
    marginRight: 4,
  },
  totalValue: {
    fontSize: 36,
    letterSpacing: -1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  },
  assetCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assetCountText: {
    fontSize: 10,
    color: theme.textTertiary,
  },
  deltaText: {
    fontSize: 12,
    color: theme.primary,
  },
  sectionTitle: {
    fontSize: 12,
    color: theme.textTertiary,
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  gridItemWrapper: {
    width: (width - 48 - 12) / 2,
  },
  gridItem: {
    padding: 16,
    borderRadius: 20,
    height: 120,
    justifyContent: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  gridTitle: {
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 2,
    color: theme.textPrimary,
  },
  gridDesc: {
    fontSize: 9,
    color: theme.textTertiary,
    letterSpacing: 0.5,
  },
  activityCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 40,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontSize: 9,
    color: theme.primary,
    letterSpacing: 1,
  },
  timestamp: {
    fontSize: 10,
    color: theme.textTertiary,
  },
  activityMsg: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  viewResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  viewLink: {
    fontSize: 10,
    color: theme.primary,
    letterSpacing: 1,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderStyle: 'dashed',
    marginBottom: 40,
  },
  emptyText: {
    fontSize: 10,
    color: theme.textTertiary,
    letterSpacing: 2,
  },
  lockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialBanner: {
    padding: 16,
    marginBottom: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  trialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rewardTagText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  trialTitle: {
    fontSize: 14,
    color: '#D4AF37',
    marginBottom: 2,
    letterSpacing: 1,
  },
  trialSubtitle: {
    fontSize: 9,
    color: '#777',
    letterSpacing: 0.5,
  },
});
