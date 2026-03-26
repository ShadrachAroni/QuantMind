'use client';

import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { WifiOff, Wifi, Info, X } from 'lucide-react';

export function ConnectivityListener() {
  const [isOffline, setIsOffline] = useState(false);
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      
      toast.success('System Connectivity Restored', {
        description: 'Your connection is stable. All protocol synchronizations are active.',
        icon: <Wifi size={18} className="text-emerald-400" />,
        duration: 4000,
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      
      const id = toast.error('System Connectivity Lost', {
        description: 'Network link disrupted. QuantMind will attempt to resync once stable.',
        icon: <WifiOff size={18} className="text-rose-400" />,
        duration: Infinity,
        action: {
          label: 'DISMISS',
          onClick: () => toast.dismiss(id),
        },
      });
      
      toastIdRef.current = id;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return null;
}
