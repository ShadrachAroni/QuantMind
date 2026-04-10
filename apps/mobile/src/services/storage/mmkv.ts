import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * MMKV / Async Storage Resilient Wrapper (Phase 4)
 * This module is designed to prevent "runtime not ready" JSI crashes by:
 * 1. Lazily requiring native modules only when first used.
 * 2. Guarding all native calls with a JSI readiness check.
 * 3. Falling back to an In-Memory store during the early boot window.
 */

// --- DIAGNOSTIC FLAGS ---
const DEBUG_DISABLE_ALL_NATIVE = false;
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// --- IN-MEMORY FALLBACK ---
const memoryStorage = new Map<string, string>();

/**
 * Detection logic for JSI availability.
 * In New Architecture (Bridgeless), this is available once the Host is registered.
 */
function isJsiReady(): boolean {
  if (Platform.OS === 'web') return true;
  return !!(global as any).nativeCallSyncHook;
}

// --- LAZY MODULE HANDLERS ---
let _mmkv: any = null;
let _asyncStorage: any = null;

function getMMKV() {
  if (DEBUG_DISABLE_ALL_NATIVE || IS_EXPO_GO) return null;
  if (!_mmkv) {
    try {
      // Lazy require to prevent top-level JSI evaluation
      const { MMKV } = require('react-native-mmkv');
      _mmkv = new MMKV({ id: 'quantmind-storage' });
    } catch (e) {
      console.warn('⚠️ [STORAGE_DIAGNOSTIC] MMKV initialization failed, falling back.');
      return null;
    }
  }
  return _mmkv;
}

function getAsyncStorage() {
  if (DEBUG_DISABLE_ALL_NATIVE) return null;
  if (!_asyncStorage) {
    try {
      // Lazy require AsyncStorage v2
      _asyncStorage = require('@react-native-async-storage/async-storage').default;
    } catch (e) {
      console.error('⚠️ [STORAGE_DIAGNOSTIC] AsyncStorage import failed.');
      return null;
    }
  }
  return _asyncStorage;
}

/**
 * Universal safe storage invoker.
 * Prevents crashes during the early-boot JSI initialization window.
 */
async function safeStorageAction<T>(
  mmkvAction: (instance: any) => T,
  asyncAction: (instance: any) => Promise<T>,
  fallbackAction: () => T,
  context: string
): Promise<T> {
  // 1. Guard against native bridge not being ready
  if (!isJsiReady()) {
    return fallbackAction();
  }

  // 2. Try MMKV (Fastest, JSI-based)
  const mmkvInstance = getMMKV();
  if (mmkvInstance) {
    try {
      return mmkvAction(mmkvInstance);
    } catch (e) {
      console.error(`❌ [STORAGE][MMKV][${context}]`, e);
    }
  }

  // 3. Try AsyncStorage (Bridge/JSI)
  const asyncInstance = getAsyncStorage();
  if (asyncInstance) {
    try {
      return await asyncAction(asyncInstance);
    } catch (e) {
      console.error(`❌ [STORAGE][ASYNC][${context}]`, e);
    }
  }

  // 4. Ultimate Fallback
  return fallbackAction();
}

/**
 * Unified Storage Service
 */
export const storage = {
  set: (key: string, value: string) => {
    // Optimistically update memory
    memoryStorage.set(key, value);
    
    // Attempt persistence in background
    safeStorageAction(
      (m) => m.set(key, value),
      (a) => a.setItem(key, value),
      () => {},
      'SET'
    );
  },

  getString: (key: string): string | undefined => {
    // Note: getString in MMKV is synchronous. 
    // If JSI is not ready, we MUST use memory.
    if (!isJsiReady()) return memoryStorage.get(key);
    
    const mmkv = getMMKV();
    if (mmkv) return mmkv.getString(key);
    
    return memoryStorage.get(key);
  },

  // Async variant for compatibility with PersistQueryClient
  getItemAsync: async (key: string): Promise<string | null> => {
    return safeStorageAction(
      (m) => m.getString(key) ?? null,
      (a) => a.getItem(key),
      () => memoryStorage.get(key) ?? null,
      'GET'
    );
  },

  delete: (key: string) => {
    memoryStorage.delete(key);
    safeStorageAction(
      (m) => m.delete(key),
      (a) => a.removeItem(key),
      () => {},
      'DELETE'
    );
  },

  clearAll: () => {
    memoryStorage.clear();
    safeStorageAction(
      (m) => m.clearAll(),
      (a) => a.clear(),
      () => {},
      'CLEAR'
    );
  }
};

/**
 * Zustand-compatible adapter
 */
export const zustandMMKVStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await storage.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    storage.set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    storage.delete(name);
  },
};
