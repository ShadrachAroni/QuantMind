'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useToast } from '../ui/ToastProvider';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  mfaVerified: boolean;
  adminMfaVerified: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [adminMfaVerified, setAdminMfaVerified] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { info: toastInfo, error: toastError } = useToast();

  const lastAuthSignalRef = useRef<number>(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (pathname !== '/login') router.push('/login');
        setLoading(false);
        return;
      }

      setUser(session.user);
      
      // Check for Admin role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      
      const is_admin = !!profile?.is_admin;
      setIsAdmin(is_admin);

      // Enforce Admin MFA (Email OTP)
      let admin_mfa_verified = false;

      if (is_admin) {
        const { data: profileWithMfa } = await supabase
          .from('user_profiles')
          .select('last_mfa_at')
          .eq('id', session.user.id)
          .single();

        const lastMfa = profileWithMfa?.last_mfa_at;
        const mfaThreshold = 24 * 60 * 60 * 1000; // 24 hours for stable administrative sessions
        admin_mfa_verified = !!(lastMfa && (new Date().getTime() - new Date(lastMfa).getTime() < mfaThreshold));
        setAdminMfaVerified(admin_mfa_verified);

        // Redirect to MFA if not verified (except on MFA page itself)
        const isMfaPage = pathname === '/admin/mfa';
        const isLoginPage = pathname === '/login';
        
        if (!admin_mfa_verified && !isMfaPage && !isLoginPage) {
          router.push('/admin/mfa');
        }
      } else {
        setAdminMfaVerified(true);
      }

      setLoading(false);
    };

    checkAuth();


    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        const now = Date.now();
        // Only show once every 10 seconds to avoid multi-trigger popups
        if (now - lastAuthSignalRef.current > 10000) {
          toastInfo('AUTH_SIGNAL_DETECTED', 'Handshake successful. Synchronizing terminal state...', 2000);
          lastAuthSignalRef.current = now;
        }
        checkAuth();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        setMfaVerified(false);
        setAdminMfaVerified(false);
        toastInfo('SESSION_TERMINATED', 'Operator signed out. Terminal transmission secured.');
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const signOut = async () => {
    // Audit Note: Manual Bridge Sync - Revoking primary Supabase session.
    // Secondary MojoAuth revocation handled at account level or step-up expiry.
    await supabase.auth.signOut();
    
    setUser(null);
    setIsAdmin(false);
    setMfaVerified(false);
    setAdminMfaVerified(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, mfaVerified, adminMfaVerified, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
