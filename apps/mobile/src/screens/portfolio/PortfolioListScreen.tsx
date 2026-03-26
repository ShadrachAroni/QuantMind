import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { usePortfolioStore, usePortfolios } from '../../store/portfolioStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { Plus, MoreVertical, TrendingUp, TrendingDown, Database, Activity, Lock } from 'lucide-react-native';
import { Svg, Path, LinearGradient, Stop, Defs } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { sharedTheme } from '../../constants/theme';
import { STRINGS } from '../../constants/strings';
import Animated, { useSharedValue, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const Sparkline = ({ seed = 'default', color = '#3B82F6', width = 100, height = 30 }) => {
  // Simple deterministic random based on seed string
  const getDeterministicData = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    
    const data = [];
    let current = 50;
    for (let i = 0; i < 20; i++) {
       // Use hash to influence the step
       const stepHash = Math.abs(Math.sin(hash + i) * 10);
       current += (stepHash - 5);
       data.push(Math.max(10, Math.min(90, current)));
    }
    return data;
  };

  const data = getDeterministicData(seed);
  const points = data.map((val, i) => `${(i / (data.length - 1)) * 100},${100 - val}`).join(' ');
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      <Svg height="40" width="120" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path
          d={`M 0,100 L ${points} L 100,100 Z`}
          fill="url(#grad)"
        />
        <Path
          d={`M ${points}`}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
};

