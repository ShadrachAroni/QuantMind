'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthProvider';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { ShieldCheck, ShieldAlert, Key, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function MFAPage() {
  const { user, mfaVerified } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (mfaVerified) {
      router.push('/');
      return;
    }

    const checkFactors = async () => {
      const { data, error: factorErr } = await supabase.auth.mfa.listFactors();
      if (factorErr) {
        setError(factorErr.message);
      } else if (data.totp.length === 0) {
        // No factors, start enrollment
        handleEnroll();
      } else {
        // Has factor, needs challenge
        const factor = data.totp[0];
        setFactorId(factor.id);
      }
      setLoading(false);
    };

    checkFactors();
  }, [mfaVerified, router]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'QuantMind Admin'
      });

      if (enrollErr) throw enrollErr;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;

    setLoading(true);
    setError(null);

    try {
      const { error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode
      });

      if (verifyErr) throw verifyErr;

      router.push('/');
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading && !qrCode) {
    return (
      <div className="min-h-screen bg-[#05070A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070A] flex items-center justify-center p-6 relative overflow-hidden">
      <GlowEffect color="#00D4FF" size={800} style={{ top: -400, left: -400, opacity: 0.1 }} />

      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-10">
          <ShieldCheck className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-white">MFA_VERIFICATION_REQUIRED</h1>
          <p className="text-gray-500 mt-2 text-sm mono uppercase tracking-wider">Protocol Security Level: AAL2</p>
        </div>

        <GlassCard intensity="high" className="p-8 border border-white/10 rounded-3xl">
          {qrCode ? (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-6 font-medium">Scan the QR code with your authenticator app to enroll.</p>
                <div className="inline-block p-4 bg-white rounded-2xl">
                  <QRCodeSVG value={qrCode} size={200} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] mono text-gray-500 block">MANUAL_SETUP_KEY</span>
                    <code className="text-xs text-cyan-400 font-mono">{secret}</code>
                  </div>
                  <button onClick={copySecret} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] mono text-gray-500 ml-1">VERIFICATION_CODE</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="000000"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 text-center text-2xl tracking-[0.5em] font-mono text-white focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={verifyCode.length !== 6 || loading}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-900/50 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'COMPLETE_ENROLLMENT'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex items-start gap-4">
                <Key className="w-5 h-5 text-cyan-400 mt-1" />
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-white">TOTP_CHALLENGE</span>
                  <p className="text-xs text-gray-500 leading-relaxed">Enter the 6-digit code from your configured authenticator device.</p>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] mono text-gray-500 ml-1">6-DIGIT_OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    autoFocus
                    placeholder="••••••"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-5 text-center text-3xl tracking-[0.5em] font-mono text-white focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-500 font-mono">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifyCode.length !== 6 || loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-900/50 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'VERIFY_CHALLENGE'}
                </button>
              </form>
            </div>
          )}
        </GlassCard>

        <div className="mt-8 text-center">
          <button onClick={() => supabase.auth.signOut()} className="text-[10px] mono text-gray-600 hover:text-red-500 transition-colors uppercase tracking-[2px]">
            Log out & Abort
          </button>
        </div>
      </div>
    </div>
  );
}
