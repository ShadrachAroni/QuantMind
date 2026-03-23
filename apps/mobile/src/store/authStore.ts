import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { User } from '@quantmind/shared-types';
import { biometricService, BiometricType } from '../services/biometric';
import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../constants/config';

const ACTIVITY_KEY = 'quantmind_last_activity';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 Hours in ms
const CACHE_TTL = 5 * 60 * 1000; // 5 Minutes in ms

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
    .select('tier, is_student_verified, accepted_tos_version, ai_model, ai_expertise, ai_portfolio_doctor, ai_voice_synthesis, ai_risk_alerts, has_used_trial, trial_ends_at, password_last_changed_at')
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

  refreshPasswordExpiry: () => {
    const now = new Date().toISOString();
    set({ passwordLastChangedAt: now, isPasswordExpired: false });
  },

  setUser: (user: User | null) => set({ user }),
  setTier: (tier: string) => set({ tier }),

  initialize: async () => {
    try {
      // Load last activity from SecureStore
      const storedActivity = await SecureStore.getItemAsync(ACTIVITY_KEY);
      const lastActivity = storedActivity ? parseInt(storedActivity, 10) : null;
      set({ lastActivityAt: lastActivity });

      const { data: { session } } = await supabase.auth.getSession();
      set({ user: mapSupabaseUser(session?.user) });

      // Fetch remote config and events
      await get().fetchTierConfigs();
      await get().fetchSubscriptionPlans();
      await get().fetchSystemEvents();

      // Fetch latest active ToS version
      const { data: tosData } = await supabase
        .from('tos_versions')
        .select('version')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      const latestVersion = tosData?.version || null;
      set({ latestTosVersion: latestVersion });

      if (session?.user) {
        const data = await fetchProfile(session.user.id);
        if (data) {
          const needsConsent = latestVersion && data.accepted_tos_version !== latestVersion;
          set({
            tier: data.tier ?? 'free',
            isStudentVerified: !!data.is_student_verified,
            needsTosConsent: !!needsConsent,
            aiPrefs: {
              ai_model: data.ai_model ?? DEFAULT_AI_PREFS.ai_model,
              ai_expertise: data.ai_expertise ?? DEFAULT_AI_PREFS.ai_expertise,
              ai_portfolio_doctor: data.ai_portfolio_doctor ?? DEFAULT_AI_PREFS.ai_portfolio_doctor,
              ai_voice_synthesis: data.ai_voice_synthesis ?? DEFAULT_AI_PREFS.ai_voice_synthesis,
              ai_risk_alerts: data.ai_risk_alerts ?? DEFAULT_AI_PREFS.ai_risk_alerts,
            },
            hasUsedTrial: !!data.has_used_trial,
            trialEndsAt: data.trial_ends_at ?? null,
            passwordLastChangedAt: data.password_last_changed_at ?? null,
          });

          // Password Expiration Check (60 Days)
          if (data.password_last_changed_at) {
            const EXPR_PERIOD = 60 * 24 * 60 * 60 * 1000;
            const lastChanged = new Date(data.password_last_changed_at).getTime();
            if (Date.now() - lastChanged > EXPR_PERIOD) {
              set({ isPasswordExpired: true });
            } else {
              set({ isPasswordExpired: false });
            }
          }

          // Handle Power Shifts Reset
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

      // Check for expiry before finishing initialization
      const isExpired = await useAuthStore.getState().checkSessionExpiry();
      if (isExpired) return;

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
        const { latestTosVersion } = useAuthStore.getState();
        const data = await fetchProfile(session.user.id);
        if (data) {
          const needsConsent = latestTosVersion && data.accepted_tos_version !== latestTosVersion;
          set({
            tier: data.tier ?? 'free',
            isStudentVerified: !!data.is_student_verified,
            needsTosConsent: !!needsConsent,
            aiPrefs: {
              ai_model: data.ai_model ?? DEFAULT_AI_PREFS.ai_model,
              ai_expertise: data.ai_expertise ?? DEFAULT_AI_PREFS.ai_expertise,
              ai_portfolio_doctor: data.ai_portfolio_doctor ?? DEFAULT_AI_PREFS.ai_portfolio_doctor,
              ai_voice_synthesis: data.ai_voice_synthesis ?? DEFAULT_AI_PREFS.ai_voice_synthesis,
              ai_risk_alerts: data.ai_risk_alerts ?? DEFAULT_AI_PREFS.ai_risk_alerts,
            },
            hasUsedTrial: !!data.has_used_trial,
            trialEndsAt: data.trial_ends_at ?? null,
            passwordLastChangedAt: data.password_last_changed_at ?? null,
          });

          // Password Expiration Check (60 Days)
          if (data.password_last_changed_at) {
            const EXPR_PERIOD = 60 * 24 * 60 * 60 * 1000;
            const lastChanged = new Date(data.password_last_changed_at).getTime();
            if (Date.now() - lastChanged > EXPR_PERIOD) {
              set({ isPasswordExpired: true });
            } else {
              set({ isPasswordExpired: false });
            }
          }
        }
      } else {
        set({ tier: 'free', aiPrefs: null, needsTosConsent: false, hasUsedTrial: false, trialEndsAt: null, isPasswordExpired: false, passwordLastChangedAt: null });
      }
      
      if (session?.user) {
        await useAuthStore.getState().recordActivity();
      }
    });
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync(ACTIVITY_KEY);
    set({ user: null, tier: 'free', aiPrefs: null, isLoading: false, lastActivityAt: null, isPasswordExpired: false, passwordLastChangedAt: null });
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

      set((state: AuthState) => ({
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

  updateAIPreferences: async (prefs: AIPrefs) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    const { error } = await supabase
      .from('user_profiles')
      .update({
        ai_model: prefs.ai_model,
        ai_expertise: prefs.ai_expertise,
        ai_portfolio_doctor: prefs.ai_portfolio_doctor,
        ai_voice_synthesis: prefs.ai_voice_synthesis,
        ai_risk_alerts: prefs.ai_risk_alerts,
      })
      .eq('id', user.id);
    if (error) throw error;
    set({ aiPrefs: prefs });
  },

  checkBiometricCompatibility: async () => {
    const isSupported = await biometricService.isCompatible();
    const isEnabled = await biometricService.isEnabled();
    const type = await biometricService.getSupportedTypes();
    const hasPrompted = await biometricService.hasBeenPrompted();

    set({ 
      isBiometricSupported: isSupported,
      isBiometricEnabled: isEnabled,
      biometricType: type,
      hasPromptedBiometrics: hasPrompted
    });
  },

  setBiometricEnabled: async (enabled: boolean) => {
    await biometricService.setEnabled(enabled);
    set({ isBiometricEnabled: enabled });
  },

  enrollBiometrics: async () => {
    const success = await biometricService.authenticate('Enroll in Biometric Access');
    if (success) {
      await biometricService.setEnabled(true);
      await biometricService.setPrompted(true);
      set({ isBiometricEnabled: true, hasPromptedBiometrics: true });
    }
    return success;
  },

  biometricLogin: async () => {
    const { isBiometricEnabled } = useAuthStore.getState();
    if (!isBiometricEnabled) return;

    const success = await biometricService.authenticate();
    if (success) {
      // Supabase persistent session should already handle this if the user was logged in before.
      // If we need a explicit login, we would need to store email/pass in SecureStore, which we avoid.
      // However, Supabase session persistence WITH SecureStore as storage IS exactly what's needed.
      // If the session is present, we are logged in.
      // For Biometric Login as a feature to be meaningful, it usually implies re-authenticating.
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
          set({ user: mapSupabaseUser(session.user) });
      }
    }
  },

  acceptTerms: async (ipAddress: string) => {
    const { user, latestTosVersion } = useAuthStore.getState();
    if (!user || !latestTosVersion) return;

    set({ isLoading: true });
    try {
      // Get version ID
      const { data: versionData } = await supabase
        .from('tos_versions')
        .select('id')
        .eq('version', latestTosVersion)
        .single();

      if (!versionData) throw new Error('ToS Version not found');

      // Insert acceptance record
      const { error: acceptanceError } = await supabase
        .from('terms_acceptance')
        .insert({
          user_id: user.id,
          version_id: versionData.id,
          ip_address: ipAddress
        });

      if (acceptanceError) throw acceptanceError;

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ accepted_tos_version: latestTosVersion })
        .eq('id', user.id);

      if (profileError) throw profileError;

      set({ needsTosConsent: false });
    } catch (e) {
      console.error('Failed to accept terms', e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  recordActivity: async () => {
    const now = Date.now();
    set({ lastActivityAt: now });
    await SecureStore.setItemAsync(ACTIVITY_KEY, now.toString());
  },

  checkSessionExpiry: async () => {
    const { user, lastActivityAt, signOut } = useAuthStore.getState();
    if (!user || !lastActivityAt) return false;

    const now = Date.now();
    const isExpired = (now - lastActivityAt) > SESSION_TIMEOUT;

    if (isExpired) {
      console.warn('Session expired due to 24h inactivity.');
      await signOut();
      return true;
    }
    return false;
  },

      usePowerShift: () => {
        const { powerShifts } = get();
        if (powerShifts > 0) {
          const newCount = powerShifts - 1;
          set({ powerShifts: newCount });
          SecureStore.setItemAsync('quantmind_powershifts', newCount.toString());
          return true;
        }
        return false;
      },

      fetchTierConfigs: async () => {
        const { lastConfigsFetch } = get();
        const now = Date.now();
        
        if (lastConfigsFetch && (now - lastConfigsFetch) < CACHE_TTL) {
          return;
        }

        try {
          const { data, error } = await supabase
            .from('app_config')
            .select('value')
            .eq('key', 'tier_config')
            .single();
          
          if (error) throw error;
          if (data?.value) {
            set({ tierConfigs: data.value as TierConfig, lastConfigsFetch: now });
          }
        } catch (error) {
          console.error('Error fetching tier configs:', error);
          // Fallback is already set in initial state
        }
      },

      fetchSubscriptionPlans: async () => {
        const { lastPlansFetch } = get();
        const now = Date.now();

        if (lastPlansFetch && (now - lastPlansFetch) < CACHE_TTL) {
          return;
        }

        try {
          const { data, error } = await supabase
            .from('app_config')
            .select('value')
            .eq('key', 'subscription_plans')
            .single();
          
          if (error) throw error;
          if (data?.value) {
            set({ subscriptionPlans: data.value as any[], lastPlansFetch: now });
          }
        } catch (error) {
          console.error('Error fetching subscription plans:', error);
        }
      },

      fetchSystemEvents: async () => {
        try {
          const { data, error } = await supabase
            .from('system_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (error) throw error;
          set({ systemEvents: data || [] });
        } catch (error) {
          console.error('Error fetching system events:', error);
        }
      },

      grantTrialReward: async () => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.functions.invoke('grant-trial');
          if (error) throw error;
          
          if (data?.status === 'success') {
            set({ 
              tier: 'plus', 
              hasUsedTrial: true, 
              trialEndsAt: data.trial_ends_at 
            });
            await get().fetchSystemEvents();
          }
        } catch (error) {
          console.error('Failed to grant trial reward:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      fetchAIConfigs: async () => {
        const { user } = get();
        if (!user) return;
        const { data, error } = await supabase
          .from('user_ai_configs')
          .select('id, provider, model_id, is_active, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        set({ aiConfigs: data || [] });
      },

      saveAIConfig: async (provider: string, modelId: string, apiKey: string) => {
        const { error } = await supabase.rpc('save_user_ai_config', {
          p_provider: provider,
          p_model_id: modelId,
          p_api_key: apiKey
        });
        if (error) throw error;
        await get().fetchAIConfigs();
      },

      toggleAIConfig: async (configId: string, active: boolean) => {
        const { user } = get();
        if (!user) return;

        // If activating, deactivate all others first (enforce single active custom config)
        if (active) {
          await supabase
            .from('user_ai_configs')
            .update({ is_active: false })
            .eq('user_id', user.id);
        }

        const { error } = await supabase
          .from('user_ai_configs')
          .update({ is_active: active })
          .eq('id', configId);
        
        if (error) throw error;
        await get().fetchAIConfigs();
      },

      deleteAIConfig: async (configId: string) => {
        const { error } = await supabase
          .from('user_ai_configs')
          .delete()
          .eq('id', configId);
        if (error) throw error;
        await get().fetchAIConfigs();
      },

      fetchChangelog: async () => {
        const { data, error } = await supabase
          .from('app_changelog')
          .select('*')
          .eq('environment', 'production')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        set({ changelog: data || [] });
      },
}));
