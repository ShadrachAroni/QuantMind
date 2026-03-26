'use client';

import { useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useSyncStore } from '@/store/syncStore';
import { Portfolio, SimulationResult } from '@quantmind/shared-types';

export function useRealtimeSync() {
  const supabase = createClient();
  const {
    profile,
    isOnline,
    syncQueue,
    setOnline,
    setPortfolios,
    setSimulations,
    setProfile,
    updateLocalPortfolio,
    deleteLocalPortfolio,
    updateLocalProfile,
    removeOperation
  } = useSyncStore();

  const fetchInitialData = useCallback(async (userId: string) => {
    console.log('[Sync] Fetching initial data for user:', userId);
    
    // Fetch portfolios
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (portfolios) setPortfolios(portfolios as Portfolio[]);

    // Fetch simulations
    const { data: simulations } = await supabase
      .from('simulations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (simulations) setSimulations(simulations as any[]);
  }, [supabase, setPortfolios, setSimulations]);

  const processQueue = useCallback(async () => {
    if (!isOnline || syncQueue.length === 0) return;

    console.log(`[Sync] Processing ${syncQueue.length} queued operations...`);
    const queue = [...syncQueue].sort((a, b) => a.timestamp - b.timestamp);

    for (const op of queue) {
      try {
        let error;
        if (op.action === 'INSERT') {
          ({ error } = await supabase.from(op.table).insert(op.payload));
        } else if (op.action === 'UPDATE') {
          ({ error } = await supabase.from(op.table).update(op.payload).eq('id', op.payload.id));
        } else if (op.action === 'DELETE') {
          ({ error } = await supabase.from(op.table).delete().eq('id', op.payload.id));
        }

        if (!error) {
          removeOperation(op.id);
        } else {
          console.error(`[Sync] Operation ${op.id} failed:`, error);
        }
      } catch (err) {
        console.error(`[Sync] Critical error processing ${op.id}:`, err);
        break; 
      }
    }
  }, [isOnline, syncQueue, supabase, removeOperation]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  useEffect(() => {
    if (!profile?.id) return;

    fetchInitialData(profile.id);

    console.log(`[Sync] Initializing realtime subscriptions for user: ${profile.id}`);

    const channel = supabase
      .channel(`sync-all-${profile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles', filter: `id=eq.${profile.id}` },
        (payload) => {
          console.log('[Sync] Profile change received:', payload.eventType);
          if (payload.new) updateLocalProfile(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portfolios', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          console.log('[Sync] Portfolio change received:', payload.eventType);
          if (payload.eventType === 'DELETE') {
            deleteLocalPortfolio(payload.old.id);
          } else if (payload.new) {
            updateLocalPortfolio(payload.new as Portfolio);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'simulations', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          console.log('[Sync] Simulation change received:', payload.eventType);
          // Auto-refresh simulations or update specific ones
          fetchInitialData(profile.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, supabase, updateLocalProfile, updateLocalPortfolio, deleteLocalPortfolio, fetchInitialData]);

  return { isOnline };
}
