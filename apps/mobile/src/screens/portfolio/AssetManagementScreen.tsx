import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { useAssetStore } from '../../store/assetStore';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Search, Plus, X, ChevronLeft, Cpu, Activity, Zap, Layers, Target, TrendingUp, BarChart3, ShieldAlert, Lock } from 'lucide-react-native';
import { TIER_ENTITLEMENTS, SubscriptionTier } from '@quantmind/shared-types';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { sharedTheme } from '../../constants/theme';
import { STRINGS } from '../../constants/strings';
// Removed TickerTape

const { width } = Dimensions.get('window');

export function AssetManagementScreen({ navigation }: any) {
  const { tier } = useAuthStore();
  const { watchlist, fetchWatchlist, addToWatchlist, removeFromWatchlist, isLoading: isStoreLoading } = useAssetStore();
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [watchlistDetails, setWatchlistDetails] = useState<any[]>([]);

  const SearchIcon = Search as any;
  const PlusIcon = Plus as any;
  const XIcon = X as any;
  const PrevIcon = ChevronLeft as any; // Changed from BackIcon to PrevIcon
  const CpuIcon = Cpu as any;
  const ActivityIcon = Activity as any;
  const ZapIcon = Zap as any;
  const LayersIcon = Layers as any;
  const TargetIcon = Target as any;
  const TrendIcon = TrendingUp as any;
  const ChartIcon = BarChart3 as any;
  const LockIcon = Lock as any; // Changed from ShieldIcon to LockIcon

  const entitlements = TIER_ENTITLEMENTS[tier as SubscriptionTier] || TIER_ENTITLEMENTS.free;
  const dynamicStyles = getStyles(theme, isDark);

  useEffect(() => {
    if (entitlements.allow_asset_management) {
      fetchWatchlist();
    }
  }, []);

  useEffect(() => {
    const loadDetails = async () => {
      if (watchlist.length > 0) {
        const details = await Promise.all(watchlist.map(async (ticker) => {
          try {
            const data = await api.getAssetHistory(ticker);
            return { ticker, ...data };
          } catch (e) {
            return { ticker, error: true };
          }
        }));
        setWatchlistDetails(details);
      } else {
        setWatchlistDetails([]);
      }
    };
    loadDetails();
  }, [watchlist]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const results = await api.searchAssets(searchQuery);
      setSearchResults(results);
    } catch (e: any) {
      showToast(e.message.toUpperCase(), 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const addAsset = async (asset: any) => {
    await addToWatchlist(asset.ticker);
    showToast(`ASSET_ADDED: ${asset.ticker}`, 'success');
    setSearchResults([]);
    setSearchQuery('');
  };

  if (!entitlements.allow_asset_management) {
    return (
      <View style={[dynamicStyles.container, { backgroundColor: theme.background }]}>
        <View style={dynamicStyles.lockedContainer}>
          <GlassCard intensity="high" style={dynamicStyles.lockedCard}>
            <LockIcon size={48} color={theme.primary} style={{ marginBottom: 20 }} />
            <Typography variant="h2" style={[dynamicStyles.lockedTitle, { color: theme.textPrimary }]}>{STRINGS.ACCESS_DENIED}</Typography>
            <Typography variant="body" style={[dynamicStyles.lockedDesc, { color: theme.textSecondary }]}>
              ADVANCED_ASSET_DISCOVERY_MODULE IS RESTRICTED TO PREMIUM NODES. 
              UPGRADE YOUR ACCESS LEVEL TO INITIALIZE REAL-TIME ASSET MONITORING.
            </Typography>
            <TouchableOpacity 
              style={[dynamicStyles.upgradeBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('Profile', { screen: 'SubscriptionManagement' })}
            >
              <Typography variant="monoBold" style={[dynamicStyles.upgradeBtnText, { color: theme.background }]}>{STRINGS.UPGRADE_ACCOUNT}</Typography>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[dynamicStyles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={dynamicStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[dynamicStyles.backBtn, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
            <PrevIcon size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View>
            <Typography variant="mono" style={[dynamicStyles.subHeader, { color: theme.textTertiary }]}>{STRINGS.STATION}_V2.0</Typography>
            <Typography variant="h1" style={[dynamicStyles.title, { color: theme.textPrimary }]}>{STRINGS.ASSET_MGMT}</Typography>
          </View>
        </View>

        {/* Search Bar */}
        <View style={dynamicStyles.searchSection}>
          <Typography variant="mono" style={[dynamicStyles.sectionLabel, { color: theme.textTertiary }]}>{STRINGS.ASSET_DISCOVERY}</Typography>
          <View style={[dynamicStyles.searchBar, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
            <SearchIcon size={18} color={theme.textTertiary} style={dynamicStyles.searchIcon} />
            <TextInput
              style={[dynamicStyles.searchInput, { color: theme.textPrimary }]}
              placeholder={STRINGS.ASSET_DISCOVERY}
              placeholderTextColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
              onSubmitEditing={handleSearch}
            />
            {isSearching && <GlowEffect color={theme.primary} size={4} glowRadius={8} />}
          </View>
        </View>

        {searchResults.length > 0 && (
          <GlassCard style={dynamicStyles.searchResults}>
            {searchResults.map((res: any, idx) => (
              <TouchableOpacity key={`${res.ticker}-${idx}`} style={[dynamicStyles.resultItem, { borderBottomColor: theme.border }]} onPress={() => addAsset(res)}>
                <View style={dynamicStyles.resultInfo}>
                  <View style={[dynamicStyles.resultTickerBox, { backgroundColor: theme.primary + '10' }]}>
                    <Typography variant="monoBold" style={[dynamicStyles.resultTicker, { color: theme.primary }]}>{res.ticker}</Typography>
                  </View>
                  <Typography variant="caption" numberOfLines={1} style={[dynamicStyles.resultName, { color: theme.textTertiary }]}>{res.name.toUpperCase()}</Typography>
                </View>
                <PlusIcon size={18} color={theme.primary} />
              </TouchableOpacity>
            ))}
          </GlassCard>
        )}

        {/* Global Stats */}
        <View style={dynamicStyles.statsGrid}>
          <GlassCard style={dynamicStyles.statCard}>
            <Typography variant="mono" style={[dynamicStyles.statLabel, { color: theme.textTertiary }]}>WATCHLIST_SIZE</Typography>
            <Typography variant="h2" style={[dynamicStyles.statValue, { color: theme.textPrimary }]}>{watchlist.length}</Typography>
          </GlassCard>
 
          <GlassCard style={dynamicStyles.statCard}>
            <Typography variant="mono" style={[dynamicStyles.statLabel, { color: theme.textTertiary }]}>MARKET_STATUS</Typography>
            <View style={dynamicStyles.statusBadge}>
              <View style={[dynamicStyles.statusDot, { backgroundColor: theme.primary }]} />
              <Typography variant="mono" style={[dynamicStyles.statusText, { color: theme.primary }]}>SYNCED</Typography>
            </View>
          </GlassCard>
        </View>

        {/* Watchlist Section */}
        <View style={dynamicStyles.watchlistSection}>
          <View style={dynamicStyles.sectionHeader}>
            <TargetIcon size={14} color={theme.textTertiary} />
            <Typography variant="h3" style={[dynamicStyles.sectionTitle, { color: theme.textSecondary }]}>MONITORED_ASSETS</Typography>
          </View>
          
          {watchlistDetails.length === 0 ? (
            <GlassCard intensity="low" style={dynamicStyles.emptyWatchlist}>
              <ActivityIcon size={24} color={theme.textTertiary} style={{ marginBottom: 16 }} />
              <Typography variant="mono" style={[dynamicStyles.emptyText, { color: theme.textSecondary }]}>NO_ASSETS_IN_WATCHLIST</Typography>
              <Typography variant="caption" style={[dynamicStyles.emptySubtext, { color: theme.textTertiary }]}>Use the lookup station to add holdings.</Typography>
            </GlassCard>
          ) : (
            watchlistDetails.map((asset) => (
              <GlassCard key={asset.ticker} style={dynamicStyles.assetCard}>
                <View style={dynamicStyles.assetHeader}>
                   <View style={dynamicStyles.assetMeta}>
                     <View style={[dynamicStyles.assetTickerBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
                       <Typography variant="monoBold" style={[dynamicStyles.assetTicker, { color: theme.textPrimary }]}>{asset.ticker}</Typography>
                     </View>
                     <View>
                        <Typography variant="mono" style={[dynamicStyles.assetReturn, { color: theme.primary }]}>μ: {((asset.expectedReturn || 0) * 100).toFixed(2)}%</Typography>
                        <Typography variant="mono" style={[dynamicStyles.assetRisk, { color: theme.textTertiary }]}>σ: {((asset.volatility || 0) * 100).toFixed(2)}%</Typography>
                     </View>
                   </View>
                   <TouchableOpacity 
                     onPress={() => {
                       removeFromWatchlist(asset.ticker);
                       showToast(`ASSET_DEPROVISIONED: ${asset.ticker}`, 'info');
                     }} 
                     style={[dynamicStyles.removeBtn, { backgroundColor: theme.error + '05' }]}
                   >
                     <XIcon size={14} color={theme.error} />
                   </TouchableOpacity>
                </View>
                
                <View style={[dynamicStyles.assetFooter, { borderTopColor: theme.border }]}>
                  <View style={dynamicStyles.dataTag}>
                    <ChartIcon size={10} color={theme.primary} />
                    <Typography variant="mono" style={[dynamicStyles.tagText, { color: theme.primary }]}>LIVE_DATA</Typography>
                  </View>
                  <Typography variant="mono" style={[dynamicStyles.priceText, { color: theme.textPrimary }]}>$1,242.03 <TrendIcon size={10} color={theme.primary} /></Typography>
                </View>
              </GlassCard>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <LoadingOverlay visible={isStoreLoading} message="SYNCING_STATION..." />
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
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
  searchSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 9,
    marginBottom: 12,
    marginLeft: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 54,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: sharedTheme.typography.fonts.mono,
    fontSize: 12,
  },
  searchResults: {
    marginTop: -16,
    marginBottom: 24,
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  resultTickerBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resultTicker: {
    fontSize: 12,
  },
  resultName: {
    fontSize: 10,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    gap: 8,
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
  },
  watchlistSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
  },
  assetCard: {
    padding: 16,
    borderRadius: 20,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  assetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  assetTickerBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  assetTicker: {
    fontSize: 14,
  },
  assetReturn: {
    fontSize: 10,
    marginBottom: 2,
  },
  assetRisk: {
    fontSize: 10,
  },
  removeBtn: {
    padding: 8,
    borderRadius: 10,
  },
  assetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  dataTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontSize: 8,
  },
  priceText: {
    fontSize: 12,
  },
  emptyWatchlist: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 9,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lockedCard: {
    width: '100%',
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
  },
  lockedTitle: {
    fontSize: 24,
    letterSpacing: 4,
    marginTop: 20,
    marginBottom: 16,
  },
  lockedDesc: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  upgradeBtn: {
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeBtnText: {
    fontSize: 12,
    letterSpacing: 1.5,
  },
});
