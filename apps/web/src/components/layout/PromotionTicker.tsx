'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Bell, ShieldCheck } from 'lucide-react';

interface SystemEvent {
  id: string;
  event_type: string;
  message: string;
}

export function PromotionTicker() {
  const [events, setEvents] = useState<SystemEvent[]>([
    { id: 'env_1', event_type: 'system', message: 'COGNITIVE_RELAY_ESTABLISHED' },
    { id: 'env_2', event_type: 'info', message: 'MARKET_DATA_STREAM_SYNCED' },
  ]);

  const supabase = createClient();

  useEffect(() => {
    async function fetchInitialEvents() {
      const { data } = await supabase
        .from('system_events')
        .select('id, event_type, message')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data && data.length > 0) {
        setEvents(data);
      }
    }

    fetchInitialEvents();

    // Realtime subscription to system_events (Section 14.1)
    const channel = supabase
      .channel('public:system_events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_events' }, (payload) => {
        const newEvent = payload.new as SystemEvent;
        setEvents(prev => [newEvent, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (events.length === 0) return null;

  return (
    <div className="h-8 bg-[#00D9FF]/5 border-y border-[#00D9FF]/10 flex items-center overflow-hidden px-6">
      <div className="flex items-center gap-2 shrink-0 mr-8 text-[#00D9FF]">
        <Bell size={12} className="animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Live_Feed</span>
      </div>
      
      <div className="flex items-center gap-12 animate-scroll-promotion">
        {[...events, ...events].map((e, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[10px] font-mono text-white/60 tracking-wider">
              <span className="text-[#00D9FF]">[{e.event_type.toUpperCase()}]</span> {e.message}
            </span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll-promotion {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-promotion {
          animation: scroll-promotion 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
