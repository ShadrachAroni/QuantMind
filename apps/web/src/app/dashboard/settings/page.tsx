'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Cpu, 
  CreditCard, 
  Settings, 
  Bell, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  ChevronRight,
  Camera,
  ShieldCheck,
  Zap,
  Lock,
  Globe
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

import { useUser } from '@/components/UserContext';
import { useTranslation } from '@/lib/i18n';
import { logSecurityEvent } from '@/lib/security/audit';

type Tab = 'profile' | 'security' | 'ai' | 'billing';

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  current_period_end: string;
  paystack_subscription_code?: string;
  cancel_at_period_end?: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { profile, loading: profileLoading } = useUser();
  const t = useTranslation(profile?.interface_language || 'ENGLISH_INTL');
  
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam && ['profile', 'security', 'ai', 'billing'].includes(tabParam)) {
       setActiveTab(tabParam as Tab);
    }
  }, [tabParam]);

  const handleSignOut = async () => {
    await logSecurityEvent('AUTH_LOGOUT');
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'profile', label: t('Identity_Profile'), icon: User },
    { id: 'security', label: t('Security_Nodes'), icon: Shield },
    { id: 'ai', label: t('Cognitive_Persona'), icon: Cpu },
    { id: 'billing', label: t('Subscription_Ledger'), icon: CreditCard },
  ];

   if (profileLoading) return (
      <div className="p-4 md:p-8 h-[60vh] flex items-center justify-center">
         <div className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#00D9FF] animate-pulse font-mono">{t('Loading_User_Environment')}...</div>
      </div>
   );

   return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div>
         <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-[#848D97] uppercase tracking-[0.3em] font-mono">{t('System_Config')}_v1.0</span>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
         </div>
         <h1 className="text-2xl md:text-3xl font-bold text-white uppercase font-mono tracking-tight text-glow">{t('Account_Management')}</h1>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 md:gap-10">
         {/* Navigation Tabs - Mobile Scrollable / Desktop Sidebar */}
         <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                   "flex-none lg:w-full flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 text-left whitespace-nowrap",
                   activeTab === tab.id 
                     ? "bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20 shadow-[0_4px_15px_rgba(0,217,255,0.1)]" 
                     : "text-[#848D97] hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                 <tab.icon size={18} />
                 <span className="text-[10px] md:text-xs uppercase font-bold tracking-widest">{tab.label}</span>
              </button>
            ))}

            <div className="hidden lg:block pt-8 border-t border-white/5 mt-8">
               <button 
                 onClick={handleSignOut}
                 className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[#FF453A] hover:bg-[#FF453A]/5 transition-all text-left"
               >
                  <LogOut size={18} />
                  <span className="text-xs uppercase font-bold tracking-widest">{t('Sign_Out')}</span>
               </button>
            </div>
         </div>

         {/* Content Area */}
         <div className="lg:col-span-3 min-h-[400px] md:min-h-[600px]">
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'security' && <SecuritySection router={router} />}
            {activeTab === 'ai' && <AIPersonaSection router={router} />}
            {activeTab === 'billing' && <BillingSection router={router} />}
            
            {/* Mobile Sign Out */}
            <div className="lg:hidden mt-12 pt-8 border-t border-white/5">
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-4 px-6 py-4 rounded-2xl bg-[#FF453A]/5 text-[#FF453A] border border-[#FF453A]/10 transition-all text-left"
                >
                    <LogOut size={18} />
                    <span className="text-xs uppercase font-bold tracking-widest">{t('Sign_Out')}</span>
                </button>
            </div>
         </div>
      </div>
    </div>
   );
}

