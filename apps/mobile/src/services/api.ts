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
    const { data, error } = await supabase.functions.invoke('simulate', {
      body: { ...params },
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
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { message, context, workflow },
    });
    if (error) throw error;
    return data;
  }
};
