import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Portfolio, SimulationResult } from '@quantmind/shared-types';

interface SyncOperation {
  id: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: number;
}

interface SyncState {
  profile: any | null;
  portfolios: Portfolio[];
  simulations: SimulationResult[];
  syncQueue: SyncOperation[];
  isOnline: boolean;
  
  // Actions
  setProfile: (profile: any | null) => void;
  setPortfolios: (portfolios: Portfolio[]) => void;
  setSimulations: (simulations: SimulationResult[]) => void;
  setOnline: (online: boolean) => void;
  
  // Optimistic Updates & Sync Queue
  addOperation: (op: Omit<SyncOperation, 'id' | 'timestamp'>) => void;
  removeOperation: (id: string) => void;
  clearQueue: () => void;
  
  // Entity Handlers
  updateLocalProfile: (updates: Partial<any>) => void;
  updateLocalPortfolio: (portfolio: Portfolio) => void;
  deleteLocalPortfolio: (id: string) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      profile: null,
      portfolios: [],
      simulations: [],
      syncQueue: [],
      isOnline: typeof window !== 'undefined' ? window.navigator.onLine : true,

      setProfile: (profile) => set({ profile }),
      setPortfolios: (portfolios) => set({ portfolios }),
      setSimulations: (simulations) => set({ simulations }),
      setOnline: (isOnline) => set({ isOnline }),

      addOperation: (op) => {
        const newOp: SyncOperation = {
          ...op,
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
        };
        set((state) => ({ syncQueue: [...state.syncQueue, newOp] }));
      },

      removeOperation: (id) => {
        set((state) => ({ syncQueue: state.syncQueue.filter((op) => op.id !== id) }));
      },

      clearQueue: () => set({ syncQueue: [] }),

      updateLocalProfile: (updates) => {
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        }));
      },

      updateLocalPortfolio: (portfolio) => {
        set((state) => {
          const index = state.portfolios.findIndex((p) => p.id === portfolio.id);
          if (index >= 0) {
            const newPortfolios = [...state.portfolios];
            newPortfolios[index] = portfolio;
            return { portfolios: newPortfolios };
          }
          return { portfolios: [portfolio, ...state.portfolios] };
        });
      },

      deleteLocalPortfolio: (id) => {
        set((state) => ({
          portfolios: state.portfolios.filter((p) => p.id !== id),
        }));
      },
    }),
    {
      name: 'quantmind-sync-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profile: state.profile,
        portfolios: state.portfolios,
        simulations: state.simulations,
        syncQueue: state.syncQueue,
      }),
    }
  )
);
