/**
 * Feature Flags — Centralized toggle system for gradual rollout & A/B testing.
 * All new platform modules must be registered here.
 */

export type FeatureFlag =
  | 'risk_assessment'
  | 'big_data_analytics'
  | 'live_market_comparison'
  | 'financial_news'
  | 'n8n_automation'
  | 'ai_stock_screener'
  | 'earnings_interpreter'
  | 'risk_management_automation';

export type TierLevel = 'free' | 'student' | 'plus' | 'pro';

interface FeatureFlagConfig {
  enabled: boolean;
  requiredTier: TierLevel;
  rolloutPercentage: number; // 0-100 for A/B testing
  label: string;
}

const featureFlags: Record<FeatureFlag, FeatureFlagConfig> = {
  risk_assessment: {
    enabled: true,
    requiredTier: 'pro',
    rolloutPercentage: 100,
    label: 'Risk Assessment Module',
  },
  big_data_analytics: {
    enabled: true,
    requiredTier: 'pro',
    rolloutPercentage: 100,
    label: 'Big Data Analytics',
  },
  live_market_comparison: {
    enabled: true,
    requiredTier: 'pro',
    rolloutPercentage: 100,
    label: 'Live Market Comparison',
  },
  financial_news: {
    enabled: true,
    requiredTier: 'plus',
    rolloutPercentage: 100,
    label: 'Financial News Feed',
  },
  n8n_automation: {
    enabled: true,
    requiredTier: 'free',
    rolloutPercentage: 100,
    label: 'n8n Automation',
  },
  ai_stock_screener: {
    enabled: true,
    requiredTier: 'pro',
    rolloutPercentage: 100,
    label: 'AI Stock Screener',
  },
  earnings_interpreter: {
    enabled: true,
    requiredTier: 'pro',
    rolloutPercentage: 100,
    label: 'Earnings Interpreter',
  },
  risk_management_automation: {
    enabled: true,
    requiredTier: 'plus',
    rolloutPercentage: 100,
    label: 'Risk Management Automation',
  },
};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const config = featureFlags[flag];
  if (!config || !config.enabled) return false;
  if (config.rolloutPercentage >= 100) return true;
  // Simple deterministic rollout based on a hash
  const hash = flag.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (hash % 100) < config.rolloutPercentage;
}

export function getFeatureConfig(flag: FeatureFlag): FeatureFlagConfig {
  return featureFlags[flag];
}

export function getRequiredTier(flag: FeatureFlag): TierLevel {
  return featureFlags[flag]?.requiredTier || 'pro';
}

export function hasAccess(userTier: TierLevel, requiredTier: TierLevel): boolean {
  const tierPriority: Record<TierLevel, number> = {
    free: 0,
    student: 1,
    plus: 2,
    pro: 3,
  };
  return tierPriority[userTier] >= tierPriority[requiredTier];
}
