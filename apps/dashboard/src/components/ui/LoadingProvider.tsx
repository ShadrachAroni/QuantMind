'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { globalAudioEngine } from '../../lib/audioEngine';
import { HoloLoader } from './HoloLoader';

interface LoadingContextType {
  isLoading: boolean;
  progress: number;
  phase: string;
  isMuted: boolean;
  startLoading: (initialPhase?: string, estimatedMs?: number) => void;
  stopLoading: () => void;
  updateProgress: (progress: number, phaseText?: string) => void;
  toggleMute: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('INITIALIZING_SYSTEMS...');
  const [isMuted, setIsMuted] = useState(true); // Start muted by default to respect autoplay limits

  const timerRef = useRef<NodeJS.Timeout>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (globalAudioEngine) {
      globalAudioEngine.setMute(nextMuted);
      if (!nextMuted) {
        globalAudioEngine.initContext();
      }
    }
  };

  const startLoading = (initialPhase = 'INITIALIZING_SYSTEMS...', estimatedMs = 2000) => {
    setPhase(initialPhase);
    setProgress(0);
    setIsLoading(true);

    if (globalAudioEngine && !isMuted) {
      globalAudioEngine.startDrone();
    }

    // Auto progress simulation
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    const tickTime = estimatedMs / 100;
    progressIntervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 95) return 95; // Hold at 95% until explicitly stopped
        const increment = Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : 0;
        const next = Math.min(95, p + increment);

        if (next > p && globalAudioEngine && !isMuted && Math.random() > 0.7) {
          globalAudioEngine.playChirp();
        }

        return next;
      });
    }, tickTime);
  };

  const updateProgress = (newProgress: number, phaseText?: string) => {
    setProgress(newProgress);
    if (phaseText) setPhase(phaseText);
    if (globalAudioEngine && !isMuted) {
      globalAudioEngine.playChirp();
    }
  };

  const stopLoading = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    setProgress(100);
    setPhase('SEQUENCE_COMPLETE');

    if (globalAudioEngine && !isMuted) {
      globalAudioEngine.playChirp();
      globalAudioEngine.stopDrone();
    }

    timerRef.current = setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 800); // Wait for exit animation
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (globalAudioEngine) globalAudioEngine.stopDrone();
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, progress, phase, isMuted, startLoading, stopLoading, updateProgress, toggleMute }}>
      {children}
      {isLoading && (
        <HoloLoader progress={progress} phase={phase} isMuted={isMuted} onToggleMute={toggleMute} />
      )}
    </LoadingContext.Provider>
  );
}

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
