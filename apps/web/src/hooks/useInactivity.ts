'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface InactivityOptions {
  timeoutMs: number;
  warningThresholdMs: number;
  onLogout: () => void;
  onActivity?: () => void;
}

export function useInactivity({
  timeoutMs = 15 * 60 * 1000,
  warningThresholdMs = 60 * 1000,
  onLogout,
  onActivity
}: InactivityOptions) {
  const [isWarning, setIsWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(warningThresholdMs / 1000);
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const resetTimer = useCallback((broadcast = true) => {
    setIsWarning(false);
    setTimeLeft(warningThresholdMs / 1000);
    lastActivityRef.current = Date.now();

    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    timerRef.current = setTimeout(() => {
      setIsWarning(true);
      startCountdown();
    }, timeoutMs - warningThresholdMs);

    if (broadcast && channelRef.current) {
      channelRef.current.postMessage({ type: 'ACTIVITY', timestamp: Date.now() });
    }

    if (onActivity) onActivity();
  }, [timeoutMs, warningThresholdMs, onActivity]);

  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setTimeLeft(warningThresholdMs / 1000);
    
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [warningThresholdMs, onLogout]);

  useEffect(() => {
    // Multi-tab synchronization
    channelRef.current = new BroadcastChannel('auth_session');
    channelRef.current.onmessage = (event) => {
      if (event.data.type === 'ACTIVITY') {
        resetTimer(false);
      } else if (event.data.type === 'LOGOUT') {
        onLogout();
      }
    };

    const handleActivity = () => {
      // Throttle activity recording to every 2 seconds
      if (Date.now() - lastActivityRef.current > 2000) {
        resetTimer(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // If coming back from hidden, check if we should have logged out
        const inactiveTime = Date.now() - lastActivityRef.current;
        if (inactiveTime >= timeoutMs) {
          onLogout();
        } else if (inactiveTime >= timeoutMs - warningThresholdMs) {
          setIsWarning(true);
          const remaining = Math.max(0, Math.floor((timeoutMs - inactiveTime) / 1000));
          setTimeLeft(remaining);
          startCountdown();
        } else {
          resetTimer(false);
        }
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => window.addEventListener(event, handleActivity));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetTimer(false);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      events.forEach(event => window.removeEventListener(event, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channelRef.current) channelRef.current.close();
    };
  }, [resetTimer, timeoutMs, warningThresholdMs, onLogout]);

  return {
    isWarning,
    timeLeft,
    extendSession: () => resetTimer(true)
  };
}
