'use client';

import React from 'react';
import { LoadingOverlay } from './LoadingOverlay';

interface HoloLoaderProps {
  progress?: number;
  phase?: string;
  isMuted?: boolean;
  onToggleMute?: () => void;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function HoloLoader({ 
  progress = 0, 
  phase = 'INITIALIZING...', 
  isMuted = true, 
  onToggleMute = () => {}, 
  fullScreen = true,
  size = 'md'
}: HoloLoaderProps) {
  if (fullScreen) {
    // Standardized fullscreen loading pattern
    return <LoadingOverlay visible={true} message={phase} />;
  }

  // Inline loading fallback (smaller version of the standardized pattern)
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-125' : ''}`}>
      <div className="relative mb-4">
        <div className="w-8 h-8 bg-[#00D9FF] rounded-sm rotate-45 flex items-center justify-center animate-spin-slow shadow-[0_0_20px_rgba(0,217,255,0.4)]">
          <div className="w-4 h-4 bg-transparent border border-[#05070A]/30 rounded-sm" />
        </div>
      </div>
      <p className="font-mono text-[#00D9FF] text-[10px] tracking-[0.2em] uppercase animate-pulse">
        {phase}
      </p>
      
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
