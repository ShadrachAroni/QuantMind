import { create } from 'zustand';
import { SimulationParams, SimulationResult } from '@quantmind/shared-types';
import { api } from '../services/api';

interface SimulationState {
  currentStatus: 'idle' | 'running' | 'completed' | 'failed';
  currentJobId: string | null;
  result: SimulationResult | null;
  error: string | null;
  livePrices: Record<string, number>;
  
  runSimulation: (portfolioId: string, params: SimulationParams) => Promise<void>;
  pollStatus: (jobId: string) => Promise<void>;
  clearResult: () => void;
  updateLivePrice: (symbol: string, price: number) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  currentStatus: 'idle',
  currentJobId: null,
  result: null,
  error: null,
  livePrices: {},

  runSimulation: async (portfolioId, params) => {
    set({ currentStatus: 'running', error: null, result: null });
    try {
      const resp = await api.runSimulation(portfolioId, params);
      set({ currentJobId: resp.jobId });
      get().pollStatus(resp.jobId);
    } catch (e: any) {
      set({ currentStatus: 'failed', error: e.message || 'Simulation failed' });
    }
  },

  pollStatus: async (jobId: string) => {
    const pollInterval = 1500;
    
    const check = async () => {
      if (get().currentJobId !== jobId) return; // job changed or cancelled
      try {
        const resp = await api.getSimulationStatus(jobId);
        if (resp.status === 'completed') {
          set({ currentStatus: 'completed', result: resp.result });
        } else if (resp.status === 'failed') {
          set({ currentStatus: 'failed', error: resp.error_message });
        } else {
          setTimeout(check, pollInterval);
        }
      } catch (e: any) {
        set({ currentStatus: 'failed', error: e.message });
      }
    };
    
    setTimeout(check, pollInterval);
  },

  clearResult: () => set({ currentStatus: 'idle', result: null, currentJobId: null, error: null }),
  
  updateLivePrice: (symbol, price) => set((state) => ({ 
    livePrices: { ...state.livePrices, [symbol]: price } 
  })),
}));
