import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  unlocked: boolean;
  icon: string;
}

export interface RedeemableItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  category: 'persona' | 'utility' | 'subscription';
}

interface RewardState {
  points: number;
  level: number;
  achievements: Achievement[];
  storeItems: RedeemableItem[];
  isLoading: boolean;
  fetchRewards: () => Promise<void>;
  claimAchievement: (id: string) => Promise<void>;
  redeemItem: (id: string) => Promise<boolean>;
}

export const useRewardStore = create<RewardState>((set, get) => ({
  points: 0,
  level: 1,
  achievements: [],
  storeItems: [],
  isLoading: false,

  fetchRewards: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('points, level')
        .eq('id', user.id)
        .single();

      if (profile) {
        set({ points: profile.points || 0, level: profile.level || 1 });
      }

      set({
        achievements: [
          { id: '1', title: 'RISK_PIONEER', description: 'Run your first Monte Carlo simulation.', points: 100, unlocked: true, icon: 'activity' },
          { id: '2', title: 'SWARM_MASTER', description: 'Trigger 10 MiroFish social interactions.', points: 250, unlocked: false, icon: 'brain' },
          { id: '3', title: 'PORTFOLIO_HEALER', description: 'Apply 3 recommendations from the Doctor.', points: 500, unlocked: false, icon: 'shield' }
        ],
        storeItems: [
          { id: 'item_1', title: 'QUANT_WHALE_PERSONA', description: 'Unlock the high-impact whale agent for MiroFish.', cost: 2500, icon: 'user', category: 'persona' },
          { id: 'item_2', title: 'POWER_SHIFT_PACK', description: 'Instantly gain 5 extra Power Shifts.', cost: 1000, icon: 'zap', category: 'utility' },
          { id: 'item_3', title: 'PRO_CLEARANCE_7D', description: '7 days of unrestricted Pro access.', cost: 5000, icon: 'shield', category: 'subscription' }
        ]
      });
    } finally {
      set({ isLoading: false });
    }
  },

  claimAchievement: async (id: string) => {
    const achievement = get().achievements.find(a => a.id === id);
    if (achievement && !achievement.unlocked) {
      const newPoints = get().points + achievement.points;
      set({ points: newPoints });
      // Update DB logic here
    }
  },

  redeemItem: async (id: string) => {
    const item = get().storeItems.find(i => i.id === id);
    const { points } = get();
    
    if (item && points >= item.cost) {
      const newPoints = points - item.cost;
      set({ points: newPoints });
      // Here you would call a Supabase function to actually grant the item
      return true;
    }
    return false;
  }
}));
