'use client';

import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Cpu, Activity, Zap } from 'lucide-react';

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
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (!fullScreen) return; // Only do matrix particles on fullscreen to save performance
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
      opacity: Math.random() * 0.5 + 0.1
    }));
    setParticles(newParticles);
  }, [fullScreen]);

  return (
    <div className={`holo-loader-container ${fullScreen ? 'fullscreen' : 'inline-mode'} size-${size}`} role="alert" aria-busy="true" aria-live="polite">
      {fullScreen && <div className="bg-grid"></div>}

      {fullScreen && (
        <div className="particles-container">
          {particles.map((p) => (
            <div 
              key={p.id} 
              className="particle-stream mono"
              style={{ 
                left: `${p.x}%`, 
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                opacity: p.opacity
              }}
            >
              {Math.random() > 0.5 ? '1' : '0'}
            </div>
          ))}
        </div>
      )}

      <div className={`core-wrapper ${
        size === 'sm' ? 'scale-[0.3]' : 
        size === 'lg' ? 'scale-[1.5]' : 
        fullScreen ? 'scale-100' : 'scale-50'
      }`}>
        <div className="ring ring-outer"></div>
        <div className="ring ring-middle"></div>
        <div className="ring ring-inner"></div>
        <div className="energy-core">
          <Cpu className="text-white relative z-10 core-icon" size={32} />
        </div>
      </div>

      <div className="readout-container">
        <div className="flex items-center gap-3 mb-2 justify-center">
          <Activity size={16} className="text-cyan-400 animate-pulse" />
          <span className="mono text-[10px] text-cyan-400 tracking-[4px] uppercase">{phase}</span>
        </div>
        
        {fullScreen && (
          <>
            <div className="progress-display">
              <span className="percentage font-black">{Math.round(progress)}</span>
              <span className="percent-symbol text-cyan-500">%</span>
            </div>
            
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              <div className="progress-bar-glow" style={{ left: `${progress}%` }}></div>
            </div>

            <div className="flex justify-between mt-4">
               <span className="mono text-[9px] text-gray-500 uppercase tracking-widest">Est. Rem <span className="text-gray-300">{Math.max(0, (100 - progress) * 0.05).toFixed(1)}s</span></span>
               <span className="mono text-[9px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
                 <Zap size={10} className="text-purple-500" />
                 Quantum Link Secure
               </span>
            </div>
          </>
        )}
      </div>

      {fullScreen && (
        <button 
          className="sound-toggle-btn group"
          onClick={onToggleMute}
          aria-label={isMuted ? "Enable system sounds" : "Mute system sounds"}
        >
          {isMuted ? <VolumeX size={16} className="text-gray-500 group-hover:text-white transition-colors" /> : <Volume2 size={16} className="text-cyan-400 animate-pulse" />}
          <span className="mono text-[9px] uppercase tracking-widest text-gray-400 ml-2">Sys_Audio</span>
        </button>
      )}

      <style jsx>{`
        .holo-loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: opacity 0.5s ease-out;
        }

        .holo-loader-container.fullscreen {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: radial-gradient(circle at center, #0B0F1A 0%, #050507 100%);
        }

        .holo-loader-container.inline-mode {
          position: relative;
          width: 100%;
          min-height: 200px;
          background: transparent;
        }

        .holo-loader-container.size-sm.inline-mode {
          min-height: 80px;
        }

        .holo-loader-container.size-lg.inline-mode {
          min-height: 400px;
        }

        .bg-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(0, 217, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 217, 255, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          perspective: 1000px;
          transform: rotateX(60deg) translateY(-100px) translateZ(-200px);
          animation: grid-move 20s linear infinite;
        }

        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }

        .particles-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .particle-stream {
          position: absolute;
          top: -20px;
          color: rgba(34, 211, 238, 0.4);
          font-size: 10px;
          text-shadow: 0 0 5px rgba(34, 211, 238, 0.8);
          animation: cascade linear infinite;
        }

        @keyframes cascade {
          0% { transform: translateY(-10vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh); opacity: 0; }
        }

        .core-wrapper {
          position: relative;
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 800px;
        }
        
        .holo-loader-container.fullscreen .core-wrapper {
          margin-bottom: 4rem;
        }

        .ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid transparent;
          transform-style: preserve-3d;
        }

        .ring-outer {
          width: 200px;
          height: 200px;
          border-top: 2px solid rgba(0, 217, 255, 0.8);
          border-bottom: 2px solid rgba(124, 58, 237, 0.8);
          box-shadow: 0 0 20px rgba(0, 217, 255, 0.2), inset 0 0 20px rgba(124, 58, 237, 0.2);
          animation: spin-axis-1 4s linear infinite;
        }

        .ring-middle {
          width: 150px;
          height: 150px;
          border-left: 2px solid rgba(124, 58, 237, 0.9);
          border-right: 2px solid rgba(0, 217, 255, 0.9);
          animation: spin-axis-2 3s linear infinite reverse;
        }

        .ring-inner {
          width: 100px;
          height: 100px;
          border: 1px dashed rgba(255, 255, 255, 0.5);
          animation: spin-axis-3 2s linear infinite;
        }

        .energy-core {
          position: absolute;
          width: 60px;
          height: 60px;
          background: radial-gradient(circle at center, #7C3AED 0%, transparent 70%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px #7C3AED, inset 0 0 20px #00D9FF;
          animation: core-pulse 2s ease-in-out infinite alternate;
        }
        
        .core-icon {
          animation: slow-spin 10s linear infinite;
        }

        @keyframes slow-spin { 100% { transform: rotate(360deg); } }

        @keyframes spin-axis-1 {
          0% { transform: rotateX(70deg) rotateZ(0deg); }
          100% { transform: rotateX(70deg) rotateZ(360deg); }
        }

        @keyframes spin-axis-2 {
          0% { transform: rotateY(60deg) rotateX(20deg) rotateZ(0deg); }
          100% { transform: rotateY(60deg) rotateX(20deg) rotateZ(360deg); }
        }

        @keyframes spin-axis-3 {
          0% { transform: rotateX(45deg) rotateY(45deg) rotateZ(0deg); }
          100% { transform: rotateX(45deg) rotateY(45deg) rotateZ(360deg); }
        }

        @keyframes core-pulse {
          0% { transform: scale(0.9); opacity: 0.8; box-shadow: 0 0 20px #7C3AED; }
          100% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 50px #7C3AED, 0 0 30px #00D9FF; }
        }

        .readout-container {
          width: 320px;
          position: relative;
          z-index: 10;
          text-align: center;
        }

        .progress-display {
          display: flex;
          align-items:baseline;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .percentage {
          font-size: 3.5rem;
          color: #fff;
          text-shadow: 0 0 20px rgba(0, 217, 255, 0.5);
          line-height: 1;
        }

        .percent-symbol {
          font-size: 1.5rem;
          font-weight: 800;
          margin-left: 0.25rem;
        }

        .progress-bar-container {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #7C3AED, #00D9FF);
          transition: width 0.3s ease-out;
          box-shadow: 0 0 10px #00D9FF;
        }

        .progress-bar-glow {
          position: absolute;
          top: 0;
          width: 20px;
          height: 100%;
          background: #fff;
          filter: blur(4px);
          transform: translateX(-50%);
          transition: left 0.3s ease-out;
        }

        .sound-toggle-btn {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          display: flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: all 0.2s;
          z-index: 20;
        }

        .sound-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 217, 255, 0.3);
        }

        /* Accessibility: Reduced Motion Fallback */
        @media (prefers-reduced-motion: reduce) {
          .ring { display: none; }
          .particles-container { display: none; }
          .bg-grid { animation: none; transform: none; }
          .energy-core { animation: none; transform: scale(1); }
          .core-icon { animation: none; }
        }
      `}</style>
    </div>
  );
}
