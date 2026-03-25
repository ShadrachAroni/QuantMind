'use client';

import React from 'react';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'SYNCHRONIZING_SESSION...' }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#05070A]/80 backdrop-blur-md">
      <div className="relative mb-8">
        <div className="w-12 h-12 bg-[#00D9FF] rounded-sm rotate-45 flex items-center justify-center animate-spin-slow shadow-[0_0_30px_rgba(0,217,255,0.6)]">
          <div className="w-6 h-6 bg-[#05070A] rounded-sm" />
        </div>
        {/* Orbiting particles */}
        <div className="absolute inset-0 -m-4 border border-[#00D9FF]/30 rounded-full animate-ping opacity-20" />
      </div>
      
      <div className="text-center">
        <p className="font-mono text-[#00D9FF] text-sm tracking-[0.2em] mb-2 uppercase animate-pulse">
          {message}
        </p>
        <div className="flex justify-center gap-1">
          <div className="w-1 h-1 bg-[#00D9FF] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1 h-1 bg-[#00D9FF] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1 h-1 bg-[#00D9FF] rounded-full animate-bounce" />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(45deg); }
          to { transform: rotate(405deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
