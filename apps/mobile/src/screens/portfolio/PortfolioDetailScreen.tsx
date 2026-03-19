import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { theme } from '../../constants/theme';
import { usePortfolioStore } from '../../store/portfolioStore';
import { AssetCard } from '../../components/ui/AssetCard';
import { PieChart } from 'react-native-svg-charts';
import { Text as SvgText } from 'react-native-svg';
import { Play, Cpu, Trash2, Grid } from 'lucide-react-native';
import { CorrelationHeatmap } from '../../components/charts/CorrelationHeatmap';

export function PortfolioDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { portfolios } = usePortfolioStore();
  const portfolio = portfolios.find(p => p.id === id);

  if (!portfolio) {
    return (
      <View style={styles.centerContainer}>
        <Typography variant="body" style={{color: theme.colors.error}}>Portfolio not found.</Typography>
        <TouchableOpacity style={{marginTop: 20}} onPress={() => navigation.goBack()}>
          <Typography variant="button">Go Back</Typography>
        </TouchableOpacity>
      </View>
    );
  }

  // Generate pie chart data
  const pieData = useMemo(() => {
    const colors = [theme.colors.primary, theme.colors.secondary, '#10B981', '#F59E0B', '#F43F5E', '#3B82F6'];
    return (portfolio.assets || []).map((asset, index) => ({
      value: asset.weight * 100,
      svg: { fill: colors[index % colors.length] },
      key: `pie-${index}`,
      ticker: asset.ticker,
    }));
  }, [portfolio.assets]);

  const Labels = ({ slices, height, width }: any) => {
    return slices.map((slice: any, index: number) => {
        const { labelCentroid, pieCentroid, data } = slice;
        return (
            <SvgText
                key={index}
                x={pieCentroid[0]}
                y={pieCentroid[1]}
                fill={theme.colors.background}
                textAnchor={'middle'}
                alignmentBaseline={'middle'}
                fontSize={10}
                fontFamily={theme.typography.fonts.mono}
                fontWeight="bold"
            >
              {data.ticker}
            </SvgText>
        )
    })
  };

  const formattedTotal = (portfolio.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <Typography variant="button" style={{color: theme.colors.textSecondary}}>← Back</Typography>
          </TouchableOpacity>
          <Typography variant="h2" style={styles.title}>{portfolio.name}</Typography>
          {portfolio.description && (
            <Typography variant="body" style={styles.desc}>{portfolio.description}</Typography>
          )}
        </View>

        <View style={styles.topSection}>
          <View style={styles.valueContainer}>
            <Typography variant="caption" style={styles.label}>EST ACTIVE EXPOSURE</Typography>
            <Typography variant="h1" style={styles.value}>${formattedTotal}</Typography>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('Simulations', { screen: 'SimulationSetup', params: { portfolioId: portfolio.id } })}
            >
              {(Play as any)({ size: 16, color: theme.colors.background })}
              <Typography variant="button" style={[styles.actionText, { color: theme.colors.background }]}>RUN MODEL</Typography>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceLight, borderWidth: 1, borderColor: theme.colors.secondary }]}
              onPress={() => navigation.navigate('AI', { screen: 'AIChat', params: { portfolioId: portfolio.id, workflow: 'portfolio_doctor' } })}
            >
              {(Cpu as any)({ size: 16, color: theme.colors.secondary })}
              <Typography variant="button" style={[styles.actionText, { color: theme.colors.secondary }]}>AI DOCTOR</Typography>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Typography variant="caption" style={styles.sectionTitle}>ASSET ALLOCATION</Typography>
          {portfolio.assets && portfolio.assets.length > 0 ? (
            <View style={{ height: 200, marginTop: 10 }}>
              <PieChart
                style={{ height: 200 }}
                valueAccessor={({ item }: { item: any }) => item.value}
                data={pieData}
                outerRadius={'95%'}
                innerRadius={'50%'}
              >
                <Labels />
              </PieChart>
              <View style={styles.pieCenterOverlay}>
                <Typography variant="h3" style={{fontFamily: theme.typography.fonts.mono}}>
                  {portfolio.assets.length}
                </Typography>
                <Typography variant="caption" style={{fontSize: 10}}>Positions</Typography>
              </View>
            </View>
          ) : (
            <Typography variant="body" style={styles.emptyChart}>No assets allocated</Typography>
          )}
        </View>

        <Typography variant="caption" style={[styles.sectionTitle, { marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }]}>
          CONSTITUENTS
        </Typography>

        <View style={styles.assetList}>
          {portfolio.assets?.map((asset) => (
            <AssetCard 
              key={asset.ticker}
              ticker={asset.ticker}
              name={asset.name}
              weight={asset.weight}
              amountValue={(portfolio.total_value || 0) * asset.weight}
            />
          ))}
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
  scroll: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    marginBottom: 8,
  },
  title: {
    color: '#FFF',
  },
  desc: {
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  topSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  label: {
    color: theme.colors.textTertiary,
    fontFamily: theme.typography.fonts.mono,
    letterSpacing: 1,
    marginBottom: 8,
  },
  valueContainer: {
    marginBottom: theme.spacing.xl,
  },
  value: {
    fontFamily: theme.typography.fonts.mono,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    gap: 8,
  },
  actionText: {
    fontFamily: theme.typography.fonts.mono,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fonts.mono,
    letterSpacing: 1,
  },
  chartCard: {
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  pieCenterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChart: {
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 40,
    color: theme.colors.textTertiary,
  },
  assetList: {
    marginBottom: theme.spacing.xxl,
  },
});
