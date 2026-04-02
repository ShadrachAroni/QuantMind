'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useTranslation } from '@/lib/i18n';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const t = useTranslation();

  useEffect(() => {
    // Trigger a brief loading state on pathname changes
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 600);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="auth-layout min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#05070A] overflow-hidden">
      <LoadingOverlay visible={isTransitioning} message={t('AUTH_SYNCHRONIZING_VAULT')} />
      {/* Brand Panel (Left) */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="QuantMind" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-xl tracking-tighter text-white">QUANTMIND</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="font-serif text-5xl text-[#D4AF37] leading-tight mb-6">
            {t('AUTH_TAGLINE')}
          </h2>
          <p className="text-[#848D97] text-lg leading-relaxed">
            {t('AUTH_WELCOME_MSG')}
          </p>
        </div>

        <div className="relative z-10 pt-12 border-t border-white/5">
          <div className="flex items-center gap-6 text-[#848D97] text-sm uppercase tracking-widest font-medium">
            <span>{t('AUTH_ENCRYPTED')}</span>
            <span>{t('AUTH_2FA')}</span>
            <span>{t('AUTH_AUDIT')}</span>
          </div>
        </div>

        {/* Animated Background for Brand Panel */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#00D9FF]/10 rounded-full blur-[100px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#7C3AED]/10 rounded-full blur-[100px] animate-pulse-glow [animation-delay:2s]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
        </div>
      </div>

      {/* Form Container (Right) */}
      <div className="flex items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="QuantMind" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-lg tracking-tighter text-white">QUANTMIND</span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>

        {/* Ambient background for form side */}
        <div className="absolute inset-0 -z-10 bg-[#05070A]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00D9FF]/5 rounded-full blur-[120px] pointer-events-none" />
        </div>
      </div>

    </div>
  );
}
