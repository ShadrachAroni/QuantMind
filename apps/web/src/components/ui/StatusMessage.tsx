'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

export type StatusType = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  type: StatusType;
  message: string;
  onClose?: () => void;
}

export function StatusMessage({ type, message, onClose }: StatusMessageProps) {
  const configs = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      text: 'text-green-500',
      icon: <CheckCircle2 size={18} />,
      title: 'Protocol_Success'
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-500',
      icon: <XCircle size={18} />,
      title: 'Protocol_Failure'
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-500',
      icon: <AlertCircle size={18} />,
      title: 'Security_Warning'
    },
    info: {
      bg: 'bg-[#00D9FF]/10',
      border: 'border-[#00D9FF]/20',
      text: 'text-[#00D9FF]',
      icon: <Info size={18} />,
      title: 'System_Report'
    }
  };

  const config = configs[type];

  return (
    <div className={`reveal slide-up mb-6 p-4 rounded-xl border ${config.bg} ${config.border} backdrop-blur-sm relative overflow-hidden group`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${config.text} opacity-50 bg-current`} />
      <div className="flex items-start gap-3">
        <div className={`${config.text} mt-0.5`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-50 mb-1">
            {config.title}
          </p>
          <p className={`${config.text} text-sm font-medium leading-relaxed`}>
            {message}
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-white/20 hover:text-white/40 transition-colors"
          >
            <XCircle size={16} />
          </button>
        )}
      </div>
      {/* Decorative glow */}
      <div className={`absolute -right-4 -bottom-4 w-12 h-12 ${config.text} bg-current opacity-5 blur-2xl rounded-full`} />
    </div>
  );
}
