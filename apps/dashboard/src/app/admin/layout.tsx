'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { AdminLayout as SharedAdminLayout } from '../../components/ui/AdminLayout';
import { HoloLoader } from '../../components/ui/HoloLoader';

export default function AdminSuiteLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      if (authLoading) return;
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error || !data?.is_admin) {
        router.push('/');
        return;
      }

      setIsAuthorized(true);
    }
    checkAuth();
  }, [user, authLoading, router]);

  if (authLoading || isAuthorized === null) {
    return (
      <HoloLoader 
        progress={100} 
        phase="VERIFYING_CLEARANCE_LEVEL" 
        isMuted={true} 
        onToggleMute={() => {}} 
      />
    );
  }

  return (
    <SharedAdminLayout>
      {children}
    </SharedAdminLayout>
  );
}
