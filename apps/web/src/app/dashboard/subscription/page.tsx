'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  History, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Power
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS, Plan } from '@/config/plans';
import { PlanCard } from '@/components/subscription/PlanCard';
import { InvoiceVault } from '@/components/subscription/InvoiceVault';
import { logSecurityEvent } from '@/lib/security/audit';
import { GlassCard } from '@/components/ui/GlassCard';
import { TierBadge } from '@/components/ui/TierBadge';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

export default function SubscriptionPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const planSlug = searchParams.get('plan');
  const isSuccess = searchParams.get('success') === 'true';
  const supabase = createClient();

  useEffect(() => {
    if (isSuccess) {
      // Clear URL and show success (in a real app we'd use a toast)
      setError(null);
      // We'll use a local success state or just rely on the badge updating
    }
  }, [isSuccess]);

  useEffect(() => {
    const fetchProfile = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setUserProfile(profile);
       }
    };
    fetchProfile();
  }, [supabase]);

  // Handle Auto-Trigger for Subscription Selection from Landing Page
  useEffect(() => {
    if (planSlug && !hasAutoTriggered && userProfile) {
      setHasAutoTriggered(true);

      // Match slug to plan ID
      const targetPlan = SUBSCRIPTION_PLANS.find(p =>
        p.tier === planSlug || p.id.includes(planSlug)
      );

      if (targetPlan && targetPlan.price > 0 && userProfile.tier !== targetPlan.tier) {
         handlePlanSelect(targetPlan.id);
      }
    }
  }, [planSlug, userProfile, hasAutoTriggered]);

  const handleCancelSubscription = async () => {
    if (!confirm('TERMINATE_PROTOCOL_CONFIRMATION: Are you sure you want to decommission your active subscription? This action will revert your account to the FREE tier immediately.')) return;

    setIsCancelling(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('paystack-cancel');
      if (funcError) throw funcError;

      // Refresh profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         const { data: profile } = await supabase
           .from('user_profiles')
           .select('*')
           .eq('id', user.id)
           .single();
         setUserProfile(profile);
      }
      
      // Log auditing event
      await logSecurityEvent('SUBSCRIPTION_DECOMMISSION', {
         metadata: { tier: userProfile?.tier, reason: 'user_decommission_trigger' }
      });
      
      alert('PROTOCOL_DECOMMISSIONED: Your subscription has been canceled successfully.');
    } catch (err: any) {
      setError(err.message || 'Decommission failure: Terminal connection interrupted.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePlanSelect = async (planId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('INVALID_PLAN_PROTOCOL');

      const { data, error: funcError } = await supabase.functions.invoke('paystack-checkout', {
        body: { planCode: plan.paystack_plan_code }
      });

      if (funcError) throw funcError;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('TRANS_INIT_FAILURE');
      }
    } catch (err: any) {
      setError(err.message || 'Payment terminal connection failure.');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 md:space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] md:text-[10px] font-bold text-[#848D97] uppercase tracking-widest">Billing Terminal</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-pulse" />
           </div>
           <h1 className="text-2xl md:text-3xl font-bold text-white uppercase font-mono tracking-tight">Institutional_Plans</h1>
           <p className="text-[#848D97] text-xs md:text-sm">Scale your computational capacity with QuantMind Cloud.</p>
        </div>

        <GlassCard className="p-4 flex items-center justify-between lg:justify-end gap-4 md:gap-6" intensity="low">
           <div className="flex flex-col items-end">
              <span className="text-[8px] md:text-[10px] font-bold text-[#848D97] uppercase tracking-widest leading-none mb-1">Current_Tier</span>
              <TierBadge tier={userProfile?.tier || 'free'} />
           </div>
           <div className="w-px h-8 bg-white/5" />
           <div className="flex flex-col items-end">
              <span className="text-[8px] md:text-[10px] font-bold text-[#848D97] uppercase tracking-widest leading-none mb-1">Renewal_Date</span>
              <span className="text-xs md:text-sm font-mono text-white">31_MAR_2026</span>
           </div>

           {userProfile?.tier !== 'free' && (
              <>
                <div className="w-px h-8 bg-white/5" />
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="flex flex-col items-center group disabled:opacity-50"
                >
                   <div className="w-8 h-8 rounded-lg bg-[#FF453A]/10 flex items-center justify-center text-[#FF453A] group-hover:bg-[#FF453A] group-hover:text-white transition-all">
                      <Power size={14} />
                   </div>
                   <span className="text-[7px] font-bold text-[#FF453A] uppercase tracking-tighter mt-1">DECOMMISSION</span>
                </button>
              </>
           )}
        </GlassCard>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-4 text-red-500">
           <AlertCircle size={18} className="shrink-0" />
           <p className="text-[10px] md:text-xs font-mono uppercase tracking-widest font-bold">{error}</p>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex flex-col items-center gap-4">
        <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex items-center relative gap-1">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={cn(
               "px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all relative z-10",
               billingInterval === 'monthly' ? "text-[#05070A]" : "text-[#848D97] hover:text-white"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={cn(
               "px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all relative z-10",
               billingInterval === 'yearly' ? "text-[#05070A]" : "text-[#848D97] hover:text-white"
            )}
          >
            Yearly
          </button>

          <div
            className={cn(
              "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#00D9FF] rounded-xl transition-all duration-300 ease-out",
              billingInterval === 'monthly' ? "left-1" : "left-[calc(50%+2px)]"
            )}
          />
        </div>
        <p className="text-[9px] text-[#00D9FF] font-mono uppercase tracking-[0.2em] font-bold animate-pulse">
           {billingInterval === 'yearly' ? 'Institutional_Discount_Applied: Save up to 23%' : 'Standard_Flexible_Billing'}
        </p>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {SUBSCRIPTION_PLANS
           .filter(plan => {
             const userIsPaid = userProfile?.tier && userProfile.tier !== 'free';
             const isFreeTier = plan.tier === 'free';
             const shouldHideFree = userIsPaid && isFreeTier;

             return !shouldHideFree && (plan.tier === 'free' || plan.tier === 'student' || plan.interval === billingInterval);
           })
           .map((plan) => (
           <PlanCard
             key={plan.id}
             plan={plan}
             isCurrent={userProfile?.tier === plan.tier}
             currentTier={userProfile?.tier || 'free'}
             onSelect={handlePlanSelect}
             isLoading={isLoading}
             isComingSoon={plan.tier === 'student'}
           />
         ))}
      </div>

      {/* Institutional Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-8 md:pt-12">
         <GlassCard 
            onClick={() => setIsVaultOpen(true)}
            className="p-6 md:p-8 flex items-start gap-4 md:gap-6 border-white/5 hover:border-white/10 transition-all cursor-pointer group" 
            intensity="low"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center text-[#848D97] group-hover:text-white transition-colors shrink-0">
               <History size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="flex-1">
               <h4 className="text-base md:text-lg font-bold text-white uppercase tracking-tight mb-1 font-mono">Invoice_Vault</h4>
               <p className="text-xs md:text-sm text-[#848D97] mb-4">Retrieve and download institutional tax documentation and receipts.</p>
               <div className="flex items-center gap-2 text-[10px] font-bold text-[#00D9FF] uppercase tracking-widest group-hover:underline">
                  Access History <ChevronRight size={14} />
               </div>
            </div>
         </GlassCard>

          <GlassCard 
            onClick={() => router.push('/dashboard/settings?tab=security')}
            className="p-6 md:p-8 flex items-start gap-4 md:gap-6 border-white/5 hover:border-white/10 transition-all cursor-pointer group" 
            intensity="low"
          >
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center text-[#848D97] group-hover:text-white transition-colors shrink-0">
                <ShieldCheck size={20} className="md:w-6 md:h-6" />
             </div>
             <div className="flex-1">
                <h4 className="text-base md:text-lg font-bold text-white uppercase tracking-tight mb-1 font-mono">Security_Parameters</h4>
                <p className="text-xs md:text-sm text-[#848D97] mb-4">Manage terminal access and institutional billing permissions.</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest group-hover:underline">
                   Terminal Control <ChevronRight size={14} />
                </div>
             </div>
           </GlassCard>
      </div>

      <InvoiceVault 
        isOpen={isVaultOpen} 
        onClose={() => setIsVaultOpen(false)} 
      />
      
      {isCancelling && <LoadingOverlay visible={isCancelling} message="DECOMMISSIONING_PROTOCOL..." />}
    </div>
  );
}
