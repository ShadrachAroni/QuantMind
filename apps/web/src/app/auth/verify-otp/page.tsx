'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Timer, RefreshCw, AlertCircle } from 'lucide-react';

function VerifyOtpForm() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  
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
      setError('Email missing from verification context.');
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
      if (plan && plan !== 'free') {
        router.push(`/dashboard/subscription?plan=${plan}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Verification cipher rejected. Please check and retry.');
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
      setError(err.message || 'Resend protocol failed. Please wait or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="text-center p-8 bg-black/20 rounded-2xl border border-white/5">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-xl font-bold text-white mb-2">Missing Context</h2>
        <p className="text-[#848D97] mb-6">Verification required email context to proceed.</p>
        <Link href="/auth/signup" className="text-[#00D9FF] hover:underline uppercase tracking-widest text-xs font-bold">
          Return to Vault Creation
        </Link>
      </div>
    );
  }

  return (
    <div className="reveal slide-up">
      <LoadingOverlay visible={isLoading} message="VALIDATING_CIPHER..." />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Verify Identity</h1>
        <p className="text-[#848D97]">A 6-digit security code was dispatched to: <br/><span className="text-white font-medium">{email}</span></p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      {isExpired ? (
        <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-2xl text-center">
          <p className="text-red-500 font-bold uppercase tracking-widest mb-4">CODE_EXPIRED</p>
          <button
            onClick={handleResend}
            className="flex items-center gap-2 mx-auto text-[#00D9FF] hover:text-[#00D9FF]/80 transition-colors uppercase tracking-widest text-xs font-bold"
          >
            <RefreshCw size={14} /> Request New Cipher
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
                className="aspect-square bg-[#12121A] border border-white/10 rounded-xl text-center text-2xl font-bold text-[#00D9FF] focus:outline-none focus:border-[#00D9FF]/50 transition-all focus:shadow-[0_0_15px_rgba(0,217,255,0.2)]"
                autoFocus={i === 0}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 text-xs font-mono uppercase tracking-wider ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-[#848D97]'}`}>
              <Timer size={14} />
              Protocol Expiry: {formatTime(timeLeft)}
            </div>
            
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className={`text-[10px] uppercase font-bold tracking-widest transition-colors ${
                resendCooldown > 0 ? 'text-[#848D97] cursor-not-allowed' : 'text-[#00D9FF] hover:underline'
              }`}
            >
              {resendCooldown > 0 ? `Resend In ${resendCooldown}s` : 'Resend Cipher'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-12 text-center text-[#848D97] text-sm">
        Incorrect email?{' '}
        <Link href="/auth/signup" className="text-[#00D9FF] hover:underline font-bold">
          Start Over
        </Link>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<LoadingOverlay visible={true} message="INITIALIZING_CIPHER_FALLBACK..." />}>
      <VerifyOtpForm />
    </Suspense>
  );
}