function ProfileSection() {
  const { profile: initialProfile, refreshProfile } = useUser();
  const [firstName, setFirstName] = useState(initialProfile?.first_name || '');
  const [lastName, setLastName] = useState(initialProfile?.last_name || '');
  const [phoneNumber, setPhoneNumber] = useState(initialProfile?.phone_number || '');
  const [region, setRegion] = useState(initialProfile?.region || 'US_EAST_NY');
  const [interfaceLanguage, setInterfaceLanguage] = useState(initialProfile?.interface_language || 'ENGLISH_INTL');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const supabase = createClient();
  const t = useTranslation(interfaceLanguage);

  useEffect(() => {
    if (initialProfile) {
      setFirstName(initialProfile.first_name || '');
      setLastName(initialProfile.last_name || '');
      setPhoneNumber(initialProfile.phone_number || '');
      setRegion(initialProfile.region || 'US_EAST_NY');
      setInterfaceLanguage(initialProfile.interface_language || 'ENGLISH_INTL');
    }
  }, [initialProfile]);

  // Credential change policy logic
  const lastChangeAt = initialProfile?.last_credential_change_at ? new Date(initialProfile.last_credential_change_at) : new Date(0);
  const nextAllowedChange = new Date(lastChangeAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const isLocked = new Date() < nextAllowedChange;

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          region: region,
          interface_language: interfaceLanguage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', initialProfile?.id);

      if (error) throw error;
      await refreshProfile();
      await logSecurityEvent('CREDENTIAL_CHANGE', {
         metadata: { fields: ['first_name', 'last_name', 'phone_number', 'region', 'interface_language'] }
      });
      setMessage({ type: 'success', text: t('Success_Sync') });
    } catch (err: any) {
      setMessage({ type: 'error', text: t('Error_Sync') });
    } finally {
      setIsSaving(false);
    }
  };

  if (!initialProfile) return null;

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg md:text-xl font-bold text-white uppercase font-mono tracking-tight">{t('Identity_Profile')}</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isLocked && (
               <div className="flex items-center justify-center gap-2 px-3 py-1 bg-[#FFD60A]/10 border border-[#FFD60A]/30 rounded-lg">
                  <Lock size={12} className="text-[#FFD60A]" />
                  <span className="text-[9px] font-mono text-[#FFD60A] font-bold uppercase tracking-widest">
                     Next Change: {nextAllowedChange.toLocaleDateString()}
                  </span>
               </div>
            )}
            <button 
              disabled={isSaving || isLocked}
              onClick={handleSave}
              className="bg-[#00D9FF] text-[#05070A] px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00D9FF]/90 transition-all disabled:opacity-50 w-full sm:w-auto"
            >
               {isSaving ? t('Synchronizing') : t('Commit_Changes')}
            </button>
          </div>
       </div>

       {isLocked && (
          <div className="p-4 bg-[#FF453A]/10 border border-[#FF453A]/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
             <AlertCircle size={16} className="text-[#FF453A] mt-0.5" />
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#FF453A] uppercase font-mono tracking-widest">Credential_Change_Restriction_Active</p>
                <p className="text-[10px] text-[#FF453A]/80 uppercase font-mono leading-relaxed">
                   To maintain institutional account integrity, identity credentials (name, email, password) can only be modified once every 30 days. Your next modification window opens on <span className="underline decoration-dotted">{nextAllowedChange.toLocaleDateString()}</span>.
                </p>
             </div>
          </div>
       )}

       {message && (
         <div className={cn(
           "p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest font-mono border",
           message.type === 'success' ? "bg-[#32D74B]/10 border-[#32D74B]/20 text-[#32D74B]" : "bg-[#FF453A]/10 border-[#FF453A]/20 text-[#FF453A]"
         )}>
           {message.text}
         </div>
       )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <GlassCard className="p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 md:gap-8 md:col-span-2" intensity="low">
             <div className="relative group">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
                   <User className="text-white/20" size={32} />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera className="text-white" size={20} />
                   </div>
                </div>
             </div>
             <div className="text-center sm:text-left">
                <h3 className="text-white font-bold text-lg">{firstName || 'QUANT_NODE'}</h3>
                <p className="text-[#848D97] text-sm font-mono mt-1 uppercase tracking-widest">{t('Tier_Level')}::{initialProfile?.tier?.toUpperCase() || 'FREE'}_NODE</p>
                <p className="text-[#848D97] text-[10px] md:text-xs font-mono mt-1">UID: {initialProfile?.id?.substring(0, 16).toUpperCase()}...</p>
             </div>
          </GlassCard>

          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">{t('First_Name')}</label>
                  <input 
                    type="text" 
                    value={firstName}
                    disabled={isLocked}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#12121A] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono disabled:opacity-40" 
                  />
               </div>
               <div>
                  <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">{t('Last_Name')}</label>
                  <input 
                    type="text" 
                    value={lastName}
                    disabled={isLocked}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#12121A] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono disabled:opacity-40" 
                  />
               </div>
             </div>
             <div>
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">{t('Primary_Contact')}</label>
                <input 
                  type="text" 
                  value={initialProfile?.email || 'N/A'} 
                  disabled
                  className="w-full bg-[#05070A] border border-white/5 rounded-xl py-3 px-4 text-white/40 text-sm font-mono opacity-60" 
                />
             </div>
          </div>

          <div className="space-y-6">
             <div>
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">{t('Phone_Anchor')}</label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-[#12121A] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono" 
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">{t('Region_Zone')}</label>
                  <select 
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-[#12121A] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono appearance-none"
                  >
                     <option value="US_EAST_NY">US_EAST_NY</option>
                     <option value="EU_WEST_LDN">EU_WEST_LDN</option>
                     <option value="AF_WEST_LOS">AF_WEST_LOS</option>
                  </select>
               </div>
               <div>
                  <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">{t('Interface_Language')}</label>
                  <select 
                    value={interfaceLanguage}
                    onChange={(e) => setInterfaceLanguage(e.target.value)}
                    className="w-full bg-[#12121A] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono appearance-none"
                  >
                     <option value="ENGLISH_INTL">ENGLISH_INTL</option>
                     <option value="DEUTSCH_EU">DEUTSCH_EU</option>
                  </select>
               </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function SecuritySection({ router }: { router: any }) {
  const { profile } = useUser();
  const t = useTranslation(profile?.interface_language || 'ENGLISH_INTL');
  const supabase = createClient();
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

   const lastChangeAt = profile?.last_credential_change_at ? new Date(profile.last_credential_change_at) : new Date(0);
   const nextAllowedChange = new Date(lastChangeAt.getTime() + 30 * 24 * 60 * 60 * 1000);
   const isLocked = new Date() < nextAllowedChange;

  useEffect(() => {
    fetchMfaStatus();
  }, []);

  const fetchMfaStatus = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return;
    setMfaFactors(data.all);
  };

  const totpFactor = mfaFactors.find(f => f.factor_type === 'totp' && f.status === 'verified');

  const handleStartTotpEnrollment = async () => {
    setMessage(null);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'QuantMind'
    });
    if (error) {
       setMessage({ type: 'error', text: t('Error_Sync') });
       return;
    }
    setEnrollmentData(data);
    setIsEnrolling(true);
  };

  const handleVerifyTotp = async () => {
    if (!enrollmentData) return;
    setIsVerifying(true);
    setMessage(null);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: enrollmentData.id });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: enrollmentData.id,
        challengeId: challenge.data.id,
        code: verificationCode
      });
      if (verify.error) throw verify.error;

      setMessage({ type: 'success', text: t('Verification_Success') });
      setIsEnrolling(false);
      setEnrollmentData(null);
      setVerificationCode('');
      fetchMfaStatus();
    } catch (err: any) {
      setMessage({ type: 'error', text: t('Verification_Error') });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnenroll = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
       setMessage({ type: 'error', text: t('Error_Sync') });
    } else {
       fetchMfaStatus();
       setMessage({ type: 'success', text: 'MFA_DEACTIVATED' });
    }
  };

  const handleToggleEmailMfa = async () => {
    if (!profile) return;
    setIsVerifying(true);
    try {
      const newState = !profile.mfa_email_enabled;
      const { error } = await supabase
        .from('user_profiles')
        .update({ mfa_email_enabled: newState })
        .eq('id', profile.id);
      
      if (error) throw error;
      setMessage({ type: 'success', text: newState ? 'EMAIL_MFA_ENABLED' : 'EMAIL_MFA_DISABLED' });
    } catch (err: any) {
      setMessage({ type: 'error', text: t('Error_Sync') });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEnrollPasskey = async () => {
    setMessage(null);
    try {
      // Note: passkey enrollment typically requires a name/nickname
      const { data, error } = await (supabase.auth as any).addPasskey({
        name: `QuantMind_Node_${profile?.id?.substring(0, 4)}`
      });
      
      if (error) throw error;
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ mfa_passkey_enabled: true })
        .eq('id', profile?.id);

      if (profileError) throw profileError;
      
      setMessage({ type: 'success', text: 'PASSKEY_ENROLLED' });
      fetchMfaStatus();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'PASSKEY_SETUP_FAILED' });
    }
  };

  const handleResetPassword = async () => {
     if (!profile?.email) {
        setMessage({ type: 'error', text: t('Error_Sync') });
        return;
     }
     setMessage(null);
     const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
     });
     if (error) {
        const isRateLimit = error.status === 429 || error.message?.toLowerCase().includes('rate limit');
        setMessage({ 
           type: 'error', 
           text: isRateLimit ? t('Rate_Limit_Error') : t('Reset_Email_Error') 
        });
     } else {
         await logSecurityEvent('CREDENTIAL_CHANGE', {
            metadata: { type: 'password_reset_request', email: profile.email }
         });
         setMessage({ type: 'success', text: t('Reset_Email_Sent') });
      }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg md:text-xl font-bold text-white uppercase font-mono tracking-tight">{t('Security_Nodes')}</h2>
          {message && (
             <span className={cn(
                "text-[9px] font-mono uppercase font-bold",
                message.type === 'success' ? "text-[#32D74B]" : "text-[#FF453A]"
             )}>{message.text}</span>
          )}
       </div>
       
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Authenticator App */}
          <GlassCard className="p-6 md:p-8 space-y-6 flex flex-col justify-between" intensity="low">
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <ShieldCheck className={totpFactor ? "text-[#32D74B]" : "text-[#848D97]"} size={20} />
                   <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white">{t('MFA_Method_App')}</h3>
                </div>
                <p className="text-[11px] text-[#848D97] leading-relaxed uppercase font-mono">
                   Use standard TOTP generators like Google Authenticator or 1Password.
                </p>
             </div>
             <div>
                <div className="mb-4">
                   <span className="text-[9px] uppercase font-bold text-[#848D97] font-mono tracking-widest">{totpFactor ? t('MFA_Status_Active') : t('MFA_Status_Inactive')}</span>
                </div>
                {totpFactor ? (
                   <button 
                     onClick={() => handleUnenroll(totpFactor.id)}
                     className="w-full bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/20 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#FF453A]/20 transition-all font-mono"
                   >
                      {t('MFA_Action_Disable')}
                   </button>
                ) : (
                   <button 
                     onClick={handleStartTotpEnrollment}
                     className="w-full bg-[#00D9FF] text-[#05070A] py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00D9FF]/90 transition-all font-mono"
                   >
                      {t('MFA_Action_Setup')}
                   </button>
                )}
             </div>
          </GlassCard>

          {/* Email OTP */}
          <GlassCard className="p-6 md:p-8 space-y-6 flex flex-col justify-between" intensity="low">
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <Mail className={profile?.mfa_email_enabled ? "text-[#32D74B]" : "text-[#848D97]"} size={20} />
                   <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white">{t('MFA_Method_Email')}</h3>
                </div>
                <p className="text-[11px] text-[#848D97] leading-relaxed uppercase font-mono">
                   Receive unique security codes via your primary institutional email.
                </p>
             </div>
             <div>
                <div className="mb-4">
                   <span className="text-[9px] uppercase font-bold text-[#848D97] font-mono tracking-widest">{profile?.mfa_email_enabled ? t('MFA_Status_Active') : t('MFA_Status_Inactive')}</span>
                </div>
                <button 
                  disabled={isVerifying}
                  onClick={handleToggleEmailMfa}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono",
                    profile?.mfa_email_enabled 
                      ? "bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/20 hover:bg-[#FF453A]/20" 
                      : "bg-[#00D9FF] text-[#05070A] hover:bg-[#00D9FF]/90"
                  )}
                >
                   {profile?.mfa_email_enabled ? t('MFA_Action_Disable') : t('MFA_Action_Setup')}
                </button>
             </div>
          </GlassCard>

          {/* Passkey */}
          <GlassCard className="p-6 md:p-8 space-y-6 flex flex-col justify-between" intensity="low">
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <Zap className={profile?.mfa_passkey_enabled ? "text-[#32D74B]" : "text-[#848D97]"} size={20} />
                   <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white">{t('MFA_Method_Passkey')}</h3>
                </div>
                <p className="text-[11px] text-[#848D97] leading-relaxed uppercase font-mono">
                   Biometric or hardware-based verification (FaceID, TouchID, Yubikey).
                </p>
             </div>
             <div>
                <div className="mb-4">
                   <span className="text-[9px] uppercase font-bold text-[#848D97] font-mono tracking-widest">{profile?.mfa_passkey_enabled ? t('MFA_Status_Active') : t('MFA_Status_Inactive')}</span>
                </div>
                <button 
                  onClick={handleEnrollPasskey}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono",
                    profile?.mfa_passkey_enabled 
                      ? "bg-white/5 border border-white/10 text-white cursor-default" 
                      : "bg-[#00D9FF] text-[#05070A] hover:bg-[#00D9FF]/90"
                  )}
                >
                   {profile?.mfa_passkey_enabled ? 'PASSKEY_STORED' : t('MFA_Action_Setup')}
                </button>
             </div>
          </GlassCard>

          {/* Reset Credentials Card */}
           <GlassCard className={cn("p-6 md:p-8 space-y-6 sm:col-span-2 lg:col-span-3", isLocked && "opacity-80")} intensity="low">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                    <Settings className={isLocked ? "text-[#848D97]" : "text-[#FFD60A]"} size={20} />
                    <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white">Access_Credentials_Node</h3>
                 </div>
                 <p className="text-[11px] text-[#848D97] uppercase font-mono tracking-widest truncate">
                    {t('Primary_Contact')}: {profile?.email}
                 </p>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-8 justify-between p-6 bg-white/5 rounded-2xl border border-white/5 relative">
                 {isLocked && (
                    <div className="absolute inset-x-0 -top-2 flex justify-center">
                       <span className="bg-[#FF453A] text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">RESTRICTED_PROTOCOL_LOCK</span>
                    </div>
                 )}
                 <p className="text-[11px] text-[#848D97] leading-relaxed uppercase font-mono max-w-xl">
                    Deploy a secure credential reset node to your primary contact address. This will terminate all active platform sessions. <span className="text-[#FF453A]/80 font-bold">{isLocked ? `Next allowed: ${nextAllowedChange.toLocaleDateString()}` : ''}</span>
                 </p>
                 <button 
                   disabled={isLocked}
                   onClick={handleResetPassword}
                   className={cn(
                     "whitespace-nowrap px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono",
                     isLocked 
                       ? "bg-white/5 border border-white/10 text-[#848D97] cursor-not-allowed" 
                       : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                   )}
                 >
                    {t('Change_Credentials')}
                 </button>
              </div>
           </GlassCard>
       </div>

       {/* TOTP Enrollment Modal */}
       {isEnrolling && enrollmentData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#05070A]/80 backdrop-blur-md">
             <GlassCard className="w-full max-w-md p-10 space-y-8 border-[#00D9FF]/30 shadow-[0_0_50px_rgba(0,217,255,0.1)]" intensity="high">
                <div className="flex items-center justify-between">
                   <h3 className="text-xs font-bold text-white uppercase font-mono tracking-[0.2em]">{t('MFA_Setup_Title')}</h3>
                   <button onClick={() => setIsEnrolling(false)} className="text-[#848D97] hover:text-white transition-colors text-2xl">&times;</button>
                </div>

                <div className="flex flex-col items-center gap-8">
                   <div className="p-4 bg-white rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                      <img 
                        src={enrollmentData.totp.qr_code} 
                        alt="MFA QR Code" 
                        className="w-48 h-48"
                      />
                   </div>
                   <div className="text-center space-y-3 bg-white/5 p-4 rounded-xl border border-white/10 w-full">
                      <p className="text-[9px] text-[#848D97] uppercase font-bold tracking-[0.2em] font-mono">SECURE_RECOVERY_KEY</p>
                      <code className="text-[#00D9FF] font-mono text-sm font-bold tracking-[0.3em] block">{enrollmentData.totp.secret}</code>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] block text-center font-mono">{t('MFA_Verify_Prompt')}</label>
                      <input 
                        type="text" 
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000 000"
                        className="w-full bg-[#12121A] border border-white/10 rounded-xl py-5 text-center text-white text-2xl tracking-[0.8em] focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono"
                      />
                   </div>
                   <button 
                     onClick={handleVerifyTotp}
                     disabled={isVerifying || verificationCode.length !== 6}
                     className="w-full bg-[#00D9FF] text-[#05070A] py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00D9FF]/90 transition-all disabled:opacity-50 shadow-[0_4px_15px_rgba(0,217,255,0.3)]"
                   >
                      {isVerifying ? t('Verifying') : t('Finalize_Enrollment')}
                   </button>
                </div>
             </GlassCard>
          </div>
       )}
    </div>
  );
}

