'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const t = useTranslation();
  
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (cooldown === 0 && error?.includes('Rate limit')) {
      // Clear the rate limit error when cooldown ends to avoid confusion
      setError(null);
    }
  }, [cooldown, error]);
  
  const supabase = createClient();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Call the custom recovery API (Uses Resend to bypass Supabase project limits)
      const response = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle 429 specifically for custom route if it returns it
        if (response.status === 429) {
          throw { status: 429, message: result.error };
        }
        throw new Error(result.error || t('AUTH_RECOVERY_FAILED'));
      }

      setIsSubmitted(true);
    } catch (err: any) {
      if (err.status === 429) {
        const isProjectLimit = err.message?.toLowerCase().includes('email rate limit exceeded');
        
        if (isProjectLimit) {
          setError(t('AUTH_RATE_LIMIT'));
          setCooldown(0); 
        } else {
          setCooldown(60);
          const match = err.message?.match(/(\d+)\s+seconds/);
          if (match) {
            setCooldown(parseInt(match[1]));
          }
          setError(err.message || t('AUTH_RATE_LIMIT'));
        }
      } else {
        setError(err.message || t('AUTH_RECOVERY_FAILED'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="reveal slide-up text-center">
        <div className="w-16 h-16 bg-[#00D9FF]/20 rounded-full flex items-center justify-center text-[#00D9FF] mx-auto mb-6">
          <CheckCircle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">{t('AUTH_DISPATCH_CONFIRMED')}</h1>
        <p className="text-[#848D97] mb-8 leading-relaxed">
          {t('AUTH_RECOVERY_SENT', { email })}
        </p>
        <Link 
          href="/auth/login" 
          className="inline-flex items-center gap-2 text-[#00D9FF] hover:underline uppercase tracking-widest text-xs font-bold"
        >
          <ArrowLeft size={14} /> {t('AUTH_RETURN_TERMINAL')}
        </Link>
      </div>
    );
  }

  return (
    <div className="reveal slide-up">
      <LoadingOverlay visible={isLoading} message={t('AUTH_DISPATCHING_RECOVERY')} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{t('AUTH_RECOVERY_TITLE')}</h1>
        <p className="text-[#848D97]">{t('AUTH_RECOVERY_SUBTITLE')}</p>
      </div>

      {error && (
        <StatusMessage 
          type={cooldown > 0 ? 'warning' : 'error'} 
          message={cooldown > 0 ? t('AUTH_WAIT_COOLDOWN', { seconds: cooldown.toString() }) : error} 
        />
      )}

      <form onSubmit={handleResetRequest} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">{t('AUTH_DEPLOYMENT_EMAIL')}</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#848D97]" size={18} />
            <input
              type="email"
              required
              placeholder={t('AUTH_EMAIL_PLACEHOLDER')}
              className="w-full bg-[#12121A] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-colors placeholder:text-white/10"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null); // Clear error when user changes input
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || cooldown > 0}
          className={`w-full ${cooldown > 0 ? 'bg-white/5 text-[#848D97] border border-white/5 cursor-not-allowed' : 'bg-[#00D9FF] hover:bg-[#00D9FF]/90 text-[#05070A]'} font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,217,255,0.2)] hover:shadow-[0_0_30px_rgba(0,217,255,0.4)] transition-all uppercase tracking-widest text-sm flex items-center justify-center`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#05070A] border-t-transparent"></span>
              {t('Synchronizing')}
            </span>
          ) : cooldown > 0 ? (
            t('AUTH_WAIT_COOLDOWN', { seconds: cooldown.toString() })
          ) : (
            t('AUTH_DISPATCH_LINK')
          )}
        </button>

        <div className="text-center mt-6">
          <Link 
            href="/auth/login" 
            className="inline-flex items-center gap-2 text-[#848D97] hover:text-white transition-colors text-xs uppercase tracking-widest font-bold"
          >
            <ArrowLeft size={14} /> {t('AUTH_BACK_LOGIN')}
          </Link>
        </div>
      </form>
    </div>
  );
}
