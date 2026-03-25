'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/components/UserContext';
import { useTranslation } from '@/lib/i18n';
import { GlassCard } from './ui/GlassCard';
import { Shield, Mail, Smartphone, Zap, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MfaGuardian({ children }: { children: React.ReactNode }) {
  const { profile, loading: profileLoading } = useUser();
  const t = useTranslation(profile?.interface_language || 'ENGLISH_INTL');
  const supabase = createClient();
  
  const [aal, setAal] = useState<'aal1' | 'aal2' | null>(null);
  const [factors, setFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Custom Email OTP state
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  useEffect(() => {
    checkAal();
  }, [profile]);

  async function checkAal() {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) return;

    setAal(data.currentLevel as any);
    
    if (data.currentLevel === 'aal1' && data.nextLevel === 'aal2') {
      const factorsRes = await supabase.auth.mfa.listFactors();
      if (factorsRes.data) {
        setFactors(factorsRes.data.all.filter(f => f.status === 'verified'));
      }
    }
    setLoading(false);
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const handleVerifyTotp = async (factorId: string) => {
    setIsVerifying(true);
    setError(null);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verificationCode
      });
      if (verify.error) throw verify.error;
      
      setAal('aal2');
    } catch (err: any) {
      setError(t('Verification_Error'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEmailOtpChallenge = async () => {
    if (!profile?.email) return;
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: profile.email,
        options: {
          shouldCreateUser: false,
        }
      });
      if (error) throw error;
      setEmailOtpSent(true);
    } catch (err: any) {
      setError('OTP_DISPATCH_FAILURE');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
     if (!profile?.email) return;
     setIsVerifying(true);
     try {
       const { error } = await supabase.auth.verifyOtp({
         email: profile.email,
         token: verificationCode,
         type: 'email'
       });
       if (error) throw error;
       setAal('aal2');
     } catch (err: any) {
       setError(t('Verification_Error'));
     } finally {
       setIsVerifying(false);
     }
  };

  const handlePasskeyVerification = async () => {
    setIsVerifying(true);
    try {
      const { error } = await (supabase.auth as any).signInWithPasskey();
      if (error) throw error;
      setAal('aal2');
    } catch (err: any) {
      setError('PASSKEY_AUTH_FAILED');
    } finally {
      setIsVerifying(false);
    }
  };

  // If user has NO MFA enabled, or is already AAL2, let them through
  const mfaRequired = (factors.length > 0 || profile?.mfa_email_enabled || profile?.mfa_passkey_enabled) && aal === 'aal1';

  if (profileLoading || loading) return null;

  if (mfaRequired) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#05070A] flex items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00D9FF]/5 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#32D74B]/5 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        <GlassCard className="w-full max-w-lg p-12 space-y-10 border-[#00D9FF]/20 relative z-10" intensity="high">
           <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 mb-4">
                 <Shield className="text-[#00D9FF] animate-pulse" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-white uppercase font-mono tracking-tight">{t('MFA_Selection_Title')}</h1>
              <p className="text-[#848D97] text-xs font-mono uppercase tracking-widest leading-relaxed">
                 {t('MFA_Selection_Desc')}
              </p>
           </div>

           {error && (
             <div className="p-4 bg-[#FF453A]/10 border border-[#FF453A]/20 rounded-xl text-center">
                <span className="text-[10px] font-bold text-[#FF453A] uppercase font-mono tracking-widest">{error}</span>
             </div>
           )}

           <div className="space-y-4">
              {/* Factor Selection List */}
              {!emailOtpSent && (
                <div className="grid grid-cols-1 gap-3">
                   {factors.map(f => (
                      <button 
                        key={f.id}
                        disabled={isVerifying}
                        onClick={() => { /* This would trigger an input field or direct challenge */ }}
                        className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#00D9FF]/10 hover:border-[#00D9FF]/30 transition-all group"
                      >
                         <div className="flex items-center gap-4">
                            <Smartphone className="text-[#848D97] group-hover:text-[#00D9FF]" size={20} />
                            <div className="text-left">
                               <p className="text-[10px] font-bold text-white uppercase tracking-widest">{t('MFA_Method_App')}</p>
                               <p className="text-[9px] text-[#848D97] font-mono uppercase mt-0.5">TOTP_PROTOCOL_NODE</p>
                            </div>
                         </div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); /* Logic for specific factor if multiple */ }} 
                           className="text-[9px] font-bold text-[#00D9FF] uppercase tracking-widest"
                         >Select</button>
                      </button>
                   ))}

                   {profile?.mfa_email_enabled && (
                      <button 
                        disabled={isVerifying}
                        onClick={handleEmailOtpChallenge}
                        className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#00D9FF]/10 hover:border-[#00D9FF]/30 transition-all group"
                      >
                         <div className="flex items-center gap-4">
                            <Mail className="text-[#848D97] group-hover:text-[#00D9FF]" size={20} />
                            <div className="text-left">
                               <p className="text-[10px] font-bold text-white uppercase tracking-widest">{t('MFA_Method_Email')}</p>
                               <p className="text-[9px] text-[#848D97] font-mono uppercase mt-0.5">{profile.email}</p>
                            </div>
                         </div>
                         <Zap className="text-[#00D9FF] opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
                      </button>
                   )}

                   {profile?.mfa_passkey_enabled && (
                      <button 
                        disabled={isVerifying}
                        onClick={handlePasskeyVerification}
                        className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#32D74B]/10 hover:border-[#32D74B]/30 transition-all group"
                      >
                         <div className="flex items-center gap-4">
                            <Zap className="text-[#848D97] group-hover:text-[#32D74B]" size={20} />
                            <div className="text-left">
                               <p className="text-[10px] font-bold text-white uppercase tracking-widest">{t('MFA_Method_Passkey')}</p>
                               <p className="text-[9px] text-[#848D97] font-mono uppercase mt-0.5">WEBAUTHN_SECURE_ENCLAVE</p>
                            </div>
                         </div>
                         <Shield className="text-[#32D74B] opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
                      </button>
                   )}
                </div>
              )}

              {/* OTP Input for App/Email */}
              {(factors.length > 0 || emailOtpSent) && (
                 <div className="space-y-6 pt-6">
                    <div className="space-y-3">
                       <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97] block text-center font-mono">
                          {emailOtpSent ? 'Enter_Email_OTP' : t('MFA_Verify_Prompt')}
                       </label>
                       <input 
                         type="text" 
                         maxLength={6}
                         value={verificationCode}
                         onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                         placeholder="000 000"
                         className="w-full bg-[#12121A] border border-white/10 rounded-2xl py-5 text-center text-white text-3xl tracking-[0.8em] focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono"
                       />
                    </div>
                    <button 
                      onClick={emailOtpSent ? handleVerifyEmailOtp : () => handleVerifyTotp(factors[0].id)}
                      disabled={isVerifying || verificationCode.length < 6}
                      className="w-full bg-[#00D9FF] text-[#05070A] py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00D9FF]/90 transition-all shadow-[0_4px_15px_rgba(0,217,255,0.3)] disabled:opacity-50"
                    >
                       {isVerifying ? 'Verifying_Node...' : 'Authorize_Session'}
                    </button>
                    {emailOtpSent && (
                       <button 
                         onClick={() => setEmailOtpSent(false)} 
                         className="w-full text-[9px] text-[#848D97] uppercase font-mono hover:text-white transition-colors"
                       >
                          Back_to_Methods
                       </button>
                    )}
                 </div>
              )}
           </div>

           <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
              <button 
                 onClick={handleSignOut}
                 className="flex items-center gap-3 text-[#FF453A] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-all font-mono"
              >
                 <LogOut size={14} />
                 Terminate_Secure_Session
              </button>
              <p className="text-[9px] text-[#848D97] font-mono uppercase text-center leading-relaxed">
                 Institutional security protocols require AAL2 assurance for dashboard access. Your session is currently restricted to AAL1.
              </p>
           </div>
        </GlassCard>
      </div>
    );
  }

  return <>{children}</>;
}
