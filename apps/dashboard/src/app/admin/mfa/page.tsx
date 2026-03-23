'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../components/auth/AuthProvider';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { HoloLoader } from '../../../components/ui/HoloLoader';
import { Shield, Key, RefreshCw, ArrowRight, Mail } from 'lucide-react';

export default function AdminMfaPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const initialSendDone = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    // Redirect if not admin
    if (user && !isAdmin) {
      router.push('/');
      return;
    }
    
    // Initial code trigger
    if (user && isAdmin && !initialSendDone.current) {
      initialSendDone.current = true;
      sendOtp();
    }
  }, [user, isAdmin, authLoading]);

  const sendOtp = async () => {
    setSending(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AdminMfaPage] SESSION_CHECK:', session ? 'ACTIVE' : 'MISSING');
      
      if (!session) {
        throw new Error('No active session found. Please log in again.');
      }

      const { data, error: funcError } = await supabase.functions.invoke('admin-mfa-handler', {
        body: { action: 'send' },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (funcError) {
        console.error('[AdminMfaPage] EDGE_FUNCTION_ERROR:', funcError);
        throw funcError;
      }
    } catch (err: any) {
      console.error('[AdminMfaPage] CRITICAL_AUTH_FAILURE:', err);
      setError(err.message || 'Failed to dispatch authorization code.');
    } finally {
      setSending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;

    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session found. Please log in again.');

      const { data, error: funcError } = await supabase.functions.invoke('admin-mfa-handler', {
        body: { action: 'verify', code },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (funcError) throw funcError;
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid authorization code provided.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otp.join('').length === 6) {
      verifyOtp();
    }
  }, [otp]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#05070A]">
        <HoloLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="mfa-container">
      <div className="background-bloom" />
      
      <GlassCard className="mfa-card">
        <div className="mfa-header">
          <div className="shield-icon">
            <Shield className="w-8 h-8 text-cyan-400" />
            <div className="shield-ring" />
          </div>
          <h1>GOVERNANCE AUTHORIZATION</h1>
          <p>Institutional multi-factor challenge required for terminal entry</p>
        </div>

        <div className="mfa-content">
          <div className="email-hint">
            <Mail className="w-4 h-4" />
            <span>Code dispatched to administrative email linked to {user?.email}</span>
          </div>

          <div className="otp-grid">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading || success}
                className={digit ? 'active' : ''}
              />
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}
          
          {success && (
            <div className="success-message">
              <HoloLoader size="sm" fullScreen={false} />
              <span>Authorization granted. Calibrating terminal...</span>
            </div>
          )}

          {!success && (
            <button 
              onClick={sendOtp} 
              disabled={sending || loading}
              className="resend-btn"
            >
              {sending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>REQUEST NEW ACCESS KEY</span>
            </button>
          )}
        </div>

        <div className="mfa-footer">
          <div className="security-tag">SECURE_BY_QUANTMIND</div>
          <div className="protocol-text">PROTOCOL: E2EE_OOB_OTP</div>
        </div>
      </GlassCard>

      <style jsx>{`
        .mfa-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #020617;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        .background-bloom {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 245, 255, 0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        :global(.mfa-card) {
          width: 100%;
          max-width: 480px;
          padding: 40px !important;
          border: 1px solid rgba(0, 245, 255, 0.2) !important;
          background: rgba(15, 23, 42, 0.8) !important;
          position: relative;
          z-index: 10;
        }

        .mfa-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .shield-icon {
          position: relative;
          width: 64px;
          height: 64px;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shield-ring {
          position: absolute;
          inset: -4px;
          border: 2px solid rgba(0, 245, 255, 0.2);
          border-radius: 50%;
          border-top-color: #00f5ff;
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        h1 {
          font-family: ui-monospace, monospace;
          font-size: 20px;
          font-weight: 900;
          color: #00f5ff;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }

        p {
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.6;
        }

        .email-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 12px;
          margin-bottom: 32px;
          font-size: 11px;
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .otp-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 32px;
        }

        input {
          width: 100%;
          aspect-ratio: 1;
          background: rgba(30, 41, 59, 0.5);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          text-align: center;
          font-size: 24px;
          font-weight: 900;
          color: #f1f5f9;
          font-family: ui-monospace, monospace;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        input:focus {
          outline: none;
          border-color: #00f5ff;
          background: rgba(0, 245, 255, 0.05);
          box-shadow: 0 0 15px rgba(0, 245, 255, 0.2);
          transform: translateY(-2px);
        }

        input.active {
          border-color: rgba(0, 245, 255, 0.5);
        }

        .error-message {
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: #ef4444;
          font-size: 12px;
          text-align: center;
          margin-bottom: 24px;
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        .success-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 24px;
          color: #00f5ff;
          font-family: ui-monospace, monospace;
          font-size: 12px;
          text-align: center;
        }

        .resend-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .resend-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          color: #f1f5f9;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .resend-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mfa-footer {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .security-tag, .protocol-text {
          font-size: 9px;
          color: #475569;
          font-family: ui-monospace, monospace;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}
