'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { Eye, EyeOff, ShieldCheck, AlertCircle, Lock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [lastChangeAt, setLastChangeAt] = useState<Date | null>(null);
  const t = useTranslation();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes
  const RESTRICTION_PERIOD = 30 * 24 * 60 * 60 * 1000; // 30 days

  const nextAllowedChange = lastChangeAt ? new Date(lastChangeAt.getTime() + RESTRICTION_PERIOD) : null;
  const isLocked = nextAllowedChange ? new Date() < nextAllowedChange : false;

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError(t('AUTH_SESSION_EXPIRED'));
        return;
      }

      const initiationTime = searchParams.get('t');
      const isExpired = initiationTime && (Date.now() - parseInt(initiationTime) > EXPIRATION_TIME);

      if (isExpired) {
        setError(t('AUTH_RESET_EXPIRED'));
        setSessionActive(false);
        return;
      }

      // Fetch last credential change from profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('last_credential_change_at')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Core_Metadata_Fetch_Failure', profileError);
      } else if (profile?.last_credential_change_at) {
        setLastChangeAt(new Date(profile.last_credential_change_at));
      }

      setSessionActive(true);
    };
    checkSession();
  }, [supabase, searchParams, t]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setError(null);

    // 1. Validation (Section 3.5)
    if (password !== confirmPassword) {
      setError(t('AUTH_CIPHER_MISMATCH'));
      return;
    }

    if (password.length < 12) {
      setError(t('AUTH_ENTROPY_FAILURE'));
      return;
    }

    // Complexity check: mixed case, number, special char
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setError(t('AUTH_COMPLEXITY_FAILURE'));
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        // Handle database trigger exception
        if (updateError.message?.includes('CREDENTIAL_CHANGE_RESTRICTED')) {
          throw new Error(t('AUTH_SECURITY_RESTRICTION', { date: nextAllowedChange?.toLocaleDateString() || '' }));
        }
        throw updateError;
      }

      setSuccess(true);
      setIsLoading(false);
      
      // Give them 3 seconds to read the success message
      setTimeout(() => {
        router.push('/auth/login?status=password_reset_success');
      }, 3000);
    } catch (err: any) {
      setError(err.message || t('AUTH_CIPHER_UPDATE_FAILED'));
      setIsLoading(false);
    }
  };

  if (!sessionActive && !isLoading && error) {
    return (
      <div className="reveal slide-up text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">{t('AUTH_TOKEN_EXPIRED')}</h1>
        <p className="text-[#848D97] mb-8 leading-relaxed">
          {t('AUTH_TOKEN_EXPIRED_DESC')}
        </p>
        <Link 
          href="/auth/forgot-password" 
          className="inline-flex items-center gap-2 text-[#00D9FF] hover:underline uppercase tracking-widest text-xs font-bold"
        >
          {t('AUTH_REINITIATE_PROTOCOL')}
        </Link>
      </div>
    );
  }

  return (
    <div className="reveal slide-up">
      <LoadingOverlay visible={isLoading} message={t('AUTH_COMMITING_CIPHER')} />
      
      <div className="mb-8 p-6 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{t('AUTH_DEFINE_CIPHER')}</h1>
        <p className="text-[#848D97] text-sm italic">{t('AUTH_CIPHER_SECURE_DESC')}</p>
      </div>

      {error && (
        <StatusMessage type="error" message={error} />
      )}

      {success && (
        <StatusMessage type="success" message={t('AUTH_CIPHER_UPDATE_SUCCESS')} />
      )}

      <form onSubmit={handleReset} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">{t('AUTH_NEW_CIPHER')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-colors placeholder:text-white/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#848D97] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <PasswordStrengthMeter password={password} />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">{t('AUTH_VERIFY_NEW_CIPHER')}</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••••••"
              className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-colors placeholder:text-white/10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-[#848D97] font-bold">{t('AUTH_SECURITY_REQS')}</p>
          <ul className="space-y-2">
            {[
              { label: t('AUTH_MIN_CHARS'), met: password.length >= 12 },
              { label: t('AUTH_MIXED_CASE'), met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
              { label: t('AUTH_NUMBER_REQ'), met: /[0-9]/.test(password) },
              { label: t('AUTH_SYMBOL_REQ'), met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
            ].map((req, i) => (
              <li key={i} className={`flex items-center gap-2 text-xs ${req.met ? 'text-[#00D9FF]' : 'text-[#848D97]'}`}>
                <ShieldCheck size={14} className={req.met ? 'text-[#00D9FF]' : 'opacity-20'} /> {req.label}
              </li>
            ))}
          </ul>
        </div>

        {isLocked && (
          <div className="p-4 bg-[#FF453A]/10 border border-[#FF453A]/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
             <Lock size={16} className="text-[#FF453A] mt-0.5" />
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#FF453A] uppercase font-mono tracking-widest">{t('AUTH_PROTOCOL_LOCK')}</p>
                <p className="text-[10px] text-[#FF453A]/80 uppercase font-mono leading-relaxed">
                   {t('AUTH_LOCK_DESC', { date: nextAllowedChange?.toLocaleDateString() || '' })}
                </p>
             </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLocked || isLoading}
          className={cn(
            "w-full font-bold py-4 rounded-xl transition-all uppercase tracking-widest text-sm",
            isLocked 
              ? "bg-white/5 border border-white/10 text-[#848D97] cursor-not-allowed"
              : "bg-[#00D9FF] hover:bg-[#00D9FF]/90 text-[#05070A] shadow-[0_0_20px_rgba(0,217,255,0.2)] hover:shadow-[0_0_30px_rgba(0,217,255,0.4)]"
          )}
        >
          {isLocked ? t('AUTH_PROTOCOL_LOCKED') : t('AUTH_UPDATE_CIPHER')}
        </button>
      </form>
    </div>
  );
}