export function PortfolioListScreen({ navigation }: any) {
  const { fetchPortfolios, isLoading } = usePortfolioStore();
  const portfolios = usePortfolios();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  const totalValue = portfolios.reduce((sum: number, p: any) => sum + (p.total_value || 0), 0);
  
  const PlusIcon = Plus as any;
  const DatabaseIcon = Database as any;
  const ActivityIcon = Activity as any;
  const LockIcon = Lock as any;
  const MoreIcon = MoreVertical as any;

  const dynamicStyles = getStyles(theme, isDark);

  const renderItem = ({ item }: { item: any }) => {
    const isUp = Math.random() > 0.3;
    const perfColor = isUp ? theme.primary : theme.error;
    const TrendIcon = (isUp ? TrendingUp : TrendingDown) as any;

    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('PortfolioDetail', { id: item.id })}
        activeOpacity={0.8}
        style={dynamicStyles.cardWrapper}
      >
        <GlassCard intensity="medium" style={dynamicStyles.card}>
          <View style={dynamicStyles.cardHeader}>
            <View style={dynamicStyles.headerLeft}>
              <View style={[dynamicStyles.avatar, { borderColor: perfColor + '44', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                <Typography variant="monoBold" style={[dynamicStyles.avatarText, { color: perfColor }]}>
                  {item.name.substring(0, 1).toUpperCase()}
                </Typography>
              </View>
              <View>
                <Typography variant="h3" style={[dynamicStyles.cardTitle, { color: theme.textPrimary }]}>{item.name.toUpperCase()}</Typography>
                <Typography variant="mono" style={[dynamicStyles.cardMeta, { color: theme.textTertiary }]}>
                  {item.assets?.length || 0}_ASSETS // AUTO_REBAL_ON
                </Typography>
              </View>
            </View>
            <TouchableOpacity style={dynamicStyles.moreBtn}>
              <MoreIcon size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.cardBody}>
            <View style={dynamicStyles.statsCol}>
              <Typography variant="mono" style={[dynamicStyles.statLabel, { color: theme.textTertiary }]}>MARKET_VAL</Typography>
              <Typography variant="h2" style={[dynamicStyles.statValue, { color: theme.textPrimary }]}>
                ${(item.total_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Typography>
              <View style={dynamicStyles.perfRow}>
                <TrendIcon size={12} color={perfColor} />
                <Typography variant="mono" style={[dynamicStyles.perfText, { color: perfColor }]}>
                  {isUp ? '+' : ''}{(Math.random() * 2.5).toFixed(2)}%
                </Typography>
              </View>
            </View>
            <View style={dynamicStyles.chartCol}>
              <Sparkline color={perfColor} />
            </View>
          </View>
          
          <View style={[dynamicStyles.cardFooter, { borderTopColor: theme.border }]}>
            <View style={[dynamicStyles.statusBadge, { backgroundColor: theme.primary + '10' }]}>
              <GlowEffect color={theme.primary} size={4} glowRadius={4} />
              <Typography variant="mono" style={[dynamicStyles.statusText, { color: theme.primary }]}>{STRINGS.ENGINE_IDLE}</Typography>
            </View>
            <Typography variant="mono" style={[dynamicStyles.timestamp, { color: theme.textTertiary }]}>{STRINGS.LAST_SYNC}: 12.4s AGO</Typography>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
      <View style={[dynamicStyles.headerContainer, { backgroundColor: isDark ? 'rgba(5, 6, 11, 0.8)' : 'rgba(255, 255, 255, 0.8)', borderBottomColor: theme.border }]}>
        <View style={dynamicStyles.headerTop}>
          <View>
            <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>{STRINGS.INSTITUTIONAL_VAULT}</Typography>
            <Typography variant="h1" style={[dynamicStyles.title, { color: theme.textPrimary }]}>{STRINGS.PORTFOLIOS}</Typography>
          </View>
          <TouchableOpacity 
            style={[dynamicStyles.fab, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('PortfolioBuilder')}
            activeOpacity={0.8}
          >
            <PlusIcon size={24} color={isDark ? theme.background : '#FFF'} strokeWidth={3} />
            <GlowEffect color={theme.primary} size={40} glowRadius={20} style={dynamicStyles.fabGlow} />
          </TouchableOpacity>
        </View>

        <GlassCard intensity="low" style={dynamicStyles.summaryCard}>
          <View style={dynamicStyles.summaryItem}>
            <LockIcon size={14} color={theme.textSecondary} />
            <View>
              <Typography variant="mono" style={[dynamicStyles.summaryLabel, { color: theme.textTertiary }]}>{STRINGS.TOTAL_CAPITAL}</Typography>
              <Typography variant="h2" style={[dynamicStyles.summaryValue, { color: theme.textPrimary }]}>
                ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Typography>
            </View>
          </View>
          <View style={[dynamicStyles.summaryDivider, { backgroundColor: theme.border }]} />
          <View style={dynamicStyles.summaryItem}>
            <DatabaseIcon size={14} color={theme.textSecondary} />
            <View>
              <Typography variant="mono" style={[dynamicStyles.summaryLabel, { color: theme.textTertiary }]}>{STRINGS.ACTIVE_NODES}</Typography>
              <Typography variant="h2" style={[dynamicStyles.summaryValue, { color: theme.textPrimary }]}>{portfolios.length}</Typography>
            </View>
          </View>
        </GlassCard>
      </View>

      <FlatList
        data={portfolios}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={dynamicStyles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={fetchPortfolios} 
            tintColor={theme.primary} 
          />
        }
        ListEmptyComponent={
          <View style={dynamicStyles.emptyState}>
            <GlassCard style={dynamicStyles.emptyCard}>
              <ActivityIcon size={32} color={theme.textTertiary} style={{ marginBottom: 16 }} />
              <Typography variant="monoBold" style={[dynamicStyles.emptyTitle, { color: theme.textSecondary }]}>{STRINGS.NO_ACTIVE_NODES}</Typography>
              <Typography variant="caption" style={[dynamicStyles.emptyDesc, { color: theme.textTertiary }]}>
                DEEP_STORAGE_INITIATED. NO_PORTFOLIO_CONSTRUCTS_FOUND_IN_VAULT.
              </Typography>
              <TouchableOpacity 
                style={[dynamicStyles.emptyBtn, { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}
                onPress={() => navigation.navigate('PortfolioBuilder')}
              >
                <Typography variant="monoBold" style={[dynamicStyles.emptyBtnText, { color: theme.primary }]}>{STRINGS.INIT_NEW_CONSTRUCT}</Typography>
              </TouchableOpacity>
            </GlassCard>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  subHeader: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    letterSpacing: 2,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fabGlow: {
    position: 'absolute',
    opacity: 0.5,
  },
  summaryCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 20,
    gap: 20,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 8,
    letterSpacing: 1,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
  },
  summaryDivider: {
    width: 1,
  },
  list: {
    padding: 24,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  cardMeta: {
    fontSize: 8,
    marginTop: 2,
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  statsCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    marginBottom: 4,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perfText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chartCol: {
    paddingBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 8,
  },
  emptyState: {
    marginTop: 40,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 32,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 12,
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyBtnText: {
    fontSize: 11,
    letterSpacing: 1,
  },
});
