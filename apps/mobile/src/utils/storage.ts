import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { webSecureStorage } from './webStorage';

/**
 * Platform-agnostic storage utility that uses SecureStore on native 
 * and fallback to an encrypted WebSecureStorage on web.
 */
export const storage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      
      // Attempt to decrypt. If it's old plain-text data, 
      // the decrypt function will return null.
      const decrypted = await webSecureStorage.decrypt(raw);
      return decrypted ?? raw;
    }
    return SecureStore.getItemAsync(key);
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      const encrypted = await webSecureStorage.encrypt(value);
      localStorage.setItem(key, encrypted);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

/**
 * Adapter specifically for Supabase Auth storage
 */
export const supabaseStorageAdapter = {
  getItem: (key: string) => storage.getItemAsync(key),
  setItem: (key: string, value: string) => storage.setItemAsync(key, value),
  removeItem: (key: string) => storage.deleteItemAsync(key),
};
