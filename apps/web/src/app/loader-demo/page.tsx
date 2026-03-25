'use client';

import React, { useState } from 'react';
import { FuturisticLoader, LoaderVariant } from '@/components/ui/FuturisticLoader';

export default function LoaderDemo() {
  const [loading, setLoading] = useState(false);
  const [variant, setVariant] = useState<LoaderVariant>('orbital');
  const [label, setLabel] = useState('SYSTEM_INITIALIZING');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');

  const showLoader = (v: LoaderVariant, msg: string) => {
    setVariant(v);
    setLabel(msg);
    setLoading(true);
    
    // Auto-hide after 3 seconds for demo purposes
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-white/10 pb-6">
          <h1 className="text-4xl font-bold tracking-tighter mb-2 bg-gradient-to-r from-[#00D9FF] to-[#FF00EA] bg-clip-text text-transparent">
            Futuristic Loader System
          </h1>
          <p className="text-gray-400 font-mono text-sm">QUANTMIND_VISUAL_ASSETS_V1.0</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Controls */}
          <section className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00D9FF] rounded-full animate-pulse" />
              Animation Variants
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => showLoader('orbital', 'SYNCING_ORBITAL_NODES')}
                className="p-4 rounded-xl border border-[#00D9FF]/30 hover:bg-[#00D9FF]/10 transition-all text-left group"
              >
                <div className="text-[#00D9FF] font-bold">Orbital</div>
                <div className="text-xs text-gray-500">Atomic structure</div>
              </button>
              
              <button 
                onClick={() => showLoader('core', 'POWERING_ENERGY_CORE')}
                className="p-4 rounded-xl border border-[#FF00EA]/30 hover:bg-[#FF00EA]/10 transition-all text-left"
              >
                <div className="text-[#FF00EA] font-bold">Energy Core</div>
                <div className="text-xs text-gray-500">Geometric pulse</div>
              </button>
              
              <button 
                onClick={() => showLoader('wave', 'PROCESSING_WAVE_DATA')}
                className="p-4 rounded-xl border border-[#00FF95]/30 hover:bg-[#00FF95]/10 transition-all text-left"
              >
                <div className="text-[#00FF95] font-bold">Particle Wave</div>
                <div className="text-xs text-gray-500">Dynamic spectrum</div>
              </button>
              
              <button 
                onClick={() => showLoader('rings', 'DECODING_LAYER_SIGNALS')}
                className="p-4 rounded-xl border border-white/30 hover:bg-white/10 transition-all text-left"
              >
                <div className="text-white font-bold">Expansion Rings</div>
                <div className="text-xs text-gray-500">Holographic rings</div>
              </button>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h2 className="text-xl font-semibold mb-4">Themes & Settings</h2>
              <div className="flex gap-4">
                <button 
                  onClick={() => setTheme('dark')}
                  className={`px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-white text-black' : 'border-white/20'}`}
                >
                  Dark Mode
                </button>
                <button 
                  onClick={() => setTheme('light')}
                  className={`px-4 py-2 rounded-lg border ${theme === 'light' ? 'bg-white text-black' : 'border-white/20'}`}
                >
                  Light Mode
                </button>
              </div>
            </div>
          </section>

          {/* Documentation Preview */}
          <section className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Component Features</h2>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-[#00D9FF]">✓</span> GPU-Accelerated CSS Animations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00D9FF]">✓</span> Zero-Asset Audio Feedback
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00D9FF]">✓</span> Responsive & Theme Aware
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00D9FF]">✓</span> Sub-50KB Payload
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00D9FF]">✓</span> Full ARIA Accessibility
              </li>
            </ul>
          </section>
        </div>
      </div>

      <FuturisticLoader 
        visible={loading}
        variant={variant}
        label={label}
        theme={theme}
        onHide={() => console.log('Loader hidden')}
      />
    </div>
  );
}
