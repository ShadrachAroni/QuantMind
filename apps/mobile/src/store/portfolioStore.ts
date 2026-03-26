import { create } from 'zustand';
import { Asset, Portfolio } from '@quantmind/shared-types';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { useSyncStore } from './syncStore';

interface PortfolioState {
  isLoading: boolean;
  error: string | null;
  fetchPortfolios: () => Promise<void>;
  createPortfolio: (name: string, description: string, assets: Asset[]) => Promise<any>;
  deletePortfolio: (id: string) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>()(
  (set, get) => ({
    isLoading: false,
    error: null,

    fetchPortfolios: async () => {
      const { setPortfolios } = useSyncStore.getState();
      set({ isLoading: true, error: null });
      try {
        const data = await api.getPortfolios();
        setPortfolios(data as Portfolio[]);
      } catch (e: any) {
        set({ error: e.message || 'Failed to fetch portfolios' });
      } finally {
        set({ isLoading: false });
      }
    },

    createPortfolio: async (name, description, assets) => {
      const { addOperation, updateLocalPortfolio, isOnline } = useSyncStore.getState();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tempId = `temp-${Math.random().toString(36).substring(7)}`;
      const newPortfolio: any = {
        id: tempId,
        user_id: user.id,
        name,
        description,
        assets,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic update
      updateLocalPortfolio(newPortfolio);

      if (!isOnline) {
        addOperation({
          table: 'portfolios',
          action: 'INSERT',
          payload: { name, description, assets, user_id: user.id },
        });
        return newPortfolio;
      }

      set({ isLoading: true, error: null });
      try {
        const result = await api.createPortfolio(name, description, assets);
        updateLocalPortfolio(result); // Replace temp with real
        return result;
      } catch (e: any) {
        set({ error: e.message || 'Failed to create portfolio' });
        throw e;
      } finally {
        set({ isLoading: false });
      }
    },

    deletePortfolio: async (id) => {
      const { addOperation, deleteLocalPortfolio, isOnline } = useSyncStore.getState();
      
      // Optimistic delete
      deleteLocalPortfolio(id);

      if (!isOnline) {
        addOperation({
          table: 'portfolios',
          action: 'DELETE',
          payload: { id },
        });
        return;
      }

      try {
        await supabase.from('portfolios').delete().eq('id', id);
      } catch (e: any) {
        console.error('Failed to delete portfolio:', e);
      }
    }
  })
);

export const usePortfolios = () => useSyncStore(state => state.portfolios);

