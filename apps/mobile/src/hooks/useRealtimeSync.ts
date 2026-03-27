import { useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useSyncStore } from '../store/syncStore';
import { Portfolio } from '@quantmind/shared-types';

// Network state check
const IS_OFFLINE_BYPASS = false;

export function useRealtimeSync(userId: string | undefined) {
  const {
    profile,
    isOnline,
    syncQueue,
    setOnline,
    setPortfolios,
    setSimulations,
    updateLocalPortfolio,
    deleteLocalPortfolio,
    updateLocalProfile,
    removeOperation,
    setMaintenanceMode
  } = useSyncStore();

  const fetchMaintenanceMode = useCallback(async () => {
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();
    if (data) setMaintenanceMode(data.value === 'true');
  }, [setMaintenanceMode]);

  const fetchInitialData = useCallback(async (uid: string) => {
    console.log('[Mobile Sync] Fetching initial data for user:', uid);
    
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    
    if (portfolios) setPortfolios(portfolios as Portfolio[]);
    
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', uid)
      .single();
    
    if (profileData) updateLocalProfile(profileData);

    const { data: simulations } = await supabase
      .from('simulations')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (simulations) setSimulations(simulations as any[]);
  }, [setPortfolios, setSimulations]);

  const processQueue = useCallback(async () => {
    if (!isOnline || syncQueue.length === 0) return;

    console.log(`[Mobile Sync] Processing ${syncQueue.length} queued operations...`);
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
          console.error(`[Mobile Sync] Operation ${op.id} failed:`, error);
        }
      } catch (err) {
        console.error(`[Mobile Sync] Critical error processing ${op.id}:`, err);
        break; 
      }
    }
  }, [isOnline, syncQueue, removeOperation]);

  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  useEffect(() => {
    // Note: window.addEventListener is a web API and causes crashes in native environments.
    // For now, we rely on the initial store state. In a real native environment, 
    // @react-native-community/netinfo or expo-network should be used here.
    setOnline(true);
  }, [setOnline]);

  useEffect(() => {
    fetchMaintenanceMode();
    if (!userId) return;

    fetchInitialData(userId);

    console.log(`[Mobile Sync] Initializing realtime subscriptions for user: ${userId}`);

    const channel = supabase
      .channel(`sync-mobile-global`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_config', filter: `key=eq.maintenance_mode` },
        () => {
          console.log('[Mobile Sync] Maintenance mode update received');
          fetchMaintenanceMode();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles', filter: `id=eq.${userId}` },
        (payload) => {
          console.log('[Mobile Sync] Profile change received:', payload.eventType);
          if (payload.new) updateLocalProfile(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portfolios', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('[Mobile Sync] Portfolio change received:', payload.eventType);
          if (payload.eventType === 'DELETE') {
            deleteLocalPortfolio(payload.old.id);
          } else if (payload.new) {
            updateLocalPortfolio(payload.new as Portfolio);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'simulations', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('[Mobile Sync] Simulation change received:', payload.eventType);
          fetchInitialData(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, updateLocalProfile, updateLocalPortfolio, deleteLocalPortfolio, fetchInitialData]);

  return { isOnline };
}
