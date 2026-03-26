import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { User } from '@quantmind/shared-types';
import { biometricService, BiometricType } from '../services/biometric';
import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../constants/config';
import { usePortfolioStore } from './portfolioStore';

const ACTIVITY_KEY = 'quantmind_last_activity';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 Hours in ms
const CACHE_TTL = 5 * 60 * 1000; // 5 Minutes in ms

export type AIPersona = 'DEFAULT' | 'AGGRESSIVE' | 'CONSERVATIVE' | 'INSTITUTIONAL';

export interface AIPrefs {
  ai_model: 'haiku' | 'sonnet' | 'opus';
  ai_expertise: 'beginner' | 'intermediate' | 'advanced';
  ai_portfolio_doctor: boolean;
  ai_voice_synthesis: boolean;
  ai_risk_alerts: boolean;
}

export interface AIConfig {
  id: string;
  provider: 'anthropic' | 'openai' | 'google' | 'custom';
  model_id: string;
  is_active: boolean;
  updated_at: string;
}

export interface ChangelogEntry {
  id: string;
  version: string;
  platform: string;
  category: 'feature' | 'fix' | 'performance' | 'security' | 'maintenance';
  title: string;
  description: string;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  user_groups: string[];
  is_breaking: boolean;
  created_at: string;
}

export type SubscriptionTier = 'free' | 'plus' | 'basic' | 'pro' | 'institution' | 'student';

export interface TierEntitlements {
  maxPaths: number;
  dailyPowerShifts: number;
  model: string;
  oracle: string;
  allowAdvancedModels: boolean;
  allowAIOracle: boolean;
}

export type TierConfig = Record<SubscriptionTier, TierEntitlements>;

interface AuthState {
  user: User | null;
  tier: string;
  isStudentVerified: boolean;
  aiPrefs: AIPrefs | null;
  aiPersona: AIPersona;
  aiRiskSensitivity: number;
  region: string;
  interfaceLanguage: string;
  mfaEmailEnabled: boolean;
  mfaPasskeyEnabled: boolean;
  aiConfigs: AIConfig[];
  changelog: ChangelogEntry[];
  initialized: boolean;
  isLoading: boolean;
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  biometricType: BiometricType;
  hasPromptedBiometrics: boolean;
  needsTosConsent: boolean;
  latestTosVersion: string | null;
  lastActivityAt: number | null;
  powerShifts: number;
  lastPowerShiftReset: string | null;
  tierConfigs: TierConfig;
  subscriptionPlans: any[];
  systemEvents: any[];
  lastConfigsFetch: number | null;
  lastPlansFetch: number | null;
  setUser: (user: User | null) => void;
  setTier: (tier: string) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateAIPreferences: (prefs: AIPrefs) => Promise<void>;
  updateAIPersona: (persona: AIPersona) => Promise<void>;
  updateAIRiskSensitivity: (sensitivity: number) => Promise<void>;
  checkBiometricCompatibility: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  enrollBiometrics: () => Promise<boolean>;
  biometricLogin: () => Promise<void>;
  acceptTerms: (ipAddress: string) => Promise<void>;
  recordActivity: () => Promise<void>;
  checkSessionExpiry: () => Promise<boolean>;
  usePowerShift: () => boolean;
  fetchTierConfigs: () => Promise<void>;
  fetchSubscriptionPlans: () => Promise<void>;
  fetchSystemEvents: () => Promise<void>;
  grantTrialReward: () => Promise<void>;
  hasUsedTrial: boolean;
  trialEndsAt: string | null;
  isPasswordExpired: boolean;
  passwordLastChangedAt: string | null;
  refreshPasswordExpiry: () => void;
  fetchAIConfigs: () => Promise<void>;
  saveAIConfig: (provider: string, modelId: string, apiKey: string) => Promise<void>;
  toggleAIConfig: (configId: string, active: boolean) => Promise<void>;
  deleteAIConfig: (configId: string) => Promise<void>;
  fetchChangelog: () => Promise<void>;
  profileSubscription: RealtimeChannel | null;
  updateRegion: (region: string) => Promise<void>;
  updateInterfaceLanguage: (lang: string) => Promise<void>;
  updateMFAEmail: (enabled: boolean) => Promise<void>;
  updateMFAPasskey: (enabled: boolean) => Promise<void>;
}

