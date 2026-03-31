'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, ShieldAlert, Trash2, Key, Info, CheckCircle2 } from 'lucide-react';
import styles from './DeletionWizard.module.css';
import { createClient } from '@/lib/supabase';

interface DeletionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

type Step = 'warning' | 'verify' | 'confirm' | 'success';

export function DeletionWizard({ isOpen, onClose, userEmail }: DeletionWizardProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('warning');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationType, setVerificationType] = useState<'password' | 'otp'>('password');
  
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
      setTimeout(() => {
        setMounted(false);
        setCurrentStep('warning');
        setPassword('');
        setOtpCode('');
        setError(null);
      }, 400);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: { shouldCreateUser: false }
      });
      if (otpError) throw otpError;
      setVerificationType('otp');
      // No alert needed, just stay on the same visual step but change input
    } catch (err: any) {
      setError(err.message || 'OTP_DELIVERY_FAILURE');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      // We don't call the backend yet, just verify input locally if needed or move to next step
      // In a real flow, we could verify password here, but the plan says "Once password is confirmed, present second confirmation"
      // So we move to 'confirm' which then triggers the combined verify+delete call.
      // But to follow "guiding user through series of explicit warnings", we move to step 3.
      setCurrentStep('confirm');
    } catch (err: any) {
      setError('VERIFICATION_FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalPurge = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('delete-account', {
        body: {
          verificationType,
          password: verificationType === 'password' ? password : null,
          otpToken: verificationType === 'otp' ? otpCode : null,
        }
      });

      if (funcError) throw funcError;
      if (data?.error) throw new Error(data.error);

      setCurrentStep('success');
      setTimeout(() => {
        supabase.auth.signOut().then(() => {
          window.location.href = '/';
        });
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'PURGE_PROTOCOL_FAILURE');
      // If verification failed, go back to step 2
      if (err.message?.includes('INVALID')) {
        setCurrentStep('verify');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const renderContent = () => {
    switch (currentStep) {
      case 'warning':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={styles.warningIcon}>
              <AlertTriangle size={32} />
            </div>
            <div className={styles.header}>
              <h2 className={styles.title}>Critical Alert</h2>
              <p className={styles.subtitle}>Institutional Account Termination</p>
            </div>
            <div className={styles.content}>
              <p className={styles.warningText}>
                You are about to initialize the permanent erasure of your QuantMind Node. This process is <strong>irreversible</strong> and will result in the immediate loss of all analytical data.
              </p>
              <div className={styles.warningBox}>
                <ul className={styles.dataList}>
                  <li className={styles.dataItem}><Trash2 size={12} /> All Portfolios & Assets</li>
                  <li className={styles.dataItem}><Trash2 size={12} /> Simulation Metrics & Deep History</li>
                  <li className={styles.dataItem}><Trash2 size={12} /> Support Comms & Messages</li>
                  <li className={styles.dataItem}><Trash2 size={12} /> Identity Profile & MFA Tokens</li>
                </ul>
              </div>
            </div>
            <div className={styles.footer}>
              <button className={styles.cancelBtn} onClick={onClose}>Abort Protocol</button>
              <button className={styles.confirmBtn} onClick={() => setCurrentStep('verify')}>I Understand, Proceed</button>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className={styles.warningIcon}>
              <ShieldAlert size={32} />
            </div>
            <div className={styles.header}>
              <h2 className={styles.title}>Identity Check</h2>
              <p className={styles.subtitle}>Authorization Required</p>
            </div>
            <div className={styles.content}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {verificationType === 'password' ? 'Verify with Access Key' : 'Verify with Email OTP'}
                </label>
                {verificationType === 'password' ? (
                  <input 
                    type="password" 
                    className={styles.input}
                    placeholder="ENTER_PASSWORD"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                ) : (
                  <input 
                    type="text" 
                    className={styles.input}
                    placeholder="000000"
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                )}
                {error && <p className="text-[10px] text-[#FF453A] font-mono mt-2 font-bold uppercase tracking-widest">{error}</p>}
              </div>
              <button 
                onClick={handleSendOtp}
                className="text-[9px] text-[#00D9FF] font-mono font-bold uppercase tracking-[0.2em] hover:opacity-80 transition-opacity"
              >
                {verificationType === 'password' ? 'No access key? Verify via Email OTP' : 'Resend OTP Code'}
              </button>
            </div>
            <div className={styles.footer}>
              <button className={styles.cancelBtn} onClick={() => setCurrentStep('warning')}>Back</button>
              <button 
                className={styles.confirmBtn} 
                disabled={verificationType === 'password' ? !password : otpCode.length < 6}
                onClick={handleVerification}
              >
                Authenticate
              </button>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className={styles.warningIcon}>
              <Key size={32} />
            </div>
            <div className={styles.header}>
              <h2 className={styles.title}>Final Confirmation</h2>
              <p className={styles.subtitle}>T-Minus Zero</p>
            </div>
            <div className={styles.content}>
              <div className="bg-[#FF453A]/10 border border-[#FF453A]/30 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-3 text-[#FF453A]">
                  <Info size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-widest font-mono">Immediate Network Disconnect</p>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed uppercase font-mono">
                  Confirming this action will broadcast a global purge command. Your credentials will be revoked across all nodes. This action <strong>CANNOT BE UNDONE</strong> by QuantMind Support.
                </p>
              </div>
              {error && <p className="text-[10px] text-[#FF453A] font-mono mt-4 font-bold uppercase tracking-widest text-center">{error}</p>}
            </div>
            <div className={styles.footer}>
              <button className={styles.cancelBtn} onClick={() => setCurrentStep('verify')}>Abort</button>
              <button className={styles.confirmBtn} onClick={handleFinalPurge}>Execute Account Purge</button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="animate-in zoom-in duration-500 text-center py-12">
            <div className="w-16 h-16 bg-[#32D74B]/10 border border-[#32D74B]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-[#32D74B]" />
            </div>
            <h2 className={styles.title}>Purge Complete</h2>
            <p className={styles.subtitle}>Redirecting to Ground Level...</p>
          </div>
        );
    }
  };

  const modalContent = (
    <div className={`${styles.overlay} ${visible ? styles.visible : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>SYNCHRONIZING_PURGE</p>
          </div>
        )}
        <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        {renderContent()}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
