import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useSyncStore } from '@/store/syncStore';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useInactivity } from '@/hooks/useInactivity';
import { SessionWarningModal } from './auth/SessionWarningModal';
import { AbortManager } from '@/lib/abort-manager';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  region: string;
  interface_language: string;
  tier: string;
  mfa_enabled: boolean;
  mfa_email_enabled: boolean;
  mfa_passkey_enabled: boolean;
  ai_token_quota_override: number | null;
  ai_daily_usage_count: number | null;
  ai_persona: string | null;
  ai_risk_sensitivity: string | null;
  ai_model: string | null;
  ai_expertise: string | null;
  last_credential_change_at: string | null;
  is_admin: boolean;
}

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  isOnline: boolean;
  isMaintenanceMode: boolean;
  authMethod: 'supabase' | 'mojoauth' | null;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { profile, setProfile, setOnline } = useSyncStore();
  const { isOnline } = useRealtimeSync();
  const [loading, setLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const supabase = createClient();

  const signOut = useCallback(async () => {
    try {
      // 1. Abort all pending network requests
      AbortManager.abortAll();

      // 2. Clear authentication state in Supabase
      await supabase.auth.signOut();

      // 3. Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();

      // 4. Clear cookies (Supabase handles its own, but we can clear others)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // 5. Update local state
      setProfile(null);
      
      // 6. Broadcast logout to other tabs
      const channel = new BroadcastChannel('auth_session');
      channel.postMessage({ type: 'LOGOUT' });
      channel.close();

      toast.info('Session Terminated', {
        description: 'You have been logged out due to inactivity or manual request.',
      });

      // 7. Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during sign out:', error);
      window.location.href = '/login';
    }
  }, [supabase, setProfile]);

  const { isWarning, timeLeft, extendSession } = useInactivity({
    timeoutMs: 15 * 60 * 1000,
    warningThresholdMs: 60 * 1000,
    onLogout: signOut,
  });

  const fetchMaintenanceStatus = async () => {
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();
    if (data) setIsMaintenanceMode(data.value === 'true');
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const mojoToken = typeof window !== 'undefined' ? localStorage.getItem('mojoauth_token') : null;
      
      if (!user && !mojoToken) {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile({ ...data, email: user.email } as any);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchMaintenanceStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
       if (session) fetchProfile();
       else {
         setProfile(null);
         setLoading(false);
       }
    });

    const maintenanceChannel = supabase
      .channel('public_maintenance_status')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'app_config', 
        filter: 'key=eq.maintenance_mode' 
      }, fetchMaintenanceStatus)
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(maintenanceChannel);
    };
  }, []);

  return (
    <UserContext.Provider value={{ 
      profile: profile as any, 
      loading, 
      refreshProfile: fetchProfile, 
      isOnline, 
      isMaintenanceMode,
      authMethod: (typeof window !== 'undefined' && localStorage.getItem('mojoauth_token')) ? 'mojoauth' : (profile ? 'supabase' : null),
      signOut
    }}>
      {children}
      <SessionWarningModal 
        isOpen={isWarning && !!profile} 
        timeLeft={timeLeft} 
        onExtend={extendSession} 
      />
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

