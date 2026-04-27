'use client';

import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Clock, ShieldAlert, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionWarningModalProps {
  isOpen: boolean;
  timeLeft: number;
  onExtend: () => void;
}

export function SessionWarningModal({ isOpen, timeLeft, onExtend }: SessionWarningModalProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-3xl blur opacity-30 animate-pulse" />
          
          <GlassCard intensity="high" className="relative border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 relative">
                <Clock className="w-8 h-8 text-primary" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl bg-primary/5"
                />
              </div>

              <span className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-2 uppercase">
                Security Protocol // Session Expiry
              </span>
              
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                Terminal Inactivity Detected
              </h3>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 w-full flex flex-col items-center mb-8">
                <span className="text-sm font-mono text-primary/60 mb-1">SESSION_TERMINATING_IN</span>
                <span className="text-5xl font-mono font-bold text-primary tracking-widest">
                  {formatTime(timeLeft)}
                </span>
              </div>

              <p className="text-white/60 text-center text-sm leading-relaxed mb-8">
                Your secure session is set to expire due to prolonged inactivity. For your protection, you will be logged out unless you extend your session.
              </p>

              <button
                onClick={onExtend}
                className="group relative w-full h-14 bg-primary text-black font-bold rounded-xl flex items-center justify-center gap-3 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Zap className="w-5 h-5" />
                <span className="font-mono tracking-wider">EXTEND_OPERATIONAL_LINK</span>
              </button>

              <div className="mt-6 flex items-center gap-2 text-[8px] font-mono text-white/20 uppercase">
                <ShieldAlert className="w-3 h-3" />
                <span>Protocol ID: {Math.random().toString(36).substring(7).toUpperCase()} // encrypted_link_active</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

