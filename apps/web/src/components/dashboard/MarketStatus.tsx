'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function MarketStatus() {
  const [status, setStatus] = useState<'OPEN' | 'CLOSED' | 'PRE-MARKET'>('CLOSED');

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      
      // Get ET time (UTC-4 for March DST)
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const etTime = new Date(utc + (3600000 * -4));
      
      const day = etTime.getDay();
      const hours = etTime.getHours();
      const minutes = etTime.getMinutes();
      const timeInMins = hours * 60 + minutes;

      // Monday (1) to Friday (5)
      if (day >= 1 && day <= 5) {
        if (timeInMins >= 570 && timeInMins < 960) {
          // 9:30 AM - 4:00 PM ET
          setStatus('OPEN');
        } else if (timeInMins >= 240 && timeInMins < 570) {
          // 4:00 AM - 9:30 AM ET
          setStatus('PRE-MARKET');
        } else {
          setStatus('CLOSED');
        }
      } else {
        setStatus('CLOSED');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const config = {
    OPEN: { color: 'text-[#32D74B]', bg: 'bg-[#32D74B]/10', border: 'border-[#32D74B]/20', dot: 'bg-[#32D74B]' },
    CLOSED: { color: 'text-[#FF453A]', bg: 'bg-[#FF453A]/10', border: 'border-[#FF453A]/20', dot: 'bg-[#FF453A]' },
    'PRE-MARKET': { color: 'text-[#FFD60A]', bg: 'bg-[#FFD60A]/10', border: 'border-[#FFD60A]/20', dot: 'bg-[#FFD60A]' }
  };

  const { color, bg, border, dot } = config[status];

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-500",
      bg, border, color
    )}>
      <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dot)} />
      Market_{status}
    </div>
  );
}
