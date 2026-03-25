'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { InlineLoader } from '../ui/InlineLoader';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, mfaVerified } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (loading) return;

    // If not logged in and not on login page, redirect to login
    if (!user && pathname !== '/login') {
      router.push('/login');
    }

    // If logged in and on login page, redirect to dashboard
    if (user && pathname === '/login') {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <InlineLoader message="INITIALIZING_PROTOCOL..." />
    );
  }
  /*
  if (user && isAdmin && !mfaVerified && pathname !== '/mfa') {
    router.push('/mfa');
    return null;
  }
  */

  // Check for admin role if not on login/mfa
  if (user && !isAdmin && pathname !== '/login' && pathname !== '/mfa') {
    return (
      <div className="fixed inset-0 bg-[#05070A] flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-red-500">ACCESS_DENIED</h1>
          <p className="text-gray-400">You do not have administrative clearance for this terminal.</p>
          <button
            onClick={() => router.push('/logout')}
            className="px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            RETURN_TO_BASE
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
