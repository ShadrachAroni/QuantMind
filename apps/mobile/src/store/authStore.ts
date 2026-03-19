import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { User } from '@quantmind/shared-types';

interface AuthState {
  user: User | null;
  tier: string;
  initialized: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setTier: (tier: string) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tier: 'free',
  initialized: false,
  isLoading: true,

  setUser: (user) => set({ user }),
  setTier: (tier) => set({ tier }),

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Cast Supabase User to our Shared User (simplified for now)
      set({ user: session?.user as any || null });

      if (session?.user) {
        // Fetch profile to get tier
        const { data } = await supabase
          .from('user_profiles')
          .select('tier')
          .eq('id', session.user.id)
          .single();
        if (data?.tier) set({ tier: data.tier });
      }
    } catch (e) {
      console.error('Auth initialization error', e);
    } finally {
      set({ initialized: true, isLoading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user as any || null });
      if (session?.user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('tier')
          .eq('id', session.user.id)
          .single();
        if (data?.tier) set({ tier: data.tier });
      } else {
        set({ tier: 'free' });
      }
    });
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, tier: 'free', isLoading: false });
  },

  completeOnboarding: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      set((state) => ({
        user: state.user ? {
          ...state.user,
          metadata: { ...state.user.metadata, onboarding_completed: true }
        } : null
      }));
    } catch (e) {
      console.error('Failed to complete onboarding', e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
