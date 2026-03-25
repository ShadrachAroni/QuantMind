'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

function SignupForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validation
    if (password !== confirmPassword) {
      setError('Cipher mismatch. Please re-verify passwords.');
      return;
    }

    if (!tosChecked) {
      setError('Please acknowledge the Institutional Protocols (ToS & Privacy).');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError('Identity credentials required. Please provide First and Last names.');
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
            plan_preference: plan || 'free',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      // Redirect to OTP verification
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}${plan ? `&plan=${plan}` : ''}`);
    } catch (err: any) {
      setError(err.message || 'Vault creation failed. This node may be experiencing high load.');
      setIsLoading(false);
    }
  };

  return (
    <div className="reveal slide-up">
      <LoadingOverlay visible={isLoading} message="CONSTRUCTING_VAULT..." />
      
      <div className="mb-8">
        {plan && (
          <div className="mb-6 p-4 bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded-xl flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#00D9FF]/20 flex items-center justify-center text-[#00D9FF]">
               <CheckCircle2 size={18} />
             </div>
             <div>
               <p className="text-[#00D9FF] text-xs font-bold uppercase tracking-widest">Enrolling in {plan.toUpperCase()} tier</p>
               <p className="text-[#848D97] text-[10px]">Select your credentials to proceed.</p>
             </div>
          </div>
        )}
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Vault</h1>
        <p className="text-[#848D97]">Initialize your secure institutional repository.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">First Name</label>
            <input
              type="text"
              required
              placeholder="John"
              className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-colors placeholder:text-white/10"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">Last Name</label>
            <input
              type="text"
              required
              placeholder="Doe"
              className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-colors placeholder:text-white/10"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">Deployment Email</label>
          <input
            type="email"
            required
            placeholder="name@institution.com"
            className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]/50 transition-all placeholder:text-white/10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">Access Cipher</label>
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
            <label className="text-xs uppercase tracking-widest text-[#848D97] font-semibold">Verify Cipher</label>
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

        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="tos"
            className="mt-1 w-4 h-4 bg-[#12121A] border border-white/5 rounded cursor-pointer accent-[#00D9FF]"
            checked={tosChecked}
            onChange={(e) => setTosChecked(e.target.checked)}
          />
          <label htmlFor="tos" className="text-xs text-[#848D97] leading-relaxed">
            I acknowledge and accept the <Link href="/legal/terms?from=/auth/signup" className="text-[#00D9FF] hover:underline">Institutional Terms</Link> and <Link href="/legal/privacy?from=/auth/signup" className="text-[#00D9FF] hover:underline">Privacy Handshake</Link>.
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-[#00D9FF] hover:bg-[#00D9FF]/90 text-[#05070A] font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,217,255,0.2)] hover:shadow-[0_0_30px_rgba(0,217,255,0.4)] transition-all uppercase tracking-widest text-sm mt-4"
        >
          Generate Vault
        </button>
      </form>

      <div className="mt-8 text-center text-[#848D97] text-sm">
        Already have a vault?{' '}
        <Link href={`/auth/login${plan ? `?plan=${plan}` : ''}`} className="text-[#00D9FF] hover:underline font-bold">
          Enter Terminal
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingOverlay visible={true} message="INITIALIZING_VAULT_PROTOCOL..." />}>
      <SignupForm />
    </Suspense>
  );
}
