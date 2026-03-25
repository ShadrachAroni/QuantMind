'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  
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
    console.log('--- CLIENT RECOVERY ATTEMPT ---');
    console.log('Email:', email);

    try {
      // Call the custom recovery API (Uses Resend to bypass Supabase project limits)
      const response = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      console.log('Server Response:', { status: response.status, result });

      if (!response.ok) {
        // Handle 429 specifically for custom route if it returns it
        if (response.status === 429) {
          throw { status: 429, message: result.error };
        }
        throw new Error(result.error || 'Recovery protocol dispatch failed.');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      if (err.status === 429) {
        const isProjectLimit = err.message?.toLowerCase().includes('email rate limit exceeded');
        
        if (isProjectLimit) {
          setError('Global institutional rate limit reached (Project-wide). Please wait 1 hour or check the Supabase Dashboard > Authentication > Rate Limits.');
          setCooldown(0); 
        } else {
          setCooldown(60);
          const match = err.message?.match(/(\d+)\s+seconds/);
          if (match) {
            setCooldown(parseInt(match[1]));
          }
          setError(err.message || 'Rate limit exceeded. Please wait 60 seconds.');
        }
      } else {
        setError(err.message || 'Reset protocol dispatch failed. Please check network connectivity.');
        console.error('Client Recovery Error:', err);
      }
    } finally {
      setIsLoading(false);
      console.log('--- RECOVERY ATTEMPT FINISHED ---');
    }
  };

  if (isSubmitted) {
    return (
      <div className="reveal slide-up text-center">
        <div className="w-16 h-16 bg-[#00D9FF]/20 rounded-full flex items-center justify-center text-[#00D9FF] mx-auto mb-6">
          <CheckCircle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Dispatch Confirmed</h1>
        <p className="text-[#848D97] mb-8 leading-relaxed">
          If an institutional record exists for <span className="text-white font-medium">{email}</span>, 
          recovery instructions have been transmitted.
        </p>
        <Link 
          href="/auth/login" 
          className="inline-flex items-center gap-2 text-[#00D9FF] hover:underline uppercase tracking-widest text-xs font-bold"
        >
          <ArrowLeft size={14} /> Return to Terminal
        </Link>
      </div>
    );
  }

  return (
    <div className="reveal slide-up">
      <LoadingOverlay visible={isLoading} message="DISPATCHING_RECOVERY..." />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Access Recovery</h1>
        <p className="text-[#848D97]">Initiate a secure cipher reset protocol.</p>
      </div>

      {error && (
        <StatusMessage 
          type={cooldown > 0 ? 'warning' : 'error'} 
          message={cooldown > 0 ? `${error} (Cooldown: ${cooldown}s remaining)` : error} 
        />
      )}

      <form onSubmit={handleResetRequest} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">Deployment Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#848D97]" size={18} />
            <input
              type="email"
              required
              placeholder="name@institution.com"
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
              Synchronizing...
            </span>
          ) : cooldown > 0 ? (
            `Wait ${cooldown}s`
          ) : (
            'Dispatch Recovery Link'
          )}
        </button>

        <div className="text-center mt-6">
          <Link 
            href="/auth/login" 
            className="inline-flex items-center gap-2 text-[#848D97] hover:text-white transition-colors text-xs uppercase tracking-widest font-bold"
          >
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}
