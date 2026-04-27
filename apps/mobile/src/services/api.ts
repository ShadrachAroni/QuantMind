import { supabase } from './supabase';
import { Asset, Portfolio, SimulationParams, SimulationResult } from '@quantmind/shared-types';

export const api = {
  async searchAssets(query: string) {
    const { data, error } = await supabase.functions.invoke('assets', {
      body: { q: query },
      method: 'GET',
    });
    if (error) throw error;
    return data.data;
  },

  async getAssetHistory(symbol: string) {
    const { data, error } = await supabase.functions.invoke('assets-history', {
      body: { symbol },
      method: 'GET',
    });
    if (error) throw error;
    return data;
  },

  async runSimulation(portfolioId: string, params: SimulationParams) {
    // Client-side anti-burst protection
    if ((window as any)._lastSimReq && Date.now() - (window as any)._lastSimReq < 2000) {
      throw new Error('Please wait 2 seconds between simulation requests.');
    }
    (window as any)._lastSimReq = Date.now();

    const body = { ...params, portfolio_id: portfolioId };
    const { data, error } = await supabase.functions.invoke('simulate', {
      body,
    });
    if (error) throw error;
    return data;
  },

  async runMiroFish(seed: string) {
    const { data, error } = await supabase.functions.invoke('simulate', {
      body: { simulation_type: 'mirofish', seed },
    });
    if (error) throw error;
    return data;
  },

  async getSimulationStatus(jobId: string) {
    const { data, error } = await supabase.functions.invoke('simulate-status', {
      body: { id: jobId },
      method: 'GET',
    });
    if (error) throw error;
    return data;
  },

  async getPortfolios() {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createPortfolio(name: string, description: string, assets: Asset[]) {
    const { data, error } = await supabase
      .from('portfolios')
      .insert([{ name, description, assets }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async aiChat(message: string, context?: any, workflow?: string) {
    // Client-side anti-burst protection
    if ((window as any)._lastChatReq && Date.now() - (window as any)._lastChatReq < 1000) {
       throw new Error('Please wait a moment before sending another message.');
    }
    (window as any)._lastChatReq = Date.now();

    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { message, context, workflow },
    });
    if (error) throw error;
    return data;
  },

  async getWatchlist() {
    const { data, error } = await supabase
      .from('watchlists')
      .select('tickers')
      .eq('name', 'DEFAULT_WATCHLIST')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows"
    return data || { tickers: [] };
  },

  async updateWatchlist(tickers: string[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('watchlists')
      .upsert({ 
        user_id: user.id,
        name: 'DEFAULT_WATCHLIST',
        tickers,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, name' });
    
    if (error) throw error;
  },

  async saveSnapshot(title: string, seed: string, log: any[], shock: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('simulation_snapshots')
      .insert([{
        user_id: user.id,
        title,
        seed_context: seed,
        interactions_log: log,
        sentiment_shock: shock
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async fetchMarketplace() {
    const { data, error } = await supabase
      .from('snapshot_listings')
      .select(`
        *,
        snapshot:simulation_snapshots(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async listSnapshot(snapshotId: string, price: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('snapshot_listings')
      .insert([{
        snapshot_id: snapshotId,
        seller_id: user.id,
        price_xp: price
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async buySnapshot(listingId: string, price: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. DEDUCT XP (In a real app, this should be an atomic RPC function)
    const { data: profile } = await supabase.from('user_profiles').select('points').eq('id', user.id).single();
    if (!profile || profile.points < price) throw new Error('INSUFFICIENT_FUNDS');

    await supabase.from('user_profiles').update({ points: profile.points - price }).eq('id', user.id);

    // 2. LOG SALE
    await supabase.from('snapshot_sales').insert([{ listing_id: listingId, buyer_id: user.id }]);

    return true;
  },

  async rebalancePortfolio(portfolioId: string, shock: number, snapshotId?: string) {
    const { data, error } = await supabase.rpc('rebalance_my_portfolio', {
      p_portfolio_id: portfolioId,
      p_shock: shock,
      p_snapshot_id: snapshotId
    });
    
    if (error) throw error;
    return data;
  }
};
