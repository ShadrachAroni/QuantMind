import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { usePortfolioStore, usePortfolios } from '../../store/portfolioStore';
import { Asset } from '@quantmind/shared-types';
import { AssetCard } from '../../components/ui/AssetCard';
import { PieChart } from 'react-native-svg-charts';
import { Text as SvgText } from 'react-native-svg';
import { Play, Cpu, ShieldAlert, ChevronLeft, Target, Activity } from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { useTheme } from '../../context/ThemeContext';
import { sharedTheme } from '../../constants/theme';
import { STRINGS } from '../../constants/strings';
import { CorrelationHeatmap } from '../../components/charts/CorrelationHeatmap';

const { width } = Dimensions.get('window');

export function PortfolioDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const portfolios = usePortfolios();
  const { theme, isDark } = useTheme();
  const portfolio = portfolios.find(p => p.id === id);

  const PrevIcon = ChevronLeft as any;
  const RunIcon = Play as any;
  const ClinicIcon = Cpu as any;
  const RiskIcon = ShieldAlert as any;
  const TargetIcon = Target as any;
  const ActivityIcon = Activity as any;
  const [isRebalanceMode, setIsRebalanceMode] = React.useState(false);
  const [proposedAssets, setProposedAssets] = React.useState<Asset[]>([]);

  const dynamicStyles = getStyles(theme, isDark);

  if (!portfolio) {
    return (
      <View style={[dynamicStyles.centerContainer, { backgroundColor: theme.background }]}>
        <Typography variant="body" style={{color: theme.error}}>{STRINGS.KERNEL_PANIC}: PORTFOLIO_NOT_FOUND</Typography>
        <TouchableOpacity style={{marginTop: 20}} onPress={() => navigation.goBack()}>
          <Typography variant="mono" style={{ color: theme.primary }}>{STRINGS.REBOOT_SESSION}</Typography>
        </TouchableOpacity>
      </View>
    );
  }

  const pieData = useMemo(() => {
    const assetsToUse = isRebalanceMode ? proposedAssets : (portfolio.assets || []);
    const colors = [theme.primary, theme.secondary, '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];
    return assetsToUse.map((asset, index) => ({
      value: asset.weight * 100,
      svg: { fill: colors[index % colors.length] },
      key: `pie-${index}`,
      ticker: asset.ticker,
    }));
  }, [portfolio.assets, proposedAssets, isRebalanceMode, theme]);

  const Labels = ({ slices }: any) => {
    return slices.map((slice: any, index: number) => {
        const { pieCentroid, data } = slice;
        return (
            <SvgText
                key={index}
                x={pieCentroid[0]}
                y={pieCentroid[1]}
                fill="#FFFFFF"
                textAnchor={'middle'}
                alignmentBaseline={'middle'}
                fontSize={8}
                fontFamily={sharedTheme.typography.fonts.mono}
                fontWeight="bold"
            >
              {data.ticker}
            </SvgText>
        )
    })
  };

  const formattedTotal = (portfolio.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
            <PrevIcon size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          <View>
            <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>{STRINGS.IDENTIFIER}: {portfolio.id.slice(0, 8).toUpperCase()}</Typography>
            <Typography variant="h2" style={[dynamicStyles.title, { color: theme.textPrimary }]}>{portfolio.name.toUpperCase()}</Typography>
          </View>
        </View>

        <GlassCard intensity="high" style={dynamicStyles.mainStats}>
          <View style={[dynamicStyles.statusRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }]}>
              <GlowEffect color={theme.primary} size={6} glowRadius={8} />
              <Typography variant="mono" style={[dynamicStyles.statusText, { color: theme.primary }]}>{STRINGS.SYSTEM_ACTIVE}</Typography>
          </View>

          <Typography variant="mono" style={[dynamicStyles.label, { color: theme.textTertiary }]}>{STRINGS.TOTAL_CAPITAL_ALLOCATION}</Typography>
          <View style={dynamicStyles.valueRow}>
            <Typography variant="h1" style={[dynamicStyles.currency, { color: theme.primary }]}>$</Typography>
            <Typography variant="h1" style={[dynamicStyles.totalValue, { color: theme.textPrimary }]}>{formattedTotal}</Typography>
          </View>

          <View style={dynamicStyles.actionGrid}>
            <TouchableOpacity 
              style={[dynamicStyles.actionBtn, { backgroundColor: isRebalanceMode ? theme.primary : theme.primary + '15', borderColor: theme.primary + '33' }]}
              onPress={() => {
                if (!isRebalanceMode) {
                  setProposedAssets([...(portfolio.assets || [])]);
                  setIsRebalanceMode(true);
                } else {
                  setIsRebalanceMode(false);
                }
              }}
            >
              <ActivityIcon size={14} color={isRebalanceMode ? theme.background : theme.primary} />
              <Typography variant="monoBold" style={[dynamicStyles.actionText, { color: isRebalanceMode ? theme.background : theme.primary }]}>
                {isRebalanceMode ? 'EXIT_REBALANCE' : 'REBALANCE'}
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[dynamicStyles.actionBtn, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '33' }]}
              onPress={() => navigation.navigate('Simulations', { 
                screen: 'SimulationSetup', 
                params: { 
                  portfolioId: portfolio.id, 
                  isComparison: isRebalanceMode,
                  proposedAssets: isRebalanceMode ? proposedAssets : null
                } 
              })}
            >
              <RunIcon size={14} color={theme.primary} />
              <Typography variant="monoBold" style={[dynamicStyles.actionText, { color: theme.primary }]}>
                {isRebalanceMode ? 'SIM_PROPOSAL' : STRINGS.MODEL}
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[dynamicStyles.actionBtn, { backgroundColor: theme.secondary + '15', borderColor: theme.secondary + '33' }]}
              onPress={() => navigation.navigate('AI', { screen: 'AIChat', params: { 
                portfolioId: portfolio.id, 
                workflow: 'portfolio_doctor',
                proposedAssets: isRebalanceMode ? proposedAssets : null
              } })}
            >
              <ClinicIcon size={14} color={theme.secondary} />
              <Typography variant="monoBold" style={[dynamicStyles.actionText, { color: theme.secondary }]}>{STRINGS.ORACLE}</Typography>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[dynamicStyles.actionBtn, { backgroundColor: theme.error + '15', borderColor: theme.error + '33' }]}
              onPress={() => navigation.navigate('AI', { screen: 'AIChat', params: { portfolioId: portfolio.id, workflow: 'risk_assessment' } })}
            >
              <RiskIcon size={14} color={theme.error} />
              <Typography variant="monoBold" style={[dynamicStyles.actionText, { color: theme.error }]}>{STRINGS.PENDING}</Typography>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={dynamicStyles.chartSection}>
          <Typography variant="h3" style={[dynamicStyles.sectionTitle, { color: theme.textTertiary }]}>{STRINGS.WEIGHT_CALIBRATION}</Typography>
          <GlassCard style={dynamicStyles.chartCard}>
            {portfolio.assets && portfolio.assets.length > 0 ? (
              <View style={dynamicStyles.chartContainer}>
                <PieChart
                  style={{ height: 180 }}
                  valueAccessor={({ item }: { item: any }) => item.value}
                  data={pieData}
                  outerRadius={'90%'}
                  innerRadius={'65%'}
                  padAngle={0.03}
                >
                  <Labels />
                </PieChart>
                <View style={dynamicStyles.pieCenter}>
                  <TargetIcon size={24} color={theme.textTertiary} style={{ opacity: 0.5 }} />
                  <Typography variant="mono" style={[dynamicStyles.posCount, { color: theme.textPrimary }]}>{portfolio.assets.length}</Typography>
                  <Typography variant="caption" style={[dynamicStyles.posLabel, { color: theme.textTertiary }]}>{STRINGS.ACTIVE_PORTFOLIOS}</Typography>
                </View>
              </View>
            ) : (
              <View style={dynamicStyles.emptyChart}>
                <ActivityIcon size={32} color={theme.textTertiary} style={{ opacity: 0.3, marginBottom: 12 }} />
                <Typography variant="mono" style={[dynamicStyles.emptyText, { color: theme.textTertiary }]}>{STRINGS.WAITING_FOR_DATA_INPUT}</Typography>
              </View>
            )}
          </GlassCard>
        </View>

        <Typography variant="h3" style={[dynamicStyles.sectionTitle, { marginTop: 32, color: theme.textTertiary }]}>
          {isRebalanceMode ? 'REBALANCE_PARAMETERS' : 'CONSTITUENTS_VIEW'}
        </Typography>
        <View style={dynamicStyles.assetList}>
          {(isRebalanceMode ? proposedAssets : (portfolio.assets || [])).map((asset, index) => {
            const originalAsset = portfolio.assets?.find(a => a.ticker === asset.ticker);
            const delta = originalAsset ? (asset.weight - originalAsset.weight) : 0;
            
            return (
              <AssetCard 
                key={asset.ticker}
                ticker={asset.ticker}
                name={asset.name}
                weight={asset.weight}
                amountValue={(portfolio.total_value || 0) * asset.weight}
                delta={isRebalanceMode ? delta : undefined}
                onPress={() => {
                  if (isRebalanceMode) {
                    const newWeights = [...proposedAssets];
                    newWeights[index].weight = (newWeights[index].weight + 0.1) % 0.5;
                    setProposedAssets(newWeights);
                  }
                }}
              />
            );
          })}
        </View>

        <View style={dynamicStyles.chartSection}>
          <Typography variant="h3" style={[dynamicStyles.sectionTitle, { color: theme.textTertiary }]}>DIVERSIFICATION_INTERPLAY</Typography>
          <CorrelationHeatmap 
            labels={portfolio.assets?.map(a => a.ticker) || []} 
            symbols={portfolio.assets?.map(a => a.ticker)}
          />
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
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    letterSpacing: 1,
  },
  mainStats: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  currency: {
    fontSize: 24,
    marginTop: 4,
    marginRight: 4,
  },
  totalValue: {
    fontSize: 32,
    letterSpacing: -1,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  chartSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 4,
  },
  chartCard: {
    padding: 20,
    borderRadius: 24,
  },
  chartContainer: {
    position: 'relative',
    height: 180,
  },
  pieCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posCount: {
    fontSize: 20,
    marginTop: 4,
  },
  posLabel: {
    fontSize: 8,
    letterSpacing: 1,
  },
  emptyChart: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  assetList: {
    marginBottom: 40,
  },
});
