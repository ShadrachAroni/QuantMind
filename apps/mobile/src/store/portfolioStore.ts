import { create } from 'zustand';
import { Asset, Portfolio } from '@quantmind/shared-types';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PortfolioState {
  portfolios: Portfolio[];
  isLoading: boolean;
  error: string | null;
  fetchPortfolios: () => Promise<void>;
  createPortfolio: (name: string, description: string, assets: Asset[]) => Promise<Portfolio>;
  subscribeToChanges: (userId: string) => void;
  unsubscribeFromChanges: () => void;
  subscription: RealtimeChannel | null;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: [],
  isLoading: false,
  error: null,
  subscription: null as RealtimeChannel | null,

  fetchPortfolios: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getPortfolios();
      set({ portfolios: data });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch portfolios' });
    } finally {
      set({ isLoading: false });
    }
  },

  createPortfolio: async (name, description, assets) => {
    set({ isLoading: true, error: null });
    try {
      const newPortfolio = await api.createPortfolio(name, description, assets);
      set((state) => ({ portfolios: [newPortfolio, ...state.portfolios] }));
      return newPortfolio;
    } catch (e: any) {
      set({ error: e.message || 'Failed to create portfolio' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToChanges: (userId) => {
    const { subscription } = get();
    if (subscription) subscription.unsubscribe();

    const channel = supabase
      .channel('portfolios-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolios',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Re-fetch data on any change
          get().fetchPortfolios();
        }
      )
      .subscribe();

    set({ subscription: channel });
  },

  unsubscribeFromChanges: () => {
    const { subscription } = get();
    if (subscription) {
      subscription.unsubscribe();
      set({ subscription: null });
    }
  },
}));
