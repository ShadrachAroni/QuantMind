'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { LoadingOverlay } from './LoadingOverlay';
import { useUser } from '../UserContext';

export function InitialLoader() {
  const { loading } = useUser();
  const pathname = usePathname();

  // Only show the blocking auth loader on protected routes
  const isProtectedRoute = pathname?.startsWith('/dashboard') || pathname?.startsWith('/onboarding');

  if (!isProtectedRoute) {
    return null;
  }

  return (
    <LoadingOverlay 
      visible={loading} 
      message="RE-ESTABLISHING_SESSION_PROTOCOL..."
    />
  );
}
