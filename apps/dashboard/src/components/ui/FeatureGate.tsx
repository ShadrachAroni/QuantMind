import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useGate } from '../auth/useGate';
import { UpgradeModal, Tier } from './UpgradeModal';
import { supabase } from '../../lib/supabase';

interface FeatureGateProps {
  children: React.ReactNode;
  featureName: string;
  requiredTier: Tier;
  fallback?: 'hide' | 'modal' | React.ReactNode;
}

export function FeatureGate({ 
  children, 
  featureName, 
  requiredTier, 
  fallback = 'modal' 
}: FeatureGateProps) {
  const { user } = useAuth();
  const { hasAccess, isLoading, currentTier } = useGate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return null;
  }

  const accessGranted = hasAccess(requiredTier);

  if (accessGranted) {
    return <>{children}</>;
  }

  // Handle lack of access
  if (fallback === 'hide') {
    return null;
  }

  if (fallback === 'modal') {
    const handleGateClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsModalOpen(true);
      
      // Log Analytics Event for CTR tracking
      if (user) {
        try {
          await supabase.from('analytics_events').insert({
            user_id: user.id,
            event_type: 'feature_gate_triggered',
            properties: {
              feature_name: featureName,
              required_tier: requiredTier,
              current_tier: currentTier
            }
          });
        } catch (err) {
          console.error('Failed to log feature gate event', err);
        }
      }
    };

    return (
      <>
        {/* We wrap children to intercept all click events in the capture phase */}
        <div 
          onClickCapture={handleGateClick}
          className="relative inline-block cursor-pointer group"
        >
          {/* A slight opacity/grayscale overlay to indicate it's locked visually, 
              but only softly, so the user is still enticed to click. */}
          <div className="relative">
             <div className="absolute inset-0 z-10 bg-background/10 backdrop-blur-[1px] rounded-md transition-all group-hover:backdrop-blur-0 pointer-events-none" />
             <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-300">
               {children}
             </div>
          </div>
        </div>

        <UpgradeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          featureName={featureName}
          requiredTier={requiredTier}
        />
      </>
    );
  }

  // Custom fallback node
  return <>{fallback}</>;
}
