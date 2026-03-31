import { createMMKV, type MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

/**
 * Global MMKV instance for high-speed synchronous storage.
 * This instance uses JSI for direct memory access, bypassing the React Native bridge.
 */
export const storage: MMKV = createMMKV({
  id: 'quantmind-app-storage',
  // Removed encryption for performance of non-sensitive data
  // SecureStore should be used for secrets (Auth/MFA)
});

/**
 * Zustand-compatible Storage Adapter for MMKV.
 * Note: MMKV is synchronous, so we wrap it to match the expected interface.
 */
export const zustandMMKVStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.remove(name);
  },
};
