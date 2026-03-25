'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { Eye, EyeOff, Globe, Github } from 'lucide-react';
import { useEffect } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const supabase = createClient();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const detailsParam = searchParams.get('details');
    const statusParam = searchParams.get('status');

    if (statusParam === 'password_reset_success') {
      setError(null);
      // We can use a success state or just reuse error with a success type in JSX
      // Actually, I'll add a success state to LoginForm for clarity.
    }

    // Check for fragment errors (commonly used by Supabase Auth for hash-based redirects)
    let fragmentError = '';
    let fragmentDetails = '';
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      fragmentError = hashParams.get('error') || '';
      fragmentDetails = hashParams.get('error_description') || '';
    }

    if (statusParam === 'password_reset_success') {
      setSuccessMessage('Access cipher updated successfully. You may now initialize your session.');
    }

    if (errorParam || fragmentError) {
      const combinedError = detailsParam || fragmentDetails || fragmentError || 'Authentication sequence failed.';
      // Clean up the error message from URL encoding
      setError(decodeURIComponent(combinedError.replace(/\+/g, ' ')));
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (plan) {
        router.push(`/dashboard/subscription?plan=${plan}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authorization failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="reveal slide-up">
      <LoadingOverlay visible={isLoading} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Access Terminal</h1>
        <p className="text-[#848D97]">QuantMind Institutional Node v.1.04</p>
      </div>

      {successMessage && (
        <StatusMessage type="success" message={successMessage} />
      )}

      {error && (
        <StatusMessage type="error" message={error} />
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">Deployment Email</label>
          <input
            type="email"
            required
            placeholder="name@institution.com"
            className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-colors placeholder:text-white/10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">Access Cipher</label>
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
        </div>

        <div className="flex items-center justify-end">
          <Link href="/auth/forgot-password" title="Forgot Password" className="text-xs text-[#00D9FF] hover:underline uppercase tracking-wider">
            Reobtain Access Cipher
          </Link>
        </div>

        <button
          type="submit"
          className="w-full bg-[#00D9FF] hover:bg-[#00D9FF]/90 text-[#05070A] font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,217,255,0.2)] hover:shadow-[0_0_30px_rgba(0,217,255,0.4)] transition-all uppercase tracking-widest text-sm"
        >
          Initialize Session
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase text-[#848D97] tracking-[0.2em] bg-[#05070A] px-4">
            OR CONTINUITY PROTOCOL
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 py-3 rounded-xl text-sm font-medium text-white transition-all"
          >
            <Globe size={18} className="text-[#00D9FF]" />
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin('apple')}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 py-3 rounded-xl text-sm font-medium text-white transition-all"
          >
            <Globe size={18} />
            Apple
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-[#848D97] text-sm">
          No institutional credentials?{' '}
          <Link href="/auth/signup" className="text-[#00D9FF] hover:underline font-bold">
            Create New Vault
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingOverlay visible={true} />}>
      <LoginForm />
    </Suspense>
  );
}
