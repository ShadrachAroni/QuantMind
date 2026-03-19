import { create } from 'zustand';
import { Asset, Portfolio } from '@quantmind/shared-types';
import { api } from '../services/api';

interface PortfolioState {
  portfolios: Portfolio[];
  isLoading: boolean;
  error: string | null;
  fetchPortfolios: () => Promise<void>;
  createPortfolio: (name: string, description: string, assets: Asset[]) => Promise<Portfolio>;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  portfolios: [],
  isLoading: false,
  error: null,

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
}));