function AIPersonaSection({ router }: { router: any }) {
  const { profile, refreshProfile } = useUser();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [newConfig, setNewConfig] = useState({ provider: 'google', model_id: 'gemini-2.5-flash', api_key: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'err', text: string } | null>(null);
  
  const [persona, setPersona] = useState(profile?.ai_persona || 'ANALYTICAL_COLD');
  const [sensitivity, setSensitivity] = useState(profile?.ai_risk_sensitivity || 'BALANCED');

  const supabase = createClient();
  const t = useTranslation(profile?.interface_language || 'ENGLISH_INTL');

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      const [configRes] = await Promise.all([
        fetch('/api/ai/config').then(res => res.json())
      ]);

      if (configRes.configs) setConfigs(configRes.configs);
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const handleSavePersona = async () => {
    setIsSavingPersona(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ai_persona: persona,
          ai_risk_sensitivity: sensitivity,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile?.id);

      if (error) throw error;
      await refreshProfile();
      setMessage({ type: 'success', text: t('AI_Sync_Success') });
    } catch (err: any) {
      setMessage({ type: 'err', text: t('AI_Sync_Failure') });
    } finally {
      setIsSavingPersona(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: t('AI_Sync_Success') });
      // Refresh configs
      const configRes = await fetch('/api/ai/config').then(res => res.json());
      if (configRes.configs) setConfigs(configRes.configs);
    } catch (err: any) {
      setMessage({ type: 'err', text: t('AI_Sync_Failure') });
    } finally {
      setIsSaving(false);
    }
  };

  const activeConfig = configs.find(c => c.is_active) || configs[0];
  const quotaLimit = profile?.ai_token_quota_override || (profile?.tier === 'pro' ? 1000 : profile?.tier === 'plus' ? 100 : 20);
  const quotaUsed = profile?.ai_daily_usage_count || 0;
  const quotaPercent = Math.min(100, (quotaUsed / quotaLimit) * 100);

  if (loading) return null;

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg md:text-xl font-bold text-white uppercase font-mono tracking-tight">Cognitive_Persona_Matrix</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {profile?.tier === 'pro' && (
               <span className="text-[9px] font-bold text-[#00D9FF] border border-[#00D9FF]/30 px-3 py-1 rounded-full uppercase tracking-widest bg-[#00D9FF]/5 text-center">Institutional_Pro_Node</span>
            )}
            <button 
              disabled={isSavingPersona}
              onClick={handleSavePersona}
              className="bg-[#00D9FF] text-[#05070A] px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00D9FF]/90 transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              {isSavingPersona ? t('Synchronizing') : t('Commit_Changes')}
            </button>
          </div>
       </div>
       
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Usage Stats - Always Visible */}
          <GlassCard className="p-6 md:p-8 space-y-6" intensity="low">
             <div className="flex items-center gap-3">
                <Zap className="text-[#FFD60A]" size={20} />
                <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white">Cognitive_Bandwidth</h3>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                   <span className="text-[#848D97]">Daily_Allocation</span>
                   <span className="text-white">{quotaUsed} / {quotaLimit} Messages</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div 
                     className={cn(
                       "h-full transition-all duration-1000",
                       quotaPercent > 90 ? "bg-[#FF453A]" : quotaPercent > 70 ? "bg-[#FFD60A]" : "bg-[#00D9FF]"
                     )}
                     style={{ width: `${quotaPercent}%` }}
                   />
                </div>
                <p className="text-[9px] text-[#848D97] leading-relaxed uppercase font-mono italic">
                   System-default nodes reset every 24 hours. Custom nodes bypass these restrictions.
                </p>
             </div>
          </GlassCard>

          {/* Persona Settings */}
          <GlassCard className="p-6 md:p-8 space-y-6" intensity="low">
             <div className="flex items-center gap-3">
                <User className="text-[#00D9FF]" size={20} />
                <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white">Oracle_Personality</h3>
             </div>
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[9px] uppercase font-bold text-[#848D97] font-mono tracking-widest ml-1">{t('Cognitive_Persona')}</label>
                   <select 
                     value={persona}
                     onChange={(e) => setPersona(e.target.value)}
                     className="w-full bg-[#12121A] border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono appearance-none"
                   >
                      <option value="ANALYTICAL_COLD">{t('Persona_Analytical')}</option>
                      <option value="ADVISORY_SUPPORTIVE">{t('Persona_Supportive')}</option>
                      <option value="CRITICAL_ADVERSARIAL">{t('Persona_Critical')}</option>
                      <option value="HEDGE_FUND_VIBE">{t('Persona_HedgeFund')}</option>
                      <option value="QUANTI_MAXIMALIST">{t('Persona_QuantMax')}</option>
                   </select>
                </div>
                
                <div className="space-y-2">
                   <label className="text-[9px] uppercase font-bold text-[#848D97] font-mono tracking-widest ml-1">{t('Risk_Sensitivity')}</label>
                   <select 
                     value={sensitivity}
                     onChange={(e) => setSensitivity(e.target.value)}
                     className="w-full bg-[#12121A] border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono appearance-none"
                   >
                      <option value="CONSERVATIVE">{t('Sensitivity_Conservative')}</option>
                      <option value="BALANCED">{t('Sensitivity_Balanced')}</option>
                      <option value="AGGRESSIVE">{t('Sensitivity_Aggressive')}</option>
                      <option value="MAX_EXPOSURE">{t('Sensitivity_Max')}</option>
                   </select>
                </div>
             </div>
          </GlassCard>

          {/* Custom Node Configuration - Only for Pro */}
          <GlassCard className={cn(
            "p-6 md:p-8 lg:col-span-2 space-y-8 relative overflow-hidden",
            profile?.tier !== 'pro' && "opacity-60"
          )} intensity="medium">
             {profile?.tier !== 'pro' && (
               <div className="absolute inset-0 z-30 bg-[#05070A]/60 backdrop-blur-[4px] flex items-center justify-center p-8 text-center">
                  <div className="max-w-xs space-y-6">
                     <div className="w-16 h-16 bg-[#FFD60A]/10 rounded-full flex items-center justify-center mx-auto border border-[#FFD60A]/20">
                        <Lock className="text-[#FFD60A]" size={28} />
                     </div>
                     <div>
                        <h4 className="text-white font-bold uppercase tracking-[0.2em] text-sm mb-2">{t('Pro_Upgrade_Required')}</h4>
                        <p className="text-[#848D97] text-[10px] leading-relaxed uppercase font-mono mb-6">
                           Upgraded institutional nodes allow for 3rd party API integration to bypass all platform bandwidth limits and access sovereign models.
                        </p>
                        <button 
                          onClick={() => router.push('/dashboard/subscription')}
                          className="w-full bg-[#FFD60A] text-[#05070A] py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#FFD60A]/90 transition-all font-mono shadow-[0_4px_15px_rgba(255,214,10,0.2)]"
                        >
                           {t('Upgrade_to_Pro')}
                        </button>
                     </div>
                  </div>
               </div>
             )}

             <div className="flex items-center justify-between relative z-20">
                <div className="flex items-center gap-3">
                   <Globe className="text-[#00D9FF]" size={20} />
                   <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white">Secure_Cognitive_Configuration [Pro_Feature]</h3>
                </div>
                {message && (
                  <span className={cn(
                    "text-[9px] font-mono uppercase font-bold",
                    message.type === 'success' ? "text-[#32D74B]" : "text-[#FF453A]"
                  )}>{message.text}</span>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-20">
                <div className="space-y-2">
                   <label className="text-[9px] uppercase font-bold text-[#848D97] font-mono tracking-widest ml-1">Relay_Provider</label>
                   <select 
                     value={activeConfig?.provider || newConfig.provider}
                     onChange={(e) => setNewConfig({ ...newConfig, provider: e.target.value })}
                     className="w-full bg-[#05070A] border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono"
                   >
                      <option value="google">Google_Gemini</option>
                      <option value="openai">OpenAI_GPT</option>
                      <option value="anthropic">Anthropic_Claude</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] uppercase font-bold text-[#848D97] font-mono tracking-widest ml-1">Model_Identifier</label>
                   <input 
                     type="text" 
                     placeholder="e.g. gemini-2.5-flash"
                     value={newConfig.model_id}
                     onChange={(e) => setNewConfig({ ...newConfig, model_id: e.target.value })}
                     className="w-full bg-[#05070A] border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] uppercase font-bold text-[#848D97] font-mono tracking-widest ml-1">Secure_API_Key</label>
                   <div className="relative">
                      <input 
                        type="password" 
                        placeholder="••••••••••••••••"
                        value={newConfig.api_key}
                        onChange={(e) => setNewConfig({ ...newConfig, api_key: e.target.value })}
                        className="w-full bg-[#05070A] border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono pr-10"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                   </div>
                </div>
             </div>

             <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20">
                <p className="text-[9px] text-[#848D97] font-mono uppercase max-w-md leading-relaxed">
                   API keys are stored using military-grade AES-256-GCM encryption. De-cryption only occurs in secure server-side memory buffers during active cognitve relays.
                </p>
                <button 
                  disabled={isSaving || profile?.tier !== 'pro'}
                  onClick={handleSaveConfig}
                  className="bg-[#00D9FF] text-[#05070A] px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00D9FF]/90 transition-all disabled:opacity-50 w-full md:w-auto"
                >
                   {isSaving ? 'Synchronizing...' : 'Initialize_Node'}
                </button>
             </div>
          </GlassCard>
       </div>
    </div>
  );
}

function BillingSection({ router }: { router: any }) {
  const { profile, refreshProfile } = useUser();
  const t = useTranslation(profile?.interface_language || 'ENGLISH_INTL');
  const supabase = createClient();
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);
  const [isDecommissioning, setIsDecommissioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('id', profile?.id || '') // Assuming subscription ID matches profile ID for simple cases, or use user_id
          .single();

        // If not found by ID, try user_id
        if (error || !data) {
           const { data: subByUserId } = await supabase
             .from('subscriptions')
             .select('*')
             .eq('user_id', profile?.id || '')
             .single();
           setSubscription(subByUserId);
        } else {
          setSubscription(data);
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      } finally {
        setLoading(false);
      }
    };

    if (profile) fetchSubscription();
  }, [profile]);

  const handleManageBilling = async () => {
    setIsManaging(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-portal');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Could not generate billing portal link');
      }
    } catch (err: any) {
      setError(err.message);
      setIsManaging(false);
    }
  };

  const handleDecommission = async () => {
    if (!window.confirm(t('Cancel_Confirm') || 'Are you sure you want to decommission this plan?')) return;
    
    setIsDecommissioning(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-cancel');
      if (error) throw error;
      
      await refreshProfile();
      setSubscription((prev: Subscription | null) => prev ? ({ ...prev, status: 'canceled', cancel_at_period_end: true }) : null);
      alert(t('Cancel_Success') || 'Plan decommissioned successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDecommissioning(false);
    }
  };

  const getTierFeatures = (tier: string = 'free') => {
    switch (tier.toLowerCase()) {
      case 'pro':
        return ['UNLIMITED_SIMS', 'ELITE_ORACLE_OPUS', 'CUSTOM_NODES', 'BETA_ACCESS', 'PRIORITY_SUPPORT'];
      case 'plus':
        return ['100_SIMS_MONTH', 'ADVANCED_ORACLE', 'BETA_ACCESS', 'STANDARD_SUPPORT'];
      default:
        return ['10_SIMS_MONTH', 'BASIC_ORACLE', 'LIMIT_3_PORTFOLIOS'];
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg md:text-xl font-bold text-white uppercase font-mono tracking-tight">{t('Subscription_Ledger')}</h2>
          {error && <span className="text-[10px] text-[#FF453A] font-mono uppercase font-bold">{error}</span>}
       </div>
       
       <GlassCard className="p-6 md:p-8 overflow-hidden relative" intensity="low">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D9FF]/5 rounded-full blur-[80px] -mr-32 -mt-32" />
          
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start relative z-10">
             <div className="flex-1 space-y-6 w-full">
                <div>
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#00D9FF] font-mono">Current_Phase</span>
                      {subscription?.status === 'canceled' && (
                        <span className="px-2 py-0.5 bg-[#FF453A]/20 text-[#FF453A] text-[8px] font-bold rounded uppercase font-mono">Decommissioned</span>
                      )}
                   </div>
                   <h3 className="text-2xl md:text-3xl font-bold text-white uppercase font-mono mt-1">
                      {profile?.tier ? `${profile.tier.toUpperCase()}_TIER_NODE` : 'FREE_TIER_NODE'}
                   </h3>
                   <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                       <p className="text-[#848D97] text-[10px] font-mono uppercase tracking-widest">
                          {t('Subscription_Status')}: <span className="text-white">{subscription?.status?.toUpperCase() || 'ACTIVE'}</span>
                       </p>
                       {subscription?.current_period_end && (
                        <p className="text-[#848D97] text-[10px] font-mono uppercase tracking-widest sm:border-l sm:border-white/10 sm:pl-4">
                           {t('Next_Billing_Cycle')}: <span className="text-white">{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                        </p>
                       )}
                   </div>
                </div>
                
                 <div className="flex flex-wrap gap-2 md:gap-4">
                   {getTierFeatures(profile?.tier).map(feature => (
                     <div key={feature} className="px-3 md:px-4 py-2 bg-white/5 rounded-lg border border-white/5 text-[8px] md:text-[9px] font-bold text-white uppercase tracking-widest font-mono whitespace-nowrap">
                        {feature.replace(/_/g, ' ')}
                     </div>
                   ))}
                </div>
             </div>

             <div className="w-full lg:w-64 space-y-3 md:space-y-4">
                <button 
                   disabled={isManaging || !subscription?.paystack_subscription_code}
                   onClick={handleManageBilling}
                   className="w-full bg-white/5 border border-white/10 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all font-mono disabled:opacity-50"
                 >
                   {isManaging ? 'Initializing_Portal...' : t('Manage_Billing_Session')}
                </button>
                {subscription?.status !== 'canceled' && profile?.tier !== 'free' && (
                  <button 
                    disabled={isDecommissioning}
                    onClick={handleDecommission}
                    className="w-full bg-transparent border border-[#FF453A]/30 text-[#FF453A] py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#FF453A]/5 transition-all disabled:opacity-50"
                  >
                    {isDecommissioning ? 'Decommissioning...' : t('Decommission_Plan')}
                  </button>
                )}
             </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
             <div className="flex items-start gap-3 text-[#848D97]">
                <AlertCircle size={14} className="text-[#00D9FF] shrink-0 mt-0.5" />
                <p className="text-[10px] uppercase font-bold tracking-widest font-mono leading-relaxed">
                   Institutional_Policy::The Web Terminal is the authoritative node for all subscription management. Mobile access is restricted to secure credit card payments.
                </p>
             </div>
          </div>
       </GlassCard>

       {profile?.tier === 'free' && (
         <GlassCard className="p-4 md:p-6 border-[#00D9FF]/30 bg-[#00D9FF]/5" intensity="low">
           <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-4 w-full">
               <div className="w-10 h-10 rounded-full bg-[#00D9FF]/20 flex items-center justify-center shrink-0">
                 <Zap className="text-[#00D9FF]" size={20} />
               </div>
               <div>
                 <h4 className="text-sm font-bold text-white uppercase font-mono">Upgrade to Institutional Pro</h4>
                 <p className="text-[10px] text-[#848D97] font-mono mt-1">Unlock unlimited simulations, real-time risk surfaces, and elite cognitive models.</p>
               </div>
             </div>
             <button 
               onClick={() => router.push('/dashboard/subscription')}
               className="bg-[#00D9FF] text-[#05070A] h-10 px-6 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#00D9FF]/90 transition-all w-full sm:w-auto"
             >
               Initialize_Upgrade
             </button>
           </div>
         </GlassCard>
       )}
    </div>
  );
}
