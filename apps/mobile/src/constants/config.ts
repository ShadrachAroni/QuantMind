import Constants from 'expo-constants';

export const CONFIG = {
  // Supabase
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  
  // Versions
  APP_VERSION: Constants.expoConfig?.version || '1.0.0',
  API_VERSION: 'v4.2',
  
  // Tiers (Fallbacks if remote config fails)
  DEFAULT_TIER_CONFIG: {
    free: { maxPaths: 1000, dailyPowerShifts: 3, model: 'Monte Carlo', oracle: 'GPT-4o Mini', allowAdvancedModels: false, allowAIOracle: false },
    plus: { maxPaths: 10000, dailyPowerShifts: 5, model: 'Optimized GBM', oracle: 'Claude 3.5 Sonnet', allowAdvancedModels: false, allowAIOracle: false },
    pro: { maxPaths: 100000, dailyPowerShifts: 15, model: 'Fat-Tail (Levy)', oracle: 'Claude 3 Opus', allowAdvancedModels: true, allowAIOracle: true },
    student: { maxPaths: 10000, dailyPowerShifts: 5, model: 'Optimized GBM', oracle: 'Claude 3.5 Sonnet', allowAdvancedModels: false, allowAIOracle: false }
  },
  
  // Cache Times
  CACHE_TTL_CONFIG: 3600, // 1 hour
  CACHE_TTL_MARKET: 60, // 1 minute
};
