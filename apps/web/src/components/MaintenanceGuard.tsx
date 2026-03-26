'use client';

import React from 'react';
import { useUser } from './UserContext';
import { MaintenanceOverlay } from './MaintenanceOverlay';

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { isMaintenanceMode, profile, loading } = useUser();

  // If loading, just show children (InitialLoader handles the splash)
  if (loading) return <>{children}</>;

  // If maintenance mode is active, check permissions
  if (isMaintenanceMode) {
    // Only block if user is NOT an admin
    if (!profile?.is_admin) {
      return <MaintenanceOverlay />;
    }
  }

  return <>{children}</>;
}
