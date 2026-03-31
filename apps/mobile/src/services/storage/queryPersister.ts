import { storage } from './mmkv';
import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

/**
 * High-performance React Query Persister using MMKV.
 * Provides synchronous storage access for instant cache hydration.
 */
export const queryPersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    storage.set('react-query-cache', JSON.stringify(client));
  },
  restoreClient: async () => {
    const cache = await storage.getItemAsync('react-query-cache');
    if (!cache) return undefined;
    return JSON.parse(cache) as PersistedClient;
  },
  removeClient: async () => {
    storage.delete('react-query-cache');
  },
};
