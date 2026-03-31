import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

/**
 * Hook for searching financial assets with caching.
 * Uses a unique query key for each search term to prevent redundant requests.
 */
export function useAssetSearch(query: string) {
  return useQuery({
    queryKey: ['assets', 'search', query],
    queryFn: () => api.searchAssets(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook for fetching asset price history with caching.
 * Persists historical data for 24 hours to support offline analysis.
 */
export function useAssetHistory(symbol: string) {
  return useQuery({
    queryKey: ['assets', 'history', symbol],
    queryFn: () => api.getAssetHistory(symbol),
    enabled: !!symbol,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours retention
  });
}
