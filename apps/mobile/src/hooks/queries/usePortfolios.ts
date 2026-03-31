import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

/**
 * Hook for fetching user portfolios with caching.
 * Real-time synchronization is handled by the useRealtimeSync hook,
 * but this serves as the primary data source with offline support.
 */
export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: () => api.getPortfolios(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24 * 7, // 1 week retention
  });
}

/**
 * Hook for polling/checking simulation status with caching.
 */
export function useSimulationStatus(jobId: string) {
  return useQuery({
    queryKey: ['simulations', 'status', jobId],
    queryFn: () => api.getSimulationStatus(jobId),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      return (data?.status === 'COMPLETED' || data?.status === 'FAILED' ? false : 2000);
    },
  });
}
