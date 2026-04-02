'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Timer, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

function VerifyOtpForm() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const t = useTranslation();
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const plan = searchParams.get('plan');
  const supabase = createClient();

  // 1. Countdown Timer Logic
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 2. Resend Cooldown Logic
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if full
    if (newOtp.every(digit => digit !== '') && value) {
      verifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (token: string) => {
    if (!email) {
      setError(t('AUTH_EMAIL_MISSING'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (verifyError) throw verifyError;

      // Success redirect
      const onboardingUrl = `/auth/onboarding${plan ? `?plan=${plan}` : ''}`;
      router.push(onboardingUrl);
    } catch (err: any) {
      setError(err.message || t('AUTH_VERIFICATION_REJECTED'));
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        email,
        type: 'signup',
      });

      if (resendError) throw resendError;

      setResendCooldown(30);
      setTimeLeft(600);
      setIsExpired(false);
      setOtp(['', '', '', '', '', '']);
      setError(null);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || t('AUTH_RESEND_FAILED'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="text-center p-8 bg-black/20 rounded-2xl border border-white/5">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-xl font-bold text-white mb-2">{t('AUTH_MISSING_CONTEXT')}</h2>
        <p className="text-[#848D97] mb-6">{t('AUTH_VERIFICATION_CONTEXT_REQUIRED')}</p>
        <Link href="/auth/signup" className="text-[#00D9FF] hover:underline uppercase tracking-widest text-xs font-bold">
          {t('AUTH_RETURN_TO_VAULT')}
        </Link>
      </div>
    );
  }

  return (
    <div className="reveal slide-up">
      <LoadingOverlay visible={isLoading} message={t('AUTH_VALIDATING_CIPHER')} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{t('AUTH_VERIFY_IDENTITY')}</h1>
        <p className="text-[#848D97]">{t('AUTH_OTP_SENT', { email })}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      {isExpired ? (
        <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-2xl text-center">
          <p className="text-red-500 font-bold uppercase tracking-widest mb-4">{t('AUTH_CODE_EXPIRED')}</p>
          <button
            onClick={handleResend}
            className="flex items-center gap-2 mx-auto text-[#00D9FF] hover:text-[#00D9FF]/80 transition-colors uppercase tracking-widest text-xs font-bold"
          >
            <RefreshCw size={14} /> {t('AUTH_REQUEST_NEW_CIPHER')}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-6 gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                title={t('AUTH_VERIFY_IDENTITY')}
                aria-label={t('AUTH_VERIFY_IDENTITY')}
                className="aspect-square bg-[#12121A] border border-white/10 rounded-xl text-center text-2xl font-bold text-[#00D9FF] focus:outline-none focus:border-[#00D9FF]/50 transition-all focus:shadow-[0_0_15px_rgba(0,217,255,0.2)]"
                autoFocus={i === 0}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 text-xs font-mono uppercase tracking-wider ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-[#848D97]'}`}>
              <Timer size={14} />
              {t('AUTH_PROTOCOL_EXPIRY', { time: formatTime(timeLeft) })}
            </div>
            
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className={`text-[10px] uppercase font-bold tracking-widest transition-colors ${
                resendCooldown > 0 ? 'text-[#848D97] cursor-not-allowed' : 'text-[#00D9FF] hover:underline'
              }`}
            >
              {resendCooldown > 0 ? t('AUTH_RESEND_IN', { seconds: resendCooldown }) : t('AUTH_RESEND_CIPHER')}
            </button>
          </div>
        </div>
      )}

      <div className="mt-12 text-center text-[#848D97] text-sm">
        {t('AUTH_INCORRECT_EMAIL')}{' '}
        <Link href="/auth/signup" className="text-[#00D9FF] hover:underline font-bold">
          {t('AUTH_START_OVER')}
        </Link>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  const t = useTranslation();
  return (
    <Suspense fallback={<LoadingOverlay visible={true} message={t('AUTH_INITIALIZING_CIPHER_FALLBACK')} />}>
      <VerifyOtpForm />
    </Suspense>
  );
}
