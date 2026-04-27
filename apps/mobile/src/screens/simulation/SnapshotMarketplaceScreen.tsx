import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { GlassCard } from '../../components/ui/GlassCard';
import { useTheme } from '../../context/ThemeContext';
import { ShoppingCart, Tag, User, ChevronLeft, Search, Filter, TrendingUp, Zap } from 'lucide-react-native';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useRewardStore } from '../../store/rewardStore';

const { width } = Dimensions.get('window');

export function SnapshotMarketplaceScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { points, fetchRewards } = useRewardStore();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    try {
      const data = await api.fetchMarketplace();
      setListings(data || []);
    } catch (e) {
      showToast('LOAD_ERROR', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (listing: any) => {
    if (points < listing.price_xp) {
      showToast('INSUFFICIENT_XP', 'error');
      return;
    }

    try {
      await api.buySnapshot(listing.id, listing.price_xp);
      showToast('ACQUIRED_SUCCESSFULLY', 'success');
      fetchRewards(); // Update points
    } catch (e) {
      showToast('PURCHASE_FAILED', 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3" style={{ color: theme.textPrimary }}>SCENARIO_MARKET</Typography>
        <View style={styles.xpBadge}>
           <Zap size={12} color={theme.warning} fill={theme.warning} />
           <Typography variant="monoBold" style={{ color: theme.textPrimary, marginLeft: 6, fontSize: 12 }}>{points}</Typography>
        </View>
      </View>

      <View style={styles.searchBar}>
         <Search size={18} color={theme.textTertiary} />
         <Typography variant="body" style={{ color: theme.textTertiary, marginLeft: 12 }}>Search scenarios...</Typography>
         <TouchableOpacity style={styles.filterBtn}>
            <Filter size={18} color={theme.primary} />
         </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
           <Typography variant="mono" style={styles.sectionTitle}>TRENDING_DIALECTICS</Typography>
           
           <FlatList 
             data={listings}
             keyExtractor={(item) => item.id}
             renderItem={({ item }) => (
               <GlassCard style={styles.listingCard}>
                  <View style={styles.cardHeader}>
                     <View style={styles.avatar}>
                        <User size={16} color={theme.primary} />
                     </View>
                     <View style={{ flex: 1, marginLeft: 12 }}>
                        <Typography variant="bodyBold" style={{ color: theme.textPrimary }}>{item.snapshot.title}</Typography>
                        <Typography variant="caption" style={{ color: theme.textTertiary }}>By User_{item.seller_id.substring(0, 5)}</Typography>
                     </View>
                     <View style={styles.priceTag}>
                        <Typography variant="monoBold" style={{ color: theme.success, fontSize: 12 }}>{item.price_xp} XP</Typography>
                     </View>
                  </View>

                  <Typography variant="caption" style={styles.description} numberOfLines={2}>
                    Scenario context: "{item.snapshot.seed_context}"
                  </Typography>

                  <View style={styles.statsRow}>
                     <View style={styles.stat}>
                        <TrendingUp size={12} color={theme.secondary} />
                        <Typography variant="mono" style={styles.statText}>SHOCK: {item.snapshot.sentiment_shock.toFixed(2)}</Typography>
                     </View>
                     <TouchableOpacity 
                       onPress={() => handlePurchase(item)}
                       style={[styles.buyBtn, { backgroundColor: theme.primary }]}
                     >
                        <ShoppingCart size={14} color={theme.background} />
                        <Typography variant="monoBold" style={{ color: theme.background, marginLeft: 8, fontSize: 10 }}>ACQUIRE</Typography>
                     </TouchableOpacity>
                  </View>
               </GlassCard>
             )}
             showsVerticalScrollIndicator={false}
           />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backBtn: { padding: 8 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 12, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.2)', marginBottom: 20 },
  filterBtn: { marginLeft: 'auto' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 100 },
  sectionTitle: { fontSize: 10, letterSpacing: 2, color: '#848D97', marginHorizontal: 20, marginBottom: 16 },
  listingCard: { marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 24 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0, 217, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  priceTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(0, 255, 157, 0.1)' },
  description: { color: '#848D97', marginBottom: 16, lineHeight: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stat: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 10, color: '#848D97', marginLeft: 6 },
  buyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }
});
