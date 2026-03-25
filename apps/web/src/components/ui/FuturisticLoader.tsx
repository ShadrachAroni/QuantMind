'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styles from './FuturisticLoader.module.css';

export type LoaderVariant = 'orbital' | 'core' | 'wave' | 'rings';

interface FuturisticLoaderProps {
  visible: boolean;
  variant?: LoaderVariant;
  label?: string;
  statusMessage?: string;
  showSound?: boolean;
  onShow?: () => void;
  onHide?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

export function FuturisticLoader({
  visible,
  variant = 'orbital',
  label = 'SYSTEM_INITIALIZING',
  statusMessage = 'PROCESSING_DATA_STREAMS...',
  showSound = true,
  onShow,
  onHide,
  theme = 'auto',
  className = '',
}: FuturisticLoaderProps) {
  const [active, setActive] = useState(visible);

  // Sound Engine (Digital Ping)
  const playSound = useCallback(() => {
    if (!showSound || typeof window === 'undefined') return;
    
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      
      setTimeout(() => ctx.close(), 200);
    } catch (e) {
      console.warn('AudioContext not supported or blocked');
    }
  }, [showSound]);

  useEffect(() => {
    if (visible) {
      setActive(true);
      playSound();
      onShow?.();
    } else {
      setTimeout(() => {
        setActive(false);
        onHide?.();
      }, 400); // Wait for fade-out animation
    }
  }, [visible, playSound, onShow, onHide]);

  if (!active && !visible) return null;

  const renderVariant = () => {
    switch (variant) {
      case 'orbital':
        return (
          <div className={styles.orbital}>
            <div className={`${styles.orbit} ${styles.orbit1}`}>
              <div className={`${styles.satellite} ${styles.sat1}`} />
            </div>
            <div className={`${styles.orbit} ${styles.orbit2}`}>
              <div className={`${styles.satellite} ${styles.sat2}`} />
            </div>
            <div className={`${styles.orbit} ${styles.orbit3}`}>
              <div className={`${styles.satellite} ${styles.sat3}`} />
            </div>
          </div>
        );
      case 'core':
        return (
          <div className={styles.core}>
            <div className={styles.scanner} />
            <div className={styles.nucleus}>
              <div className={styles.cubeSide} style={{ transform: 'rotateY(0deg) translateZ(25px)' }} />
              <div className={styles.cubeSide} style={{ transform: 'rotateY(90deg) translateZ(25px)' }} />
              <div className={styles.cubeSide} style={{ transform: 'rotateY(180deg) translateZ(25px)' }} />
              <div className={styles.cubeSide} style={{ transform: 'rotateY(-90deg) translateZ(25px)' }} />
              <div className={styles.cubeSide} style={{ transform: 'rotateX(90deg) translateZ(25px)' }} />
              <div className={styles.cubeSide} style={{ transform: 'rotateX(-90deg) translateZ(25px)' }} />
            </div>
            <div className={styles.dataDots}>
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className={styles.dot} 
                  style={{ 
                    top: `${((i * 17) % 90) + 5}%`, 
                    left: `${((i * 31) % 90) + 5}%`,
                    animationDelay: `${(i * 0.35) % 2}s`
                  }} 
                />
              ))}
            </div>
          </div>
        );
      case 'wave':
        return (
          <div className={styles.wave}>
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className={styles.bar} 
                style={{ 
                  animationDelay: `${i * 0.08}s`,
                  background: i % 2 === 0 ? 'var(--loader-primary)' : 'var(--loader-secondary)'
                }} 
              />
            ))}
          </div>
        );
      case 'rings':
        return (
          <div className={styles.rings}>
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className={styles.ring} 
                style={{ 
                  animationDelay: `${i * 0.8}s`,
                  borderColor: i % 2 === 0 ? 'var(--loader-primary)' : 'var(--loader-secondary)'
                }} 
              />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={`${styles.overlay} ${!visible ? styles.hidden : ''} ${className}`}
      data-theme={theme === 'auto' ? undefined : theme}
      role="status"
      aria-busy={visible}
      aria-live="polite"
      aria-label={label}
    >
      <div className={styles.container}>
        {renderVariant()}
      </div>
      
      <div className={styles.content}>
        <div className={styles.label}>{label}</div>
        <div className={styles.status}>{statusMessage}</div>
      </div>

      {/* Decorative corners */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: '40px',
        height: '40px',
        borderLeft: '1px solid var(--loader-primary)',
        borderTop: '1px solid var(--loader-primary)',
        opacity: 0.3
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: '40px',
        height: '40px',
        borderRight: '1px solid var(--loader-primary)',
        borderBottom: '1px solid var(--loader-primary)',
        opacity: 0.3
      }} />
    </div>
  );
}
