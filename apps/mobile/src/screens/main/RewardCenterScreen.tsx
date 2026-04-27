import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { GlassCard } from '../../components/ui/GlassCard';
import { useTheme } from '../../context/ThemeContext';
import { Trophy, Star, Target, ChevronLeft, Award, Zap, ShoppingBag, User, Shield } from 'lucide-react-native';
import { useRewardStore, RedeemableItem } from '../../store/rewardStore';
import { useToast } from '../../context/ToastContext';
import { GlowEffect } from '../../components/ui/GlowEffect';

const { width } = Dimensions.get('window');

export function RewardCenterScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const { points, level, achievements, storeItems, fetchRewards, redeemItem } = useRewardStore();
  const [activeTab, setActiveTab] = React.useState<'achievements' | 'store'>('achievements');

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleRedeem = async (item: RedeemableItem) => {
    const success = await redeemItem(item.id);
    if (success) {
      showToast('REDEEMED_SUCCESSFULLY', 'success');
    } else {
      showToast('INSUFFICIENT_FUNDS', 'error');
    }
  };

  const progress = (points % 1000) / 1000;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3" style={{ color: theme.textPrimary }}>REWARD_CENTER</Typography>
        <Trophy size={20} color={theme.warning} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Level & Points Card */}
        <GlassCard intensity="high" style={styles.levelCard}>
          <View style={styles.levelRow}>
            <View>
              <Typography variant="mono" style={{ color: theme.textTertiary, fontSize: 10 }}>CURRENT_TIER</Typography>
              <Typography variant="h2" style={{ color: theme.textPrimary }}>LVL_{level}</Typography>
            </View>
            <View style={styles.pointsBadge}>
              <Star size={14} color={theme.warning} fill={theme.warning} />
              <Typography variant="monoBold" style={{ color: theme.textPrimary, marginLeft: 6 }}>{points} XP</Typography>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
               <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]} />
            </View>
            <Typography variant="mono" style={styles.progressText}>{points % 1000} / 1000 XP TO LVL_{level + 1}</Typography>
          </View>
        </GlassCard>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
           <TouchableOpacity 
             onPress={() => setActiveTab('achievements')}
             style={[styles.tab, activeTab === 'achievements' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
           >
              <Typography variant="mono" style={{ color: activeTab === 'achievements' ? theme.primary : theme.textTertiary }}>ACHIEVEMENTS</Typography>
           </TouchableOpacity>
           <TouchableOpacity 
             onPress={() => setActiveTab('store')}
             style={[styles.tab, activeTab === 'store' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
           >
              <Typography variant="mono" style={{ color: activeTab === 'store' ? theme.primary : theme.textTertiary }}>REDEEM_STORE</Typography>
           </TouchableOpacity>
        </View>

        {activeTab === 'achievements' ? (
          <>
            {/* Daily Challenges */}
            <Typography variant="mono" style={styles.sectionTitle}>DAILY_PROTOCOLS</Typography>
            <GlassCard style={styles.challengeCard}>
               <View style={styles.challengeIcon}>
                  <Zap size={20} color={theme.primary} />
               </View>
               <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold" style={{ color: theme.textPrimary }}>SYNTHESIZE_STRESS_TEST</Typography>
                  <Typography variant="caption" style={{ color: theme.textTertiary }}>Run 1 stress scenario on a live portfolio.</Typography>
               </View>
               <View style={styles.rewardBadge}>
                  <Typography variant="mono" style={{ color: theme.success, fontSize: 10 }}>+50 XP</Typography>
               </View>
            </GlassCard>

            {/* Achievements */}
            <Typography variant="mono" style={styles.sectionTitle}>UNLOCKED_HONORS</Typography>
            <View style={styles.grid}>
              {achievements.map((ach) => (
                <GlassCard key={ach.id} style={[styles.achCard, !ach.unlocked && { opacity: 0.5 }]}>
                  <View style={[styles.achIcon, { backgroundColor: ach.unlocked ? theme.primary + '20' : theme.border }]}>
                    <Award size={24} color={ach.unlocked ? theme.primary : theme.textTertiary} />
                  </View>
                  <Typography variant="monoBold" style={styles.achTitle}>{ach.title}</Typography>
                  <Typography variant="caption" style={styles.achDesc}>{ach.description}</Typography>
                  {ach.unlocked && <GlowEffect color={theme.primary} size={40} glowRadius={10} style={styles.achGlow} />}
                </GlassCard>
              ))}
            </View>
          </>
        ) : (
          <>
            <Typography variant="mono" style={styles.sectionTitle}>PREMIUM_UPGRADES</Typography>
            <View style={styles.grid}>
               {storeItems.map((item) => (
                 <GlassCard key={item.id} style={styles.achCard}>
                    <View style={styles.achIcon}>
                       {item.category === 'persona' && <User size={24} color={theme.primary} />}
                       {item.category === 'utility' && <Zap size={24} color={theme.primary} />}
                       {item.category === 'subscription' && <Shield size={24} color={theme.primary} />}
                    </View>
                    <Typography variant="monoBold" style={styles.achTitle}>{item.title}</Typography>
                    <Typography variant="caption" style={styles.achDesc}>{item.description}</Typography>
                    
                    <TouchableOpacity 
                      onPress={() => handleRedeem(item)}
                      style={[styles.redeemBtn, { backgroundColor: points >= item.cost ? theme.primary : theme.border }]}
                    >
                       <Typography variant="monoBold" style={{ color: points >= item.cost ? theme.background : theme.textTertiary, fontSize: 10 }}>
                         {item.cost} XP
                       </Typography>
                    </TouchableOpacity>
                 </GlassCard>
               ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backBtn: { padding: 8 },
  scroll: { padding: 20 },
  levelCard: { padding: 24, borderRadius: 28, marginBottom: 32 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  progressContainer: { marginTop: 10 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%' },
  progressText: { fontSize: 8, color: '#848D97', textAlign: 'right' },
  sectionTitle: { fontSize: 10, letterSpacing: 2, color: '#848D97', marginBottom: 16, marginTop: 10 },
  challengeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, gap: 16 },
  challengeIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0, 217, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  rewardBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(0, 255, 157, 0.1)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  achCard: { width: (width - 52) / 2, padding: 16, borderRadius: 24, alignItems: 'center', minHeight: 160 },
  achIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  achTitle: { fontSize: 10, color: '#FFFFFF', textAlign: 'center', marginBottom: 4 },
  achDesc: { fontSize: 9, color: '#848D97', textAlign: 'center' },
  achGlow: { position: 'absolute', top: 10, zIndex: -1 },
  tabContainer: { flexDirection: 'row', marginBottom: 24, gap: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  tab: { paddingVertical: 12 },
  redeemBtn: { marginTop: 16, width: '100%', height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }
});
