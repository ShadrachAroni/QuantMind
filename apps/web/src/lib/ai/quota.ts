import { SupabaseClient } from '@supabase/supabase-js';

export interface AIQuotaStatus {
  allowed: boolean;
  limit: number;
  usage: number;
  remaining: number;
  isCustomNode: boolean;
}

/**
 * Checks if a user is within their AI quota.
 */
export async function checkAIQuota(
  supabase: SupabaseClient,
  userId: string,
  isUsingCustomNode: boolean
): Promise<AIQuotaStatus> {
  if (isUsingCustomNode) {
    return { allowed: true, limit: -1, usage: 0, remaining: -1, isCustomNode: true };
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('ai_daily_usage_count, ai_token_quota_override, ai_last_usage_at, tier')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error('PROFILE_NOT_FOUND');
  }

  const quotaLimit = profile.ai_token_quota_override || 
    (profile.tier === 'pro' ? 100 : profile.tier === 'plus' ? 50 : 10);
  
  let currentUsage = profile.ai_daily_usage_count || 0;
  const lastUsageDate = profile.ai_last_usage_at ? new Date(profile.ai_last_usage_at).toDateString() : null;
  const todayDate = new Date().toDateString();

  // Reset usage logic (local calculation)
  if (lastUsageDate !== todayDate) {
    currentUsage = 0;
  }

  return {
    allowed: currentUsage < quotaLimit,
    limit: quotaLimit,
    usage: currentUsage,
    remaining: Math.max(0, quotaLimit - currentUsage),
    isCustomNode: false
  };
}

/**
 * Logs an AI session and increments the usage counter using the system RPC.
 */
export async function logAIUsage(
  supabase: SupabaseClient,
  userId: string,
  modelId: string,
  tokensIn: number = 0,
  tokensOut: number = 0,
  latencyMs: number = 0
) {
  const { error } = await supabase.rpc('log_ai_session_with_quota', {
    user_id_val: userId,
    model_id_val: modelId,
    tokens_in_val: tokensIn,
    tokens_out_val: tokensOut,
    latency_ms_val: latencyMs
  });

  if (error) {
    console.warn('[AI_QUOTA_LOG_NON_FATAL_ERROR]', error);
  }
}
