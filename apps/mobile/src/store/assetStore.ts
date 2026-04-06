import { create } from 'zustand';
import { api } from '../services/api';
import { financialEngine, AssetPosition, ValuationResult } from '../services/financial-engine';

interface AssetStore {
  watchlist: string[];
  isLoading: boolean;
  error: string | null;
  valuation: ValuationResult | null;
  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (ticker: string) => Promise<void>;
  removeFromWatchlist: (ticker: string) => Promise<void>;
  calculatePortfolioValue: (positions: AssetPosition[]) => Promise<void>;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  watchlist: [],
  isLoading: false,
  error: null,
  valuation: null,

  fetchWatchlist: async () => {
    set({ isLoading: true, error: null });
    try {
      // We'll use supabase direct or extend api.ts
      // For now, let's assume api.ts has getWatchlist
      const data = await api.getWatchlist();
      set({ watchlist: data.tickers || [] });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addToWatchlist: async (ticker) => {
    const current = get().watchlist;
    if (current.includes(ticker)) return;
    
    const next = [...current, ticker];
    set({ watchlist: next }); // Optimistic update
    
    try {
      await api.updateWatchlist(next);
    } catch (e: any) {
      set({ watchlist: current, error: e.message }); // Rollback
    }
  },

  removeFromWatchlist: async (ticker) => {
    const current = get().watchlist;
    const next = current.filter(t => t !== ticker);
    set({ watchlist: next }); // Optimistic update
    
    try {
      await api.updateWatchlist(next);
    } catch (e: any) {
      set({ watchlist: current, error: e.message }); // Rollback
    }
  },

  calculatePortfolioValue: async (positions) => {
    set({ isLoading: true });
    try {
      const valuation = await financialEngine.valuePortfolio(positions);
      set({ valuation });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
