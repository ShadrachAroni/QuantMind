'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { useToast } from '../../components/ui/ToastProvider';
import { Lock, Mail, Loader2, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginErr) throw loginErr;

      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();

      const is_admin = !!profile?.is_admin;
      
      if (!is_admin) {
        await supabase.auth.signOut();
        throw new Error('ACCESS_DENIED: ADMINISTRATIVE_CLEARANCE_REQUIRED');
      }

      toastSuccess('HANDSHAKE_COMPLETE', 'Session authorized. Welcome back, Commander.');
      
      if (is_admin) {
        router.push('/admin/mfa');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      const message = err.message.toUpperCase();
      setError(message);
      toastError('AUTH_FAILURE', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070A] flex items-center justify-center p-6 relative overflow-hidden">
      <GlowEffect color="#00D4FF" size={800} style={{ top: -400, right: -400, opacity: 0.1 }} />
      <GlowEffect color="#7C3AED" size={600} style={{ bottom: -300, left: -300, opacity: 0.05 }} />
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-12">
          <img src="/logo.png" alt="QuantMind" className="w-20 h-20 mx-auto mb-8 drop-shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-float" />
          <span className="text-[10px] mono text-cyan-400 letter-spacing-[3px] block mb-2">SECURE_ACCESS_GATEWAY</span>
          <h1 className="text-3xl font-extrabold tracking-tighter text-white">Quant<span className="text-cyan-400">Mind</span> Admin</h1>
          <p className="text-gray-500 mt-2 text-sm">INTERNAL_USE_ONLY // ENCRYPTED_TERMINAL</p>
        </div>

        <GlassCard intensity="high" className="p-8 border border-white/10 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] mono text-gray-500 ml-1">OPERATOR_ID</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@quantmind.ai"
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] mono text-gray-500 ml-1">PASSPHRASE</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <span className="text-[10px] mono text-red-400 block mb-1">AUTH_FAILURE_DETECTED</span>
                <p className="text-xs text-red-500 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-900/50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="mono text-xs tracking-widest">INITIATE_HANDSHAKE</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </GlassCard>

        <div className="mt-8 text-center">
            <p className="text-[9px] mono text-gray-600 uppercase tracking-widest">
                Connected to: v1.0.4_production // kernel_942
            </p>
        </div>
      </div>
    </div>
  );
}
