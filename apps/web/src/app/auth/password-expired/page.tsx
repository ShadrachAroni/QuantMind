'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function PasswordExpiredPage() {
  const t = useTranslation();

  return (
    <div className="reveal slide-up text-center">
      {/* Red Glow Effect */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-8 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
        <Lock size={40} />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight uppercase">{t('AUTH_ROTATION_REQUIRED')}</h1>
        <div className="flex justify-center gap-2 mb-6">
            <span className="px-2 py-1 bg-red-500/20 text-red-500 text-[10px] font-bold rounded uppercase tracking-widest border border-red-500/20">
              {t('AUTH_PROTOCOL_SEP60')}
            </span>
            <span className="px-2 py-1 bg-white/5 text-[#848D97] text-[10px] font-bold rounded uppercase tracking-widest border border-white/5">
              {t('AUTH_CIPHER_EXPIRED')}
            </span>
        </div>
        <p className="text-[#848D97] leading-relaxed max-w-sm mx-auto">
          {t('AUTH_ROTATION_DESC')}
        </p>
      </div>

      <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-10 flex items-start gap-4 text-left">
        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-red-500/80 leading-relaxed">
          {t('AUTH_RESTRICTED_ACCESS')}
        </p>
      </div>

      <Link 
        href="/auth/forgot-password" 
        className="w-full block bg-white text-[#05070A] font-bold py-4 rounded-xl hover:bg-neutral-200 transition-all uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)]"
      >
        {t('AUTH_INITIATE_ROTATION')}
      </Link>

      <div className="mt-8">
         <Link href="/auth/login" className="text-[#848D97] hover:text-white transition-colors text-xs uppercase tracking-widest font-bold">
            {t('AUTH_RETURN_TO_TERMINAL')}
         </Link>
      </div>
    </div>
  );
}
