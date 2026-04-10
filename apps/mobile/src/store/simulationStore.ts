import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '../services/storage/mmkv';
import { SimulationParams, SimulationResult } from '@quantmind/shared-types';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SimulationState {
  currentStatus: 'idle' | 'running' | 'completed' | 'failed';
  currentJobId: string | null;
  result: SimulationResult | null;
  error: string | null;
  livePrices: Record<string, number>;
  jobSubscription: RealtimeChannel | null;
  
  runSimulation: (portfolioId: string, params: SimulationParams) => Promise<void>;
  subscribeToJob: (jobId: string) => void;
  unsubscribeFromJob: () => void;
  clearResult: () => void;
  updateLivePrice: (symbol: string, price: number) => void;
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      currentStatus: 'idle',
      currentJobId: null,
      result: null,
      error: null,
      livePrices: {},
      jobSubscription: null as RealtimeChannel | null,

      runSimulation: async (portfolioId, params) => {
        set({ currentStatus: 'running', error: null, result: null });
        try {
          const resp = await api.runSimulation(portfolioId, params);
          set({ currentJobId: resp.jobId });
          get().subscribeToJob(resp.jobId);
        } catch (e: any) {
          set({ currentStatus: 'failed', error: e.message || 'Simulation failed' });
        }
      },

      subscribeToJob: (jobId: string) => {
        const { jobSubscription } = get();
        if (jobSubscription) jobSubscription.unsubscribe();

        console.log(`[SimulationStore] Subscribing to job: ${jobId}`);
        const channel = supabase
          .channel(`job-${jobId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'simulations',
              filter: `id=eq.${jobId}`,
            },
            async (payload) => {
              const data = payload.new as any;
              console.log(`[SimulationStore] Job status update: ${data.status}`);
              if (data.status === 'completed') {
                set({ currentStatus: 'completed', result: data.result });
                get().unsubscribeFromJob();
              } else if (data.status === 'failed') {
                set({ currentStatus: 'failed', error: data.error_message || 'KERNEL_PANIC: Simulation failed.' });
                get().unsubscribeFromJob();
              }
            }
          )
          .subscribe();

        set({ jobSubscription: channel });
      },

      unsubscribeFromJob: () => {
        const { jobSubscription } = get();
        if (jobSubscription) {
          jobSubscription.unsubscribe();
          set({ jobSubscription: null });
        }
      },

      clearResult: () => set({ currentStatus: 'idle', result: null, currentJobId: null, error: null }),
      
      updateLivePrice: (symbol, price) => set((state) => ({ 
        livePrices: { ...state.livePrices, [symbol]: price } 
      })),
    }),
    {
      name: 'quantmind-simulation-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({ 
        result: state.result, 
        currentStatus: state.currentStatus, 
        currentJobId: state.currentJobId 
      }),
    }
  )
);

