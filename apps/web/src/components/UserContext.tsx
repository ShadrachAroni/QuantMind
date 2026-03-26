'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useSyncStore } from '@/store/syncStore';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { profile, setProfile, setOnline } = useSyncStore();
  const { isOnline } = useRealtimeSync();
  const [loading, setLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const supabase = createClient();

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
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile({ ...data, email: user.email } as any);
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
    <UserContext.Provider value={{ profile: profile as any, loading, refreshProfile: fetchProfile, isOnline, isMaintenanceMode }}>
      {children}
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