const DEFAULT_AI_PREFS: AIPrefs = {
  ai_model: 'haiku',
  ai_expertise: 'intermediate',
  ai_portfolio_doctor: true,
  ai_voice_synthesis: false,
  ai_risk_alerts: true,
};

async function fetchProfile(userId: string) {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

function mapSupabaseUser(user: any): User | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || '',
    created_at: user.created_at,
    email_verified: !!user.email_confirmed_at,
    tier: 'free',
    metadata: user.user_metadata || {},
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tier: 'free',
  isStudentVerified: false,
  aiPrefs: null,
  aiPersona: 'DEFAULT',
  aiRiskSensitivity: 50,
  region: 'US_EAST_NY',
  interfaceLanguage: 'ENGLISH_INTL',
  mfaEmailEnabled: false,
  mfaPasskeyEnabled: false,
  aiConfigs: [],
  changelog: [],
  initialized: false,
  isLoading: true,
  isBiometricSupported: false,
  isBiometricEnabled: false,
  biometricType: BiometricType.NONE,
  hasPromptedBiometrics: false,
  needsTosConsent: false,
  latestTosVersion: null,
  lastActivityAt: null,
  powerShifts: 0,
  lastPowerShiftReset: null,
  tierConfigs: CONFIG.DEFAULT_TIER_CONFIG as TierConfig,
  subscriptionPlans: [],
  systemEvents: [],
  lastConfigsFetch: null,
  lastPlansFetch: null,
  hasUsedTrial: false,
  trialEndsAt: null,
  isPasswordExpired: false,
  passwordLastChangedAt: null,
  profileSubscription: null,

  refreshPasswordExpiry: () => {
    const now = new Date().toISOString();
    set({ passwordLastChangedAt: now, isPasswordExpired: false });
  },

  setUser: (user: User | null) => set({ user }),
  setTier: (tier: string) => set({ tier }),

  initialize: async () => {
    try {
      const storedActivity = await SecureStore.getItemAsync(ACTIVITY_KEY);
      const lastActivity = storedActivity ? parseInt(storedActivity, 10) : null;
      set({ lastActivityAt: lastActivity });

      const { data: { session } } = await supabase.auth.getSession();
      set({ user: mapSupabaseUser(session?.user) });

      await get().fetchTierConfigs();
      await get().fetchSubscriptionPlans();
      await get().fetchSystemEvents();

      if (session?.user) {
        const data = await fetchProfile(session.user.id);
        if (data) {
          set({
            tier: data.tier ?? 'free',
            isStudentVerified: !!data.is_student_verified,
            aiPersona: (data.ai_persona as AIPersona) ?? 'DEFAULT',
            aiRiskSensitivity: data.ai_risk_sensitivity ?? 50,
            aiPrefs: {
              ai_model: data.ai_model ?? DEFAULT_AI_PREFS.ai_model,
              ai_expertise: data.ai_expertise ?? DEFAULT_AI_PREFS.ai_expertise,
              ai_portfolio_doctor: data.ai_portfolio_doctor ?? DEFAULT_AI_PREFS.ai_portfolio_doctor,
              ai_voice_synthesis: data.ai_voice_synthesis ?? DEFAULT_AI_PREFS.ai_voice_synthesis,
              ai_risk_alerts: data.ai_risk_alerts ?? DEFAULT_AI_PREFS.ai_risk_alerts,
            },
            region: data.region ?? 'US_EAST_NY',
            interfaceLanguage: data.interface_language ?? 'ENGLISH_INTL',
            mfaEmailEnabled: !!data.mfa_email_enabled,
            mfaPasskeyEnabled: !!data.mfa_passkey_enabled,
            hasUsedTrial: !!data.has_used_trial,
            trialEndsAt: data.trial_ends_at ?? null,
            passwordLastChangedAt: data.password_last_changed_at ?? null,
          });

          usePortfolioStore.getState().subscribeToChanges(session.user.id);

          const today = new Date().toISOString().split('T')[0];
          const lastReset = await SecureStore.getItemAsync('quantmind_powershift_reset');
          if (lastReset !== today) {
            const tier = data.tier ?? 'free';
            const configs = get().tierConfigs;
            const entitlements = configs[tier as SubscriptionTier] || configs.free;
            const shifts = entitlements.dailyPowerShifts;
            set({ powerShifts: shifts, lastPowerShiftReset: today });
            await SecureStore.setItemAsync('quantmind_powershift_reset', today);
            await SecureStore.setItemAsync('quantmind_powershifts', shifts.toString());
          } else {
            const savedShifts = await SecureStore.getItemAsync('quantmind_powershifts');
            set({ powerShifts: savedShifts ? parseInt(savedShifts, 10) : 0, lastPowerShiftReset: today });
          }
        }
      }
    } catch (e) {
      console.error('Auth initialization error', e);
    } finally {
      const isSupported = await biometricService.isCompatible();
      const isEnabled = await biometricService.isEnabled();
      const type = await biometricService.getSupportedTypes();
      const hasPrompted = await biometricService.hasBeenPrompted();

      set({ 
        initialized: true, 
        isLoading: false,
        isBiometricSupported: isSupported,
        isBiometricEnabled: isEnabled,
        biometricType: type,
        hasPromptedBiometrics: hasPrompted
      });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: mapSupabaseUser(session?.user) });
      if (session?.user) {
        const data = await fetchProfile(session.user.id);
        if (data) {
          set({
            tier: data.tier ?? 'free',
            isStudentVerified: !!data.is_student_verified,
            aiPersona: (data.ai_persona as AIPersona) ?? 'DEFAULT',
            aiRiskSensitivity: data.ai_risk_sensitivity ?? 50,
            aiPrefs: {
              ai_model: data.ai_model ?? DEFAULT_AI_PREFS.ai_model,
              ai_expertise: data.ai_expertise ?? DEFAULT_AI_PREFS.ai_expertise,
              ai_portfolio_doctor: data.ai_portfolio_doctor ?? DEFAULT_AI_PREFS.ai_portfolio_doctor,
              ai_voice_synthesis: data.ai_voice_synthesis ?? DEFAULT_AI_PREFS.ai_voice_synthesis,
              ai_risk_alerts: data.ai_risk_alerts ?? DEFAULT_AI_PREFS.ai_risk_alerts,
            },
            region: data.region ?? 'US_EAST_NY',
            interfaceLanguage: data.interface_language ?? 'ENGLISH_INTL',
            mfaEmailEnabled: !!data.mfa_email_enabled,
            mfaPasskeyEnabled: !!data.mfa_passkey_enabled,
          });
        }
      }
    });
  },

  updateRegion: async (region: string) => {
    const { user } = get();
    if (!user) return;
    const { error } = await supabase.from('user_profiles').update({ region }).eq('id', user.id);
    if (error) throw error;
    set({ region });
  },

  updateInterfaceLanguage: async (lang: string) => {
    const { user } = get();
    if (!user) return;
    const { error } = await supabase.from('user_profiles').update({ interface_language: lang }).eq('id', user.id);
    if (error) throw error;
    set({ interfaceLanguage: lang });
  },

  updateMFAEmail: async (enabled: boolean) => {
    const { user } = get();
    if (!user) return;
    const { error } = await supabase.from('user_profiles').update({ mfa_email_enabled: enabled }).eq('id', user.id);
    if (error) throw error;
    set({ mfaEmailEnabled: enabled });
  },

  updateMFAPasskey: async (enabled: boolean) => {
    const { user } = get();
    if (!user) return;
    const { error } = await supabase.from('user_profiles').update({ mfa_passkey_enabled: enabled }).eq('id', user.id);
    if (error) throw error;
    set({ mfaPasskeyEnabled: enabled });
  },

  updateAIPersona: async (persona: AIPersona) => {
    const { user } = get();
    if (!user) return;
    const { error } = await supabase.from('user_profiles').update({ ai_persona: persona }).eq('id', user.id);
    if (error) throw error;
    set({ aiPersona: persona });
  },

  updateAIRiskSensitivity: async (sensitivity: number) => {
    const { user } = get();
    if (!user) return;
    const { error } = await supabase.from('user_profiles').update({ ai_risk_sensitivity: sensitivity }).eq('id', user.id);
    if (error) throw error;
    set({ aiRiskSensitivity: sensitivity });
  },

  updateAIPreferences: async (prefs: AIPrefs) => {
    const { user } = get();
    if (!user) return;
    const { error } = await supabase.from('user_profiles').update({
      ai_model: prefs.ai_model,
      ai_expertise: prefs.ai_expertise,
      ai_portfolio_doctor: prefs.ai_portfolio_doctor,
      ai_voice_synthesis: prefs.ai_voice_synthesis,
      ai_risk_alerts: prefs.ai_risk_alerts,
    }).eq('id', user.id);
    if (error) throw error;
    set({ aiPrefs: prefs });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, tier: 'free', aiPrefs: null, initialized: false });
  },

  completeOnboarding: async () => {
    const { user } = get();
    if (!user) return;
    await supabase.from('user_profiles').update({ onboarding_completed: true }).eq('id', user.id);
  },

  checkBiometricCompatibility: async () => {
    const isSupported = await biometricService.isCompatible();
    const isEnabled = await biometricService.isEnabled();
    const type = await biometricService.getSupportedTypes();
    set({ isBiometricSupported: isSupported, isBiometricEnabled: isEnabled, biometricType: type });
  },

  setBiometricEnabled: async (enabled: boolean) => {
    await biometricService.setEnabled(enabled);
    set({ isBiometricEnabled: enabled });
  },

  enrollBiometrics: async () => {
    const success = await biometricService.authenticate('ENROLL_BIOMETRIC_ACCESS');
    if (success) {
      await biometricService.setEnabled(true);
      set({ isBiometricEnabled: true });
    }
    return success;
  },

  biometricLogin: async () => {
    const success = await biometricService.authenticate('BIOMETRIC_LOGIN');
    if (success) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) set({ user: mapSupabaseUser(session.user) });
    }
  },

  acceptTerms: async (ipAddress: string) => {
    const { user, latestTosVersion } = get();
    if (!user || !latestTosVersion) return;
    await supabase.from('user_profiles').update({ accepted_tos_version: latestTosVersion }).eq('id', user.id);
    set({ needsTosConsent: false });
  },

  recordActivity: async () => {
    const now = Date.now();
    set({ lastActivityAt: now });
    await SecureStore.setItemAsync(ACTIVITY_KEY, now.toString());
  },

  checkSessionExpiry: async () => {
    const { lastActivityAt } = get();
    if (!lastActivityAt) return false;
    if (Date.now() - lastActivityAt > SESSION_TIMEOUT) {
      await get().signOut();
      return true;
    }
    return false;
  },

  usePowerShift: () => {
    const { powerShifts } = get();
    if (powerShifts > 0) {
      const newShifts = powerShifts - 1;
      set({ powerShifts: newShifts });
      SecureStore.setItemAsync('quantmind_powershifts', newShifts.toString());
      return true;
    }
    return false;
  },

  fetchTierConfigs: async () => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'tier_config').single();
    if (data?.value) set({ tierConfigs: data.value as TierConfig });
  },

  fetchSubscriptionPlans: async () => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'subscription_plans').single();
    if (data?.value) set({ subscriptionPlans: data.value as any[] });
  },

  fetchSystemEvents: async () => {
    const { data } = await supabase.from('system_events').select('*').order('created_at', { ascending: false }).limit(10);
    set({ systemEvents: data || [] });
  },

  grantTrialReward: async () => {
    const { data } = await supabase.functions.invoke('grant-trial');
    if (data?.status === 'success') {
      set({ tier: 'plus', hasUsedTrial: true, trialEndsAt: data.trial_ends_at });
    }
  },

  fetchAIConfigs: async () => {
    const { user } = get();
    if (!user) return;
    const { data } = await supabase.from('user_ai_configs').select('*').eq('user_id', user.id);
    set({ aiConfigs: data || [] });
  },

  saveAIConfig: async (provider, modelId, apiKey) => {
    await supabase.rpc('save_user_ai_config', { p_provider: provider, p_model_id: modelId, p_api_key: apiKey });
    await get().fetchAIConfigs();
  },

  toggleAIConfig: async (configId, active) => {
    await supabase.from('user_ai_configs').update({ is_active: active }).eq('id', configId);
    await get().fetchAIConfigs();
  },

  deleteAIConfig: async (configId) => {
    await supabase.from('user_ai_configs').delete().eq('id', configId);
    await get().fetchAIConfigs();
  },

  fetchChangelog: async () => {
    const { data } = await supabase.from('changelog').select('*').order('created_at', { ascending: false });
    set({ changelog: data || [] });
  },
}));
