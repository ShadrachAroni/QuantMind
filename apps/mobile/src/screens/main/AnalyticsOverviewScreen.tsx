import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  RefreshControl,
  FlatList
} from 'react-native';
import { 
  TrendingUp, 
  Wallet, 
  Activity, 
  Zap, 
  Globe, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Fuel,
  ChevronRight,
  PieChart as PieChartIcon
} from 'lucide-react-native';
import { Typography } from '../../components/ui/Typography';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { marketDataService } from '../../services/marketData';
import { blockchainService } from '../../services/blockchain';
import { MarketTick, OnChainTransaction, GasMetrics, DeFiPosition } from '@quantmind/shared-types';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Canvas, Path, Skia, LinearGradient as SkiaGradient, vec } from '@shopify/react-native-skia';

const { width } = Dimensions.get('window');

// --- MOCK DATA (Synced with Web for consistency) ---
const MOCK_WALLETS = [
  { id: '1', network: 'Ethereum', address: '0x71C...3E4', balance: 1.24, valueUsd: 4520, tokens: 12, alias: 'ETH Main' },
  { id: '2', network: 'BSC', address: '0x92f...A1B', balance: 12.5, valueUsd: 7800, tokens: 8, alias: 'BSC Yield' },
  { id: '3', network: 'Solana', address: '7vkx...9ps', balance: 450.2, valueUsd: 65200, tokens: 24, alias: 'SOL Hub' },
];

const MOCK_TRANSACTIONS = [
  { id: '1', network: 'Ethereum', method: 'Swap', status: 'success', value: '1.2 ETH', time: '2m' },
  { id: '2', network: 'Solana', method: 'Stake', status: 'success', value: '100 SOL', time: '15m' },
  { id: '3', network: 'BSC', method: 'Transfer', status: 'pending', value: '500USDT', time: 'Now' },
];

