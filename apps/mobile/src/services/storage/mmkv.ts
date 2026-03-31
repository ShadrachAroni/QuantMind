import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

/**
 * Robust Storage Wrapper
 * Automatically detects if native MMKV is available (Development Build).
 * Falls back to AsyncStorage if in Expo Go or if initialization fails.
 */
let nativeMMKV: MMKV | null = null;
try {
  nativeMMKV = new MMKV({
    id: 'quantmind-app-storage',
  });
  console.log('[Storage] Native MMKV Initialized successfully.');
} catch (e) {
  console.warn('[Storage] MMKV could not be initialized (likely Expo Go). Falling back to AsyncStorage.');
}

/**
 * Universal storage interface.
 * Note: Some methods are sync for MMKV and async for the fallback.
 */
export const storage = {
  set: (key: string, value: string | number | boolean) => {
    if (nativeMMKV) {
      nativeMMKV.set(key, value);
    } else {
      return AsyncStorage.setItem(key, String(value));
    }
  },
  getString: (key: string) => {
    if (nativeMMKV) {
      return nativeMMKV.getString(key);
    }
    // Synchronous getString is NOT possible with AsyncStorage.
    // Use the async-friendly zustandMMKVStorage.getItem for persistence.
    return undefined;
  },
  delete: (key: string) => {
    if (nativeMMKV) {
      nativeMMKV.delete(key);
    } else {
      return AsyncStorage.removeItem(key);
    }
  },
  // Helper for async-safe reads
  getItemAsync: async (key: string) => {
    if (nativeMMKV) {
      return nativeMMKV.getString(key) ?? null;
    }
    return await AsyncStorage.getItem(key);
  }
};

/**
 * Zustand-compatible Storage Adapter.
 * Correctly handles the async nature of the AsyncStorage fallback.
 */
export const zustandMMKVStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    return storage.getItemAsync(name);
  },
  removeItem: (name) => {
    return storage.delete(name);
  },
};
