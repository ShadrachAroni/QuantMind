import { useAuth } from './AuthProvider';
import type { Tier } from './AuthProvider';

export const tierWeights: Record<Tier, number> = {
  free: 0,
  student: 1,
  plus: 2,
  pro: 3,
};

export function useGate() {
  const { tier, loading } = useAuth();

  const checkAccess = (requiredTier: Tier): boolean => {
    if (loading) return false;
    const userWeight = tierWeights[tier] || 0;
    const requiredWeight = tierWeights[requiredTier] || 0;
    return userWeight >= requiredWeight;
  };

  return {
    hasAccess: checkAccess,
    currentTier: tier,
    isLoading: loading
  };
}
