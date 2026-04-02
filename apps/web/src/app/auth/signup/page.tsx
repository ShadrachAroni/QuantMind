'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

function SignupForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tosChecked, setTosChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const supabase = createClient();
  const t = useTranslation();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validation
    if (password !== confirmPassword) {
      setError(t('AUTH_CIPHER_MISMATCH'));
      return;
    }

    if (!tosChecked) {
      setError(t('AUTH_ACKNOWLEDGE_PROTOCOLS'));
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError(t('AUTH_IDENTITY_REQUIRED'));
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone_number: phone.trim() || null,
            plan_preference: plan || 'free',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      // Redirect to OTP verification
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}${plan ? `&plan=${plan}` : ''}`);
    } catch (err: any) {
      setError(err.message || t('AUTH_VAULT_FAILURE'));
      setIsLoading(false);
    }
  };

  return (
    <div className="reveal slide-up">
      <LoadingOverlay visible={isLoading} message={t('AUTH_CONSTRUCTING_VAULT')} />
      
      <div className="mb-8">
        {plan && (
          <div className="mb-6 p-4 bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded-xl flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#00D9FF]/20 flex items-center justify-center text-[#00D9FF]">
               <CheckCircle2 size={18} />
             </div>
             <div>
               <p className="text-[#00D9FF] text-xs font-bold uppercase tracking-widest">{t('AUTH_ENROLLING_TIER', { plan: plan.toUpperCase() })}</p>
               <p className="text-[#848D97] text-[10px]">{t('AUTH_SELECT_CREDENTIALS')}</p>
             </div>
          </div>
        )}
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{t('AUTH_SIGNUP_TITLE')}</h1>
        <p className="text-[#848D97]">{t('AUTH_SIGNUP_SUBTITLE')}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">{t('AUTH_FIRST_NAME')}</label>
            <input
              type="text"
              required
              placeholder={t('AUTH_FIRST_NAME_PLACEHOLDER')}
              className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-colors placeholder:text-white/10"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">{t('AUTH_SECOND_NAME')}</label>
            <input
              type="text"
              required
              placeholder={t('AUTH_SECOND_NAME_PLACEHOLDER')}
              className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-colors placeholder:text-white/10"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">{t('AUTH_DEPLOYMENT_EMAIL')}</label>
          <input
            type="email"
            required
            placeholder={t('AUTH_EMAIL_DEFAULT')}
            className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-all placeholder:text-white/10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">{t('AUTH_ACCESS_CIPHER')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-colors placeholder:text-white/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#848D97] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">{t('AUTH_VERIFY_CIPHER')}</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-colors placeholder:text-white/10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <PasswordStrengthMeter password={password} />

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">{t('AUTH_COMM_LINK')}</label>
          <input
            type="tel"
            placeholder="+1 (555) 000-0000"
            className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-all placeholder:text-white/10"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-[10px] text-[#848D97] px-1">{t('AUTH_COMM_LINK_DESC')}</p>
        </div>

        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="tos"
            className="mt-1 w-4 h-4 bg-[#12121A] border border-white/5 rounded cursor-pointer accent-[#00D9FF]"
            checked={tosChecked}
            onChange={(e) => setTosChecked(e.target.checked)}
          />
          <label htmlFor="tos" className="text-xs text-[#848D97] leading-relaxed">
            {t('AUTH_PROTOCOL_ACK', {
              terms: '',
              privacy: ''
            }).split('{{terms}}').map((part, i) => {
              if (i === 1) {
                const subParts = part.split('{{privacy}}');
                return (
                  <React.Fragment key={i}>
                    <Link href="/legal/terms?from=/auth/signup" className="text-[#00D9FF] hover:underline">{t('AUTH_TERMS')}</Link>
                    {subParts[0]}
                    <Link href="/legal/privacy?from=/auth/signup" className="text-[#00D9FF] hover:underline">{t('AUTH_PRIVACY')}</Link>
                    {subParts[1]}
                  </React.Fragment>
                );
              }
              return part;
            })}
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-[#00D9FF] hover:bg-[#00D9FF]/90 text-[#05070A] font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,217,255,0.2)] hover:shadow-[0_0_30px_rgba(0,217,255,0.4)] transition-all uppercase tracking-widest text-sm mt-4"
        >
          {t('AUTH_GENERATE_VAULT')}
        </button>
      </form>

      <div className="mt-8 text-center text-[#848D97] text-sm">
        {t('AUTH_ALREADY_HAVE_VAULT')}{' '}
        <Link href={`/auth/login${plan ? `?plan=${plan}` : ''}`} className="text-[#00D9FF] hover:underline font-bold">
          {t('AUTH_ENTER_TERMINAL')}
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const t = useTranslation();
  return (
    <Suspense fallback={<LoadingOverlay visible={true} message={t('AUTH_INITIALIZING_PROTOCOL')} />}>
      <SignupForm />
    </Suspense>
  );
}
