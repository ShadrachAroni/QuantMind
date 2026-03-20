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
  Building2
} from 'lucide-react-native';
import { BillingAddressModal, BillingAddress } from '../../components/ui/BillingAddressModal';
import { Linking } from 'react-native';
import { PromotionTicker } from '../../components/ui/PromotionTicker';

const { width } = Dimensions.get('window');

export function SubscriptionScreen({ navigation }: any) {
  const { tier, isStudentVerified, pesapalPlans } = useAuthStore();
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
      const { data, error } = await supabase.functions.invoke('pesapal-handler', {
        body: {
          planId: selectedPlan.id,
          amount: selectedPlan.kesPrice,
          billingAddress: address,
          userId: session.user.id
        },
        method: 'POST'
      });

      if (error) throw error;
      if (data.redirect_url) {
        showToast('REDIRECTING_TO_SECURE_GATEWAY...', 'success');
        const canOpen = await Linking.canOpenURL(data.redirect_url);
        if (canOpen) {
          await Linking.openURL(data.redirect_url);
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

  const PlanCard = ({ name, price, multiplier, features, color, active, locked, comingSoon, onAction }: any) => (
    <GlassCard style={[styles.planCard, active && { borderColor: color, borderWidth: 2 }, comingSoon && { opacity: 0.5 }]}>
      <View style={styles.planHeader}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Typography variant="monoBold" style={[styles.planName, { color: active ? color : theme.textPrimary }]}>{name.toUpperCase()}</Typography>
            {multiplier && (
              <View style={[styles.multiplierBadge, { backgroundColor: color + '22' }]}>
                <ZapIcon size={8} color={color} />
                <Typography variant="mono" style={{ color: color, fontSize: 8 }}>{multiplier}</Typography>
              </View>
            )}
            {comingSoon && <View style={[styles.comingSoonBadge, { backgroundColor: color + '22' }]}><Typography variant="mono" style={{ color: color, fontSize: 8 }}>COMING_SOON</Typography></View>}
          </View>
          <Typography variant="h2" style={{ color: theme.textPrimary }}>${price}<Typography variant="caption" style={{ color: theme.textTertiary }}>/mo</Typography></Typography>
        </View>
        {active && <CheckIcon size={24} color={color} />}
      </View>

      <View style={styles.featuresList}>
        {features.map((f: string, i: number) => (
          <View key={i} style={styles.featureItem}>
            <CheckIcon size={12} color={color} style={{ marginRight: 8 }} />
            <Typography variant="caption" style={{ color: theme.textSecondary }}>{f}</Typography>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.actionBtn, { backgroundColor: locked ? theme.textTertiary + '22' : color }]} 
        onPress={onAction}
        disabled={active || locked}
      >
        <Typography variant="monoBold" style={[styles.actionBtnText, { color: locked ? theme.textTertiary : theme.background }]}>
          {active ? STRINGS.CURRENT_LEVEL : locked ? 'LOCKED_VERIF_REQ' : STRINGS.UPGRADE_NOW}
        </Typography>
        {!active && !locked && <ArrowIcon size={14} color={theme.background} style={{ marginLeft: 8 }} />}
      </TouchableOpacity>
    </GlassCard>
  );

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

        <PromotionTicker />

        {pesapalPlans.map((plan: any) => {
          const color = plan.id === 'basic' ? theme.secondary : plan.id === 'pro' ? theme.primary : '#8B5CF6';
          const usdPrice = plan.id === 'basic' ? '19' : plan.id === 'pro' ? '49' : '199';
          const featMap: Record<string, string[]> = {
            basic: ['10k Simulation Paths', 'MFA Security Layer', 'Full Asset Station', 'Standard Support Matrix'],
            pro: ['100k Simulation Paths', 'Fat-Tail (Levy) Engines', 'Claude 3 Opus Oracle', 'Priority Cluster Routing'],
            institution: ['Infinite Batch Compute', 'Dedicated H100 GPU Nodes', 'Direct Exchange Proxy', 'Raw API Data Stream']
          };

          return (
            <PlanCard 
              key={plan.id}
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
          name="Student" 
          price="4.99" 
          color="#F59E0B"
          active={false}
          locked={true}
          comingSoon={true}
          features={['10k Sim Paths', 'MFA Enabled', 'Same as Plus tier', 'Requires .edu validation']}
          onAction={() => {}}
        />

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
  planName: { fontSize: 12, letterSpacing: 1, marginBottom: 4 },
  comingSoonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  multiplierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featuresList: { marginBottom: 24, gap: 10 },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 12, letterSpacing: 1 },
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
  }
});