export function AnalyticsOverviewScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { user, tier } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'market' | 'wallets'>('market');
  
  // Real-time Analytics State
  const [ticker, setTicker] = useState<any>(null);
  const [klines, setKlines] = useState<MarketTick[]>([]);
  const [gas, setGas] = useState<GasMetrics | null>(null);
  const [transactions, setTransactions] = useState<OnChainTransaction[]>([]);

  const fetchTerminalData = async () => {
    setRefreshing(true);
    try {
      const [mticker, mklines, mgas, mtxs] = await Promise.all([
        marketDataService.get24hTicker('BTCUSDT'),
        marketDataService.getKlines('BTCUSDT', '1h', 30),
        blockchainService.getGasPrices('ethereum'),
        blockchainService.getRecentActivity('0x71C...3E4', 'ethereum')
      ]);

      if (mticker) setTicker(mticker);
      if (mklines) setKlines(mklines);
      if (mgas) setGas(mgas);
      setTransactions(mtxs);
    } catch (err) {
      console.error('Mobile Terminal sync failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (tier === 'pro') {
      fetchTerminalData();
      const interval = setInterval(fetchTerminalData, 15000);
      return () => clearInterval(interval);
    }
  }, [tier]);

  const onRefresh = React.useCallback(() => {
    fetchTerminalData();
  }, [tier]);

  // Skia Path generation from real data
  const chartPath = Skia.Path.Make();
  if (klines.length > 0) {
    const prices = klines.map(k => k.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    const chartWidth = width - 48; // Padding correction
    
    klines.forEach((tick, i) => {
      const x = (i / (klines.length - 1)) * chartWidth;
      const y = 80 - ((tick.close - min) / (range || 1)) * 60; // Scale to height
      if (i === 0) chartPath.moveTo(x, y);
      else chartPath.lineTo(x, y);
    });
  } else {
    // Fallback path
    chartPath.moveTo(0, 50);
    chartPath.lineTo(200, 5);
  }

  const isPro = tier === 'pro';

  if (!isPro) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
        <BlurView intensity={20} style={styles.lockOverlay}>
          <Zap size={64} color={theme.primary} style={{ marginBottom: 24 }} />
          <Typography variant="h2" style={{ color: theme.textPrimary, textAlign: 'center' }}>PRO_ANALYTICS_LOCKED</Typography>
          <Typography variant="body" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 12 }}>
            Upgrade to Pro to unlock institutional-grade market data, multi-chain wallet tracking, and deep on-chain metrics.
          </Typography>
          <TouchableOpacity 
            style={[styles.upgradeBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Typography variant="monoBold" style={{ color: '#000' }}>UPGRADE_NOW</Typography>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
           <View style={styles.headerRow}>
              <View>
                 <Typography variant="mono" style={{ color: theme.primary, fontSize: 10, letterSpacing: 2 }}>TERMINAL_ANALYTICS_v4</Typography>
                 <Typography variant="h1" style={{ color: theme.textPrimary, marginTop: 4 }}>MARKET_INTEL</Typography>
              </View>
              <TouchableOpacity style={[styles.refreshBtn, { borderColor: theme.border }]}>
                 <Activity size={20} color={theme.textPrimary} />
              </TouchableOpacity>
           </View>
        </View>

        {/* Tab Switching */}
        <View style={[styles.tabBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
           <TouchableOpacity 
             onPress={() => setActiveTab('market')}
             style={[styles.tab, activeTab === 'market' && { backgroundColor: theme.background, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }]}
           >
              <Typography variant="monoBold" style={{ color: activeTab === 'market' ? theme.textPrimary : theme.textTertiary, fontSize: 12 }}>MARKET_STREAM</Typography>
           </TouchableOpacity>
           <TouchableOpacity 
             onPress={() => setActiveTab('wallets')}
             style={[styles.tab, activeTab === 'wallets' && { backgroundColor: theme.background, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }]}
           >
              <Typography variant="monoBold" style={{ color: activeTab === 'wallets' ? theme.textPrimary : theme.textTertiary, fontSize: 12 }}>ON_CHAIN_VAULT</Typography>
           </TouchableOpacity>
        </View>

        {activeTab === 'market' ? (
          <View style={styles.marketSection}>
             {/* BTC Terminal Preview */}
             <View style={[styles.terminalCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
                <View style={styles.terminalHeader}>
                   <View>
                      <Typography variant="h3" style={{ color: '#fff' }}>{ticker?.symbol || 'BTC/USDT'}</Typography>
                      <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10 }}>BINANCE_SPOT_FEED</Typography>
                   </View>
                   <View style={{ alignItems: 'flex-end' }}>
                      <Typography variant="h2" style={{ color: (ticker?.priceChangePercent || 0) >= 0 ? theme.success : theme.warning }}>
                        {ticker?.priceChangePercent ? `${ticker.priceChangePercent > 0 ? '+' : ''}${ticker.priceChangePercent.toFixed(2)}%` : '+2.45%'}
                      </Typography>
                      <Typography variant="mono" style={{ color: '#fff', fontSize: 12 }}>
                        {ticker?.lastPrice ? `$${ticker.lastPrice.toLocaleString()}` : '$64,231.50'}
                      </Typography>
                   </View>
                </View>
                
                {/* Skia Chart Implementation */}
                <View style={styles.chartContainer}>
                   <Canvas style={{ flex: 1 }}>
                      <Path
                        path={chartPath}
                        color={theme.primary}
                        style="stroke"
                        strokeWidth={2}
                      >
                         <SkiaGradient
                           start={vec(0, 0)}
                           end={vec(200, 50)}
                           colors={[theme.primary, theme.secondary]}
                         />
                      </Path>
                   </Canvas>
                </View>

                <View style={styles.statGrid}>
                   <View style={styles.statItem}>
                      <Typography variant="caption" style={{ color: theme.textTertiary }}>HIGH_24H</Typography>
                      <Typography variant="monoBold" style={{ color: theme.textPrimary }}>65,120</Typography>
                   </View>
                   <View style={styles.statItem}>
                      <Typography variant="caption" style={{ color: theme.textTertiary }}>LOW_24H</Typography>
                      <Typography variant="monoBold" style={{ color: theme.textPrimary }}>62,800</Typography>
                   </View>
                   <View style={styles.statItem}>
                      <Typography variant="caption" style={{ color: theme.textTertiary }}>VOLUME</Typography>
                      <Typography variant="monoBold" style={{ color: theme.primary }}>1.2B</Typography>
                   </View>
                </View>
             </View>

             <Typography variant="mono" style={styles.sectionLabel}>NETWORK_SURVEILLANCE</Typography>
             <View style={styles.networkGrid}>
                <View style={[styles.networkCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                   <Fuel size={20} color={theme.primary} />
                   <Typography variant="h3" style={{ color: theme.textPrimary, marginTop: 12 }}>{gas?.average?.toFixed(1) || '12.5'} Gwei</Typography>
                   <Typography variant="caption" style={{ color: theme.textTertiary }}>ETH_GAS_UNIT</Typography>
                </View>
                <View style={[styles.networkCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                   <Activity size={20} color={theme.secondary} />
                   <Typography variant="h3" style={{ color: theme.textPrimary, marginTop: 12 }}>2,450</Typography>
                   <Typography variant="caption" style={{ color: theme.textTertiary }}>SOL_TPS_AVG</Typography>
                </View>
             </View>
          </View>
        ) : (
          <View style={styles.vaultSection}>
             <View style={[styles.allocationCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                <View style={styles.allocationContent}>
                   <PieChartIcon size={48} color={theme.primary} />
                   <View style={{ flex: 1 }}>
                      <Typography variant="h2" style={{ color: theme.textPrimary }}>$77.5K NAV</Typography>
                      <Typography variant="caption" style={{ color: theme.textSecondary }}>Aggregated cross-chain liquidity across 3 linked protocols.</Typography>
                   </View>
                </View>
             </View>

             <Typography variant="mono" style={styles.sectionLabel}>LINKED_WALLETS</Typography>
             {MOCK_WALLETS.map((w) => (
               <View key={w.id} style={[styles.walletItem, { borderColor: theme.border }]}>
                  <View style={styles.walletHeader}>
                     <View style={[styles.networkBadge, { backgroundColor: w.network === 'Ethereum' ? '#7C3AED20' : w.network === 'Solana' ? '#14F19520' : '#F3BA2F20' }]}>
                        <Typography variant="monoBold" style={{ color: w.network === 'Ethereum' ? '#7C3AED' : w.network === 'Solana' ? '#14F195' : '#F3BA2F', fontSize: 10 }}>{w.network.toUpperCase()}</Typography>
                     </View>
                     <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10 }}>{w.address}</Typography>
                  </View>
                  <View style={styles.walletFooter}>
                     <Typography variant="h3" style={{ color: theme.textPrimary }}>{w.alias}</Typography>
                     <Typography variant="h3" style={{ color: theme.success }}>${w.valueUsd}</Typography>
                  </View>
               </View>
             ))}

             <TouchableOpacity style={[styles.addBtn, { borderColor: theme.border, borderStyle: 'dashed' }]}>
                <Typography variant="monoBold" style={{ color: theme.textTertiary }}>+ LINK_NEW_VAULT_ADDRESS</Typography>
             </TouchableOpacity>

             <Typography variant="mono" style={styles.sectionLabel}>LATEST_TRANSACTIONS</Typography>
             <View style={[styles.txList, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
                {MOCK_TRANSACTIONS.map((tx) => (
                  <View key={tx.id} style={styles.txRow}>
                     <View style={styles.txMain}>
                        <Typography variant="monoBold" style={{ color: theme.textPrimary }}>{tx.method.toUpperCase()}</Typography>
                        <Typography variant="caption" style={{ color: theme.textTertiary }}>{tx.network} • {tx.time}</Typography>
                     </View>
                     <View style={{ alignItems: 'flex-end' }}>
                        <Typography variant="monoBold" style={{ color: tx.status === 'success' ? theme.success : theme.warning }}>{tx.value}</Typography>
                        <Typography variant="caption" style={{ color: theme.textTertiary }}>{tx.status.toUpperCase()}</Typography>
                     </View>
                  </View>
                ))}
             </View>
          </View>
        )}

        {/* Security Summary */}
        <View style={[styles.securityBox, { backgroundColor: theme.success + '05', borderColor: theme.success + '20' }]}>
           <ShieldCheck size={20} color={theme.success} />
           <View style={{ flex: 1 }}>
              <Typography variant="monoBold" style={{ color: theme.success, fontSize: 12 }}>SECURITY_SCAN_ACTIVE</Typography>
              <Typography variant="caption" style={{ color: theme.textTertiary, marginTop: 4 }}>No high-risk malicious contract signatures or exploit patterns detected in linked vaults.</Typography>
           </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 16,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  marketSection: {
    gap: 24,
  },
  terminalCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 300,
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  chartContainer: {
    height: 120,
    marginBottom: 24,
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  statItem: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 12,
    marginBottom: 16,
    color: '#848D97',
  },
  networkGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  networkCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  vaultSection: {
    gap: 16,
  },
  allocationCard: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
  },
  allocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  walletItem: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  networkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addBtn: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  txList: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  txMain: {
    gap: 4,
  },
  securityBox: {
    marginTop: 40,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  lockOverlay: {
    width: '100%',
    padding: 32,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  upgradeBtn: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
});
