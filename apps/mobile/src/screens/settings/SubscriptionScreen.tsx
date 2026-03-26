import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Typography } from '../../components/ui/Typography';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { sharedTheme } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { STRINGS } from '../../constants/strings';
import { 
  ChevronLeft,
  ShieldCheck,
  Zap,
  GraduationCap,
  CheckCircle2,
  Lock,
  ArrowRight,
  CreditCard,
  Building2,
  Crown
} from 'lucide-react-native';
import { BillingAddressModal, BillingAddress } from '../../components/ui/BillingAddressModal';
import { Linking } from 'react-native';
// Removed PromotionTicker

const { width } = Dimensions.get('window');

export function SubscriptionScreen({ navigation }: any) {
  const { tier, isStudentVerified, subscriptionPlans } = useAuthStore();
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billingVisible, setBillingVisible] = useState(false);

  const handlePlanSelection = (plan: any) => {
    setSelectedPlan(plan);
    setBillingVisible(true);
  };

  const onBillingSubmit = async (address: BillingAddress) => {
    setBillingVisible(false);
    setIsVerifying(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('AUTH_SESSION_EXPIRED');

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('paystack-checkout', {
        body: {
          planCode: selectedPlan.id === 'plus' ? process.env.EXPO_PUBLIC_PAYSTACK_PLAN_PLUS : selectedPlan.id === 'student' ? process.env.EXPO_PUBLIC_PAYSTACK_PLAN_STUDENT : process.env.EXPO_PUBLIC_PAYSTACK_PLAN_PRO
        },
        method: 'POST'
      });

      if (error) throw error;
      if (data.url) {
        showToast('REDIRECTING_TO_SECURE_PAYSTACK...', 'success');
        const canOpen = await Linking.canOpenURL(data.url);
        if (canOpen) {
          await Linking.openURL(data.url);
        }
      }
    } catch (err: any) {
      showToast(err.message || STRINGS.GATEWAY_ERROR, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const BackIcon = ChevronLeft as any;
  const StudentIcon = GraduationCap as any;
  const CheckIcon = CheckCircle2 as any;
  const LockIcon = Lock as any;
  const ArrowIcon = ArrowRight as any;
  const ZapIcon = Zap as any;
  const CrownIcon = Crown as any;

  const handleVerifyStudent = async () => {
    setIsVerifying(true);
    
    // Generic Verification Bridge (Mock)
    // In production, this would open a SheerID/UNiDAYS WebView
    setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('AUTH_SESSION_EXPIRED');

        const { error } = await supabase
          .from('user_profiles')
          .update({ 
            is_student_verified: true,
            student_verified_at: new Date().toISOString(),
            student_verification_id: 'BRG_' + Math.random().toString(36).substring(7).toUpperCase()
          })
          .eq('id', user.id);

        if (error) throw error;

        showToast('VERIFICATION_SUCCESS: Student tier unlocked.', 'success');
        setTimeout(() => navigation.goBack(), 2000);
      } catch (err: any) {
        showToast(err.message || 'Bridge connection interrupted.', 'error');
      } finally {
        setIsVerifying(false);
      }
    }, 2500);
  };

  const PlanCard = ({ name, id, price, multiplier, features, color, active, locked, comingSoon, onAction }: any) => {
    const isPro = id === 'pro';
    const isStudent = id === 'student';
    
    return (
      <View style={{ marginBottom: 24 }}>
        {isPro && (
          <GlowEffect 
            color="#A855F7" 
            size={width * 0.8} 
            glowRadius={50} 
            opacity={0.15} 
            style={{ position: 'absolute', top: 40, alignSelf: 'center' }} 
          />
        )}
        
        <GlassCard 
          intensity={isPro ? 'high' : 'medium'}
          style={[
            styles.planCard, 
            active && { borderColor: color, borderWidth: 2 }, 
            comingSoon && { opacity: 0.6 },
            isPro && { shadowColor: color, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 }
          ]}
        >
          {isPro && (
            <View style={styles.proGradientStrip} />
          )}
          
          <View style={styles.planHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Typography variant="monoBold" style={[styles.planName, { color: active ? color : isPro ? '#C084FC' : theme.textPrimary }]}>
                  {name.toUpperCase()}
                </Typography>
                {multiplier && (
                  <View style={[styles.multiplierBadge, { backgroundColor: color + '22' }]}>
                    <ZapIcon size={8} color={color} />
                    <Typography variant="mono" style={{ color: color, fontSize: 8 }}>{multiplier}</Typography>
                  </View>
                )}
                {comingSoon && (
                  <View style={[styles.comingSoonBadge, { backgroundColor: '#F59E0B22', borderColor: '#F59E0B44' }]}>
                    <Typography variant="mono" style={{ color: '#F59E0B', fontSize: 8 }}>COMING_SOON</Typography>
                  </View>
                )}
                {isPro && (
                  <View style={styles.vipBadge}>
                    <Typography variant="monoBold" style={styles.vipBadgeText}>VIP</Typography>
                  </View>
                )}
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                <Typography variant="h1" style={{ color: isPro ? '#FFFFFF' : theme.textPrimary, fontSize: 32 }}>${price}</Typography>
                <Typography variant="caption" style={{ color: isPro ? '#E9D5FF' : theme.textTertiary, marginLeft: 4 }}>/mo</Typography>
              </View>
            </View>
            
            <View style={[
              styles.iconContainer, 
              { backgroundColor: isPro ? '#A855F722' : color + '11' }
            ]}>
              {isPro ? (
                <CrownIcon size={24} color="#C084FC" />
              ) : isStudent ? (
                <StudentIcon size={24} color="#10B981" />
              ) : (
                <ZapIcon size={24} color={color} />
              )}
            </View>
          </View>

          <View style={styles.featuresList}>
            {features.map((f: string, i: number) => (
              <View key={i} style={styles.featureItem}>
                <View style={[styles.checkCircle, { backgroundColor: isPro ? '#A855F733' : color + '15' }]}>
                  <CheckIcon size={10} color={isPro ? '#C084FC' : color} />
                </View>
                <Typography variant="caption" style={{ color: isPro ? '#E9D5FF' : theme.textSecondary, flex: 1 }}>{f}</Typography>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            activeOpacity={0.8}
            style={[
              styles.actionBtn, 
              { backgroundColor: locked ? theme.textTertiary + '22' : isPro ? '#A855F7' : color }
            ]} 
            onPress={onAction}
            disabled={active || locked}
          >
            <Typography variant="monoBold" style={[styles.actionBtnText, { color: locked ? theme.textTertiary : '#FFFFFF' }]}>
              {active ? STRINGS.CURRENT_LEVEL : locked ? 'LOCKED_VERIF_REQ' : isPro ? 'UNLOCK VIP ACCESS' : STRINGS.UPGRADE_NOW}
            </Typography>
            {!active && !locked && <ArrowIcon size={14} color="#FFFFFF" style={{ marginLeft: 8 }} />}
            {isPro && !active && <CrownIcon size={14} color="#FFFFFF" style={{ marginLeft: 8, opacity: 0.8 }} />}
          </TouchableOpacity>
        </GlassCard>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
            <BackIcon size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <Typography variant="mono" style={[styles.subHeader, { color: theme.textTertiary }]}>{STRINGS.CLEARANCE_PROTOCOL}</Typography>
          <Typography variant="h1" style={[styles.title, { color: theme.textPrimary }]}>SUBSCRIPTIONS</Typography>
        </View>

        {/* Removed PromotionTicker */}

        {subscriptionPlans.map((plan: any) => {
          const color = plan.id === 'plus' ? theme.secondary : plan.id === 'pro' ? theme.primary : '#8B5CF6';
          const usdPrice = plan.id === 'plus' ? '9.99' : plan.id === 'pro' ? '24.99' : '199';
          const featMap: Record<string, string[]> = {
            plus: ['10k Simulation Paths', 'Unlimited Portfolios', 'Diversification Score', 'Basic AI Models'],
            pro: ['100k Simulation Paths', 'Fat-Tail (Levy) Engines', 'Claude 3 Opus Oracle', 'Custom Scenarios'],
            institution: ['Infinite Batch Compute', 'Dedicated H100 GPU Nodes', 'Direct Exchange Proxy', 'Raw API Data Stream']
          };

          return (
            <PlanCard 
              key={plan.id}
              id={plan.id}
              name={plan.id} 
              price={usdPrice} 
              multiplier={plan.multiplier}
              color={color}
              active={tier === plan.id}
              features={featMap[plan.id] || []}
              onAction={() => handlePlanSelection(plan)}
            />
          );
        })}

        <View style={styles.divider} />

        <Typography variant="mono" style={[styles.sectionLabel, { color: theme.textTertiary, opacity: 0.5 }]}>// INSTITUTIONAL_CREDENTIALS (COMING_SOON)</Typography>
        
        <GlassCard style={[styles.verificationCard, { opacity: 0.4 }]}>
          <View style={styles.verifHeader}>
            <View style={[styles.verifIcon, { backgroundColor: theme.textTertiary + '10' }]}>
              <StudentIcon size={24} color={theme.textTertiary} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="monoBold" style={{ color: theme.textPrimary }}>STUDENT_VERIFICATION</Typography>
              <Typography variant="caption" style={{ color: theme.textSecondary }}>VERIFICATION_BRIDGE_IDLE</Typography>
            </View>
          </View>
        </GlassCard>

        <PlanCard 
          id="student"
          name="Student" 
          price="5.00" 
          color="#10B981"
          active={false}
          locked={true}
          comingSoon={true}
          features={['10k Sim Paths', 'MFA Enabled', 'Same as Plus tier', 'Requires .edu validation']}
          onAction={() => {}}
        />

        <View style={styles.divider} />

        <View style={styles.managementNotice}>
          <Typography variant="mono" style={[styles.sectionLabel, { color: theme.textTertiary, opacity: 0.7, marginBottom: 8 }]}>// BILLING_MASTER_CONTROL</Typography>
          <Typography variant="caption" style={{ color: theme.textSecondary, fontStyle: 'italic', textAlign: 'center' }}>
            To manage your renewal, view invoice history, or decommission your plan, please access your institutional vault via the QuantMind Web Terminal. 
          </Typography>
          <TouchableOpacity 
            style={{ marginTop: 12, borderBottomWidth: 1, borderColor: theme.primary + '44' }}
            onPress={() => Linking.openURL('https://quantmind.app/dashboard/settings')}
          >
            <Typography variant="monoBold" style={{ color: theme.primary, fontSize: 10 }}>NAVIGATE_TO_TERMINAL</Typography>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <LoadingOverlay visible={isVerifying} message={STRINGS.ESTABLISHING_BRIDGE} />
      
      {selectedPlan && (
        <BillingAddressModal
          visible={billingVisible}
          onClose={() => setBillingVisible(false)}
          onSubmit={onBillingSubmit}
          planName={selectedPlan.id}
          amount={selectedPlan.kesPrice}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingTop: 64 },
  header: { marginBottom: 32 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 24,
  },
  subHeader: { fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 28, letterSpacing: 2 },
  planCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  planName: { fontSize: 13, letterSpacing: 1.5, marginBottom: 2 },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  multiplierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featuresList: { marginBottom: 24, gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proGradientStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#A855F7',
  },
  vipBadge: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vipBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 1,
  },
  actionBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  actionBtnText: { fontSize: 13, letterSpacing: 1.5, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 32 },
  sectionLabel: { fontSize: 9, marginBottom: 16, marginLeft: 4 },
  verificationCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  verifHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  verifIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtn: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedState: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#10B98110',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B98133',
  },
  managementNotice: {
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    marginVertical: 12,
  }
});
