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
  Globe,
  Trash2,
  Info,
  HelpCircle,
  LifeBuoy,
  ChevronDown
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { DeletionWizard } from '@/components/ui/DeletionWizard';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

import { useUser } from '@/components/UserContext';
import { useTranslation } from '@/lib/i18n';
import { logSecurityEvent } from '@/lib/security/audit';

type Tab = 'profile' | 'security' | 'ai' | 'billing' | 'about' | 'how-to-use' | 'support';

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
    if (tabParam && ['profile', 'security', 'ai', 'billing', 'about', 'how-to-use', 'support'].includes(tabParam)) {
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
    { id: 'about', label: t('About_Protocol'), icon: Info },
    { id: 'how-to-use', label: t('Operational_Manual'), icon: HelpCircle },
    { id: 'support', label: t('Institutional_Uplink'), icon: LifeBuoy },
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
            <span className="text-[10px] font-bold text-[#848D97] uppercase tracking-[0.3em] font-mono">{t('System_Config_v1')}</span>
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
            {activeTab === 'about' && <AboutSection />}
            {activeTab === 'how-to-use' && <HowToUseSection />}
            {activeTab === 'support' && <SupportSection />}
            
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

function AboutSection() {
  const { profile } = useUser();
  const t = useTranslation(profile?.interface_language || 'ENGLISH_INTL');

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg md:text-xl font-bold text-white uppercase font-mono tracking-tight">{t('About_Protocol')}</h2>
      </div>

      <GlassCard className="p-6 md:p-10 space-y-8 relative overflow-hidden" intensity="low">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D9FF]/5 rounded-full blur-[100px] -mr-48 -mt-48" />
        
        <div className="space-y-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#00D9FF]/10 flex items-center justify-center border border-[#00D9FF]/20 shadow-[0_0_20px_rgba(0,217,255,0.1)]">
              <Info className="text-[#00D9FF]" size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg uppercase font-mono tracking-wider">QUANTMIND_OS v1.0.4</h3>
              <p className="text-[#848D97] text-[10px] font-mono uppercase tracking-[0.2em]">{t('Operational_Status_Stable')}</p>
            </div>
          </div>

          <div className="space-y-4 max-w-3xl">
            <p className="text-sm md:text-base text-white/90 leading-relaxed font-mono uppercase">
              {t('QuantMind_Description_1', { defaultValue: "QuantMind is a high-fidelity portfolio risk analysis and simulation platform. It enables investors to run institutional-grade Monte Carlo simulations on their portfolios, visualize potential tail risks, and receive AI-driven insights via the 'Portfolio Doctor' assistant." })}
            </p>
            <p className="text-sm text-[#848D97] leading-relaxed font-mono uppercase">
              {t('QuantMind_Description_2', { defaultValue: "Our mission is to provide institutional-grade tools to every investor through advanced data orchestration and AI. By merging probability with modern investing, we empower users to navigate complex market environments with clarity." })}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {[
              { label: 'CORE_ENGINE', value: 'RUST_PYTHON_HYBRID' },
              { label: 'SECURITY_LAYER', value: 'AES_256_E2EE' },
              { label: 'AI_ORCHESTRATOR', value: 'ASTERIX_NODE' }
            ].map((stat) => (
              <div key={stat.label} className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[8px] font-bold text-[#848D97] uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-[10px] font-bold text-white font-mono">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function HowToUseSection() {
  const { profile } = useUser();
  const t = useTranslation(profile?.interface_language || 'ENGLISH_INTL');

  const steps = [
    { title: 'INITIALIZE_PROFILE', desc: 'Configure your identity and preferences (Language, Region) to optimize the terminal experience.' },
    { title: 'CALIBRATE_AI', desc: 'Select your Cognitive Persona and tune the AI engine to match your investment style.' },
    { title: 'CONSTRUCT_PORTFOLIO', desc: 'Use the Portfolio Builder to input or sync your assets for analysis.' },
    { title: 'RUN_SIMULATIONS', desc: 'Trigger Monte Carlo kernels to project 10,000+ paths and identify tail risks.' },
    { title: 'CONSULT_DOCTOR', desc: 'Engage with the Portfolio Doctor for deep-dive analysis and optimization strategies.' }
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg md:text-xl font-bold text-white uppercase font-mono tracking-tight">{t('Operational_Manual')}</h2>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <GlassCard key={step.title} className="p-6 group hover:border-[#00D9FF]/30 transition-all duration-500" intensity="low">
            <div className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 font-mono text-[#00D9FF] font-bold shadow-inner">
                0{index + 1}
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-bold text-sm uppercase font-mono tracking-wider group-hover:text-[#00D9FF] transition-colors">{step.title}</h3>
                <p className="text-xs text-[#848D97] leading-relaxed font-mono uppercase">{step.desc}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function SupportSection() {
  const { profile } = useUser();
  const t = useTranslation(profile?.interface_language || 'ENGLISH_INTL');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('support@quantmind.co.ke');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg md:text-xl font-bold text-white uppercase font-mono tracking-tight">{t('Institutional_Uplink')}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <GlassCard className="p-8 md:p-10 space-y-8 relative overflow-hidden" intensity="high">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#00D9FF]/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#00D9FF]/20 flex items-center justify-center border border-[#00D9FF]/40 shadow-[0_0_30px_rgba(0,217,255,0.2)]">
                <LifeBuoy className="text-[#00D9FF] animate-spin-slow" size={28} />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl uppercase font-mono tracking-tight text-glow">SUPPORT_BRIDGE_ACTIVE</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#32D74B] animate-pulse" />
                  <p className="text-[#32D74B] text-[9px] font-bold font-mono uppercase tracking-widest">{t('All_Systems_Nominal')}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#848D97] leading-relaxed font-mono uppercase max-w-md">
              {t('Support_Desc', { defaultValue: "Connect directly to our institutional support kernels. Our AI-augmented response teams are standing by for parameters calibration and terminal assistance." })}
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-[#05070A] border border-white/10 rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <Mail className="text-[#848D97] group-hover:text-[#00D9FF] transition-colors" size={18} />
                  <span className="text-sm font-mono text-white tracking-wider">support@quantmind.co.ke</span>
                </div>
                <button 
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold text-[#848D97] hover:text-white uppercase tracking-widest transition-all font-mono border border-white/5"
                >
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              </div>

              <a 
                href="mailto:support@quantmind.co.ke"
                className="w-full h-14 flex items-center justify-center bg-[#00D9FF] text-[#05070A] rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#00D9FF]/90 transition-all font-mono shadow-[0_4px_20px_rgba(0,217,255,0.4)]"
              >
                INITIALIZE_UPLINK
              </a>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="p-6 md:p-8 space-y-6" intensity="low">
             <div className="flex items-center gap-3">
                <ShieldCheck className="text-[#00D9FF]" size={20} />
                <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white">SECURE_COMMUNICATION</h3>
             </div>
             <p className="text-[11px] text-[#848D97] leading-relaxed uppercase font-mono">
                {t('Security_Notice', { defaultValue: "All communications across the support bridge are protected by military-grade AES-256 encryption. Your data integrity is our priority." })}
             </p>
          </GlassCard>

          <GlassCard className="p-6 md:p-8 space-y-6" intensity="low">
             <div className="flex items-center gap-3">
                <Zap className="text-[#FFD60A]" size={20} />
                <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white">RESPONSE_LATENCY</h3>
             </div>
             <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono tracking-widest uppercase">
                   <span className="text-[#848D97]">ESTIMATED_RESPONSE</span>
                   <span className="text-white">&lt; 4 HOURS</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                   <div className="w-[85%] h-full bg-[#32D74B] opacity-50" />
                </div>
             </div>
          </GlassCard>
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
                     {t('Next_Change', { date: nextAllowedChange.toLocaleDateString() })}
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
                 <p className="text-[10px] font-bold text-[#FF453A] uppercase font-mono tracking-widest">{t('Credential_Change_Restriction_Active')}</p>
                 <p className="text-[10px] text-[#FF453A]/80 uppercase font-mono leading-relaxed">
                    {t('Credential_Change_Policy_Desc', { date: nextAllowedChange.toLocaleDateString() })}
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
                <p className="text-[#848D97] text-sm font-mono mt-1 uppercase tracking-widest">{t('Tier_Level')}::{t('Tier_Node', { tier: initialProfile?.tier?.toUpperCase() || 'FREE' })}</p>
                <p className="text-[#848D97] text-[10px] md:text-xs font-mono mt-1">{t('UID')}: {initialProfile?.id?.substring(0, 16).toUpperCase()}...</p>
             </div>
          </GlassCard>

          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label htmlFor="profile-first-name" className="text-[10px] font-bold text-[#848D97] uppercase tracking-widest font-mono">{t('First_Name')}</label>
                  <input 
                    id="profile-first-name"
                    type="text" 
                    value={firstName}
                    disabled={isLocked}
                    onChange={(e) => setFirstName(e.target.value)}
                    title={t('First_Name')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono disabled:opacity-40" 
                  />
               </div>
               <div className="space-y-1">
                  <label htmlFor="profile-last-name" className="text-[10px] font-bold text-[#848D97] uppercase tracking-widest font-mono">{t('Last_Name')}</label>
                  <input 
                    id="profile-last-name"
                    type="text" 
                    value={lastName}
                    disabled={isLocked}
                    onChange={(e) => setLastName(e.target.value)}
                    title={t('Last_Name')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono disabled:opacity-40" 
                  />
               </div>
             </div>
             <div className="space-y-1">
                <label htmlFor="profile-email-static" className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">{t('Primary_Contact')}</label>
                <input 
                  id="profile-email-static"
                  type="text" 
                  value={initialProfile?.email || 'N/A'} 
                  disabled
                  title={t('Primary_Contact')}
                  className="w-full bg-[#05070A] border border-white/5 rounded-xl py-3 px-4 text-white/40 text-sm font-mono opacity-60" 
                />
             </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-1">
                <label htmlFor="profile-phone" className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">{t('Phone_Anchor')}</label>
                <input 
                  id="profile-phone"
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  title={t('Phone_Anchor')}
                  className="w-full bg-[#12121A] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono" 
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label htmlFor="profile-region" className="text-[10px] font-bold text-[#848D97] uppercase tracking-widest font-mono">{t('Deployment_Region')}</label>
                  <select 
                    id="profile-region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    disabled={isLocked}
                    title={t('Deployment_Region')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono appearance-none"
                  >
                     <option value="us_east">US_EAST_NY</option>
                     <option value="eu_west">EU_WEST_LDN</option>
                     <option value="ap_south">AP_SOUTH_SIN</option>
                  </select>
               </div>
               <div className="space-y-1">
                  <label htmlFor="profile-language" className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] mb-2 block">{t('Interface_Language')}</label>
                  <select 
                    id="profile-language"
                    value={interfaceLanguage}
                    onChange={(e) => setInterfaceLanguage(e.target.value)}
                    title={t('Interface_Language')}
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
  const { profile, refreshProfile } = useUser();
  const t = useTranslation(profile?.interface_language || 'ENGLISH_INTL');
  const supabase = createClient();
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      await refreshProfile();
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
       await refreshProfile();
       fetchMfaStatus();
       setMessage({ type: 'success', text: t('MFA_Deactivated') });
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
      await refreshProfile();
      setMessage({ type: 'success', text: newState ? t('Email_MFA_Enabled') : t('Email_MFA_Disabled') });
    } catch (err: any) {
      setMessage({ type: 'error', text: t('Error_Sync') });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEnrollPasskey = async () => {
    setMessage(null);
    try {
      const { data, error } = await (supabase.auth as any).addPasskey({
        name: `QuantMind_Node_${profile?.id?.substring(0, 4)}`
      });
      
      if (error) throw error;
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ mfa_passkey_enabled: true })
        .eq('id', profile?.id);

      if (profileError) throw profileError;
      
      await refreshProfile();
      setMessage({ type: 'success', text: t('Passkey_Enrolled') });
      fetchMfaStatus();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: t('Passkey_Setup_Failed') });
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
                   {t('MFA_Method_App_Desc')}
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
                   {t('MFA_Method_Email_Desc')}
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
                   {t('MFA_Method_Passkey_Desc')}
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
                   {profile?.mfa_passkey_enabled ? t('Passkey_Stored') : t('MFA_Action_Setup')}
                </button>
             </div>
          </GlassCard>

          {/* Reset Credentials Card */}
           <GlassCard className={cn("p-6 md:p-8 space-y-6 sm:col-span-2 lg:col-span-3", isLocked && "opacity-80")} intensity="low">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                    <Settings className={isLocked ? "text-[#848D97]" : "text-[#FFD60A]"} size={20} />
                    <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white">{t('Access_Credentials_Node')}</h3>
                 </div>
                 <p className="text-[9px] text-[#848D97] uppercase font-mono tracking-widest">
                    {t('AES_Encryption_Notice')}
                 </p>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-8 justify-between p-6 bg-white/5 rounded-2xl border border-white/5 relative">
                 {isLocked && (
                    <div className="absolute inset-x-0 -top-2 flex justify-center">
                       <span className="bg-[#FF453A] text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">{t('Restricted_Protocol_Lock')}</span>
                    </div>
                 )}
                 <p className="text-[11px] text-[#848D97] leading-relaxed uppercase font-mono max-w-xl">
                    {t('Credential_Reset_Desc')} <span className="text-[#FF453A]/80 font-bold">{isLocked ? `${t('Next_Change')}: ${nextAllowedChange.toLocaleDateString()}` : ''}</span>
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

        {/* Danger Zone */}
        <div className="mt-12 pt-12 border-t border-[#FF453A]/20">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-[#FF453A]/5 border border-[#FF453A]/10 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF453A]/30 to-transparent" />
              <div className="space-y-2 text-center md:text-left">
                 <h3 className="text-xs font-bold text-[#FF453A] uppercase font-mono tracking-[0.2em]">{t('Purge_Protocol_Node')}</h3>
                 <p className="text-[11px] text-[#848D97] uppercase font-mono leading-relaxed max-w-lg">
                    {t('Irreversible_Termination_Desc')}
                 </p>
              </div>
              <button 
                onClick={() => setIsDeleting(true)}
                className="whitespace-nowrap px-8 py-3 bg-transparent border border-[#FF453A]/30 text-[#FF453A] hover:bg-[#FF453A] hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono"
              >
                 {t('Terminate_Account')}
              </button>
           </div>
        </div>

        <DeletionWizard 
          isOpen={isDeleting} 
          onClose={() => setIsDeleting(false)} 
          userEmail={profile?.email || ''} 
        />

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
                        alt={t('MFA_QR_Code_Alt')} 
                        className="w-48 h-48"
                      />
                   </div>
                   <div className="text-center space-y-3 bg-white/5 p-4 rounded-xl border border-white/10 w-full">
                      <p className="text-[9px] text-[#848D97] uppercase font-bold tracking-[0.2em] font-mono">{t('Secure_Recovery_Key')}</p>
                      <code className="text-[#00D9FF] font-mono text-sm font-bold tracking-[0.3em] block">{enrollmentData.totp.secret}</code>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label htmlFor="mfa-verify-code" className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] block text-center font-mono">{t('MFA_Verify_Prompt')}</label>
                      <input 
                        id="mfa-verify-code"
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
          <h2 className="text-lg md:text-xl font-bold text-white uppercase font-mono tracking-tight">{t('Cognitive_Persona_Matrix')}</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {profile?.tier === 'pro' && (
               <span className="text-[9px] font-bold text-[#00D9FF] border border-[#00D9FF]/30 px-3 py-1 rounded-full uppercase tracking-widest bg-[#00D9FF]/5 text-center">{t('Institutional_Pro_Node')}</span>
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
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#848D97] uppercase tracking-widest font-mono">{t('Cognitive_Bandwidth')}</span>
                <span className="text-[10px] font-bold text-white font-mono">{Math.round(quotaPercent)}%</span>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                   <span className="text-[#848D97]">{t('Daily_Allocation')}</span>
                   <span className="text-white" title={`${quotaUsed} / ${quotaLimit}`}>{t('Messages_Count', { used: quotaUsed, limit: quotaLimit })}</span>
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
                <p className="text-[11px] text-[#848D97] leading-relaxed uppercase font-mono">
                 {t('Bandwidth_Usage_Desc')}
              </p>
             </div>
          </GlassCard>

          {/* Persona Settings */}
          <GlassCard className="p-6 md:p-8 space-y-6" intensity="low">
             <div className="flex items-center gap-3">
                <User className="text-[#00D9FF]" size={20} />
                <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white">{t('Oracle_Personality')}</h3>
             </div>
             <div className="space-y-4">
                <div className="space-y-1">
                 <label htmlFor="persona-selection" className="text-[10px] font-bold text-[#848D97] uppercase tracking-widest font-mono">{t('Oracle_Personality')}</label>
                 <select 
                   id="persona-selection"
                   value={persona}
                   onChange={(e) => setPersona(e.target.value)}
                   title={t('Oracle_Personality')}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono appearance-none"
                 >
                    <option value="balanced">{t('Persona_Balanced')}</option>
                    <option value="analytical">{t('Persona_Analytical')}</option>
                    <option value="aggressive">{t('Persona_Aggressive')}</option>
                 </select>
              </div>
                
                <div className="space-y-2">
                    <label htmlFor="risk-sensitivity-select" className="text-[9px] uppercase font-bold text-[#848D97] font-mono tracking-widest ml-1">{t('Risk_Sensitivity_Label')}</label>
                    <select 
                      id="risk-sensitivity-select"
                      value={sensitivity}
                      onChange={(e) => setSensitivity(e.target.value)}
                      title={t('Risk_Sensitivity_Label')}
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
                        <p className="text-[11px] text-[#848D97] leading-relaxed uppercase font-mono">
                           {t('Pro_Node_Integration_Desc')}
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
                   <h4 className="text-[10px] font-bold text-white uppercase font-mono tracking-widest">{t('Secure_Cognitive_Configuration')}</h4>
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
                    <label htmlFor="relay-provider" className="text-[9px] uppercase font-bold text-[#848D97] font-mono tracking-widest ml-1">{t('Relay_Provider')}</label>
                    <select 
                      id="relay-provider"
                      value={activeConfig?.provider || newConfig.provider}
                      onChange={(e) => setNewConfig({ ...newConfig, provider: e.target.value })}
                      title={t('Relay_Provider')}
                      className="w-full bg-[#05070A] border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono appearance-none"
                    >
                       <option value="google">Google_Gemini</option>
                       <option value="openai">OpenAI_GPT</option>
                       <option value="anthropic">Anthropic_Claude</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label htmlFor="model-id" className="text-[9px] uppercase font-bold text-[#848D97] font-mono tracking-widest ml-1">{t('Model_Identifier')}</label>
                    <input 
                      id="model-id"
                      type="text" 
                      placeholder="e.g. gemini-2.5-flash"
                      value={newConfig.model_id}
                      onChange={(e) => setNewConfig({ ...newConfig, model_id: e.target.value })}
                      title={t('Model_Identifier')}
                      className="w-full bg-[#05070A] border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="api-key" className="text-[9px] uppercase font-bold text-[#848D97] font-mono tracking-widest ml-1">{t('Secure_API_Key')}</label>
                    <div className="relative">
                       <input 
                         id="api-key"
                         type="password" 
                         placeholder="••••••••••••••••"
                         value={newConfig.api_key}
                         onChange={(e) => setNewConfig({ ...newConfig, api_key: e.target.value })}
                         title={t('Secure_API_Key')}
                         className="w-full bg-[#05070A] border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono pr-10"
                       />
                       <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                    </div>
                </div>
             </div>

             <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20">
                <p className="text-[9px] text-[#848D97] font-mono uppercase max-w-md leading-relaxed">
                   {t('AES_Encryption_Notice')}
                </p>
                <button 
                  disabled={isSaving || profile?.tier !== 'pro'}
                  onClick={handleSaveConfig}
                  className="bg-[#00D9FF] text-[#05070A] px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00D9FF]/90 transition-all disabled:opacity-50 w-full md:w-auto"
                >
                   {isSaving ? t('Synchronizing') : t('Initialize_Node')}
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
  const searchParams = useSearchParams();
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);
  const [isDecommissioning, setIsDecommissioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAttemptedPlan, setLastAttemptedPlan] = useState<string | null>(null);

  useEffect(() => {
    const savedPlan = localStorage.getItem('last_attempted_plan');
    if (savedPlan) setLastAttemptedPlan(savedPlan);
  }, []);

  useEffect(() => {
    const status = searchParams.get('status');
    const ref = searchParams.get('ref');
    
    if (status === 'success') {
      setError(null);
      // Small delay to ensure profile has synced via webhook
      setTimeout(() => refreshProfile(), 2000);
    } else if (status === 'failed') {
      setError(t('TRANSACTION_FAILED_BY_GATEWAY'));
    } else if (status === 'error') {
      setError(searchParams.get('message') || t('TRANSACTION_TERMINATED'));
    }
  }, [searchParams]);

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
        throw new Error(t('Billing_Portal_Error'));
      }
    } catch (err: any) {
      setError(err.message);
      setIsManaging(false);
    }
  };

  const handleDecommission = async () => {
    if (!window.confirm(t('Cancel_Confirm'))) return;
    
    setIsDecommissioning(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-cancel');
      if (error) throw error;
      
      await refreshProfile();
      setSubscription((prev: Subscription | null) => prev ? ({ ...prev, status: 'canceled', cancel_at_period_end: true }) : null);
      alert(t('Cancel_Success'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDecommissioning(false);
    }
  };

  const handleRetry = () => {
    if (lastAttemptedPlan) {
      router.push(`/dashboard/subscription?plan=${lastAttemptedPlan.toLowerCase()}`);
    } else {
      router.push('/dashboard/subscription');
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
          {searchParams.get('status') === 'success' && (
            <span className="text-[10px] text-[#32D74B] font-mono uppercase font-bold animate-pulse">
              {t('Success_Sync')}
            </span>
          )}
          {error && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#FF453A] font-mono uppercase font-bold">{error}</span>
              <button 
                onClick={handleRetry}
                className="px-2 py-0.5 bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] text-[8px] font-bold rounded uppercase font-mono hover:bg-[#00D9FF]/20 transition-all"
              >
                {t('Retry_Initialization')}
              </button>
            </div>
          )}
       </div>
       
       <GlassCard className="p-6 md:p-8 overflow-hidden relative" intensity="low">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D9FF]/5 rounded-full blur-[80px] -mr-32 -mt-32" />
          
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start relative z-10">
             <div className="flex-1 space-y-6 w-full">
                <div>
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#00D9FF] font-mono">{t('Current_Phase')}</span>
                      {subscription?.status === 'canceled' && (
                        <span className="px-2 py-0.5 bg-[#FF453A]/20 text-[#FF453A] text-[8px] font-bold rounded uppercase font-mono">{t('Decommissioned')}</span>
                      )}
                   </div>
                   <h3 className="text-2xl md:text-3xl font-bold text-white uppercase font-mono mt-1">
                      {profile?.tier ? t('Tier_Node_Label', { tier: profile.tier.toUpperCase() }) : t('Free_Tier_Node')}
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
                   {isManaging ? t('Initializing_Portal') : t('Billing_Action_Manage')}
                </button>
                {subscription?.status !== 'canceled' && profile?.tier !== 'free' && (
                  <button 
                    disabled={isDecommissioning}
                    onClick={handleDecommission}
                    className="w-full bg-transparent border border-[#FF453A]/30 text-[#FF453A] py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#FF453A]/5 transition-all disabled:opacity-50"
                  >
                    {isDecommissioning ? t('Decommissioning') : t('Decommission_Plan')}
                  </button>
                )}
             </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
             <div className="bg-[#12121A] border border-white/5 p-4 rounded-xl">
                <p className="text-[9px] text-[#848D97] leading-relaxed uppercase font-mono italic text-center">
                   {t('Billing_Policy_Notice')}
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
                  <h4 className="text-sm font-bold text-white uppercase font-mono">{t('Upgrade_Title')}</h4>
                  <p className="text-[10px] text-[#848D97] font-mono mt-1">{t('Upgrade_Desc')}</p>
                </div>
             </div>
              <button 
                onClick={() => router.push('/dashboard/subscription')}
                className="bg-[#00D9FF] text-[#05070A] h-10 px-6 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#00D9FF]/90 transition-all w-full sm:w-auto"
              >
                {t('Initialize_Upgrade')}
              </button>
           </div>
         </GlassCard>
       )}
    </div>
  );
}
