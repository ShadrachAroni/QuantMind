'use client';

import React, { useEffect, useState } from 'react';
import { LoadingOverlay } from './LoadingOverlay';

export function InitialLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show loader and hide content until the application is hydrated and ready.
    const timer = setTimeout(() => {
      setLoading(false);
      document.body.setAttribute('data-initializing', 'false');
    }, 2000); // 2 seconds total for a smooth high-fidelity reveal

    return () => clearTimeout(timer);
  }, []);

  return (
    <LoadingOverlay 
      visible={loading} 
      message="RE-ESTABLISHING_SESSION_PROTOCOL..."
    />
  );
}
