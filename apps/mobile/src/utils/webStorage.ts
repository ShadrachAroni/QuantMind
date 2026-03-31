import { Platform } from 'react-native';

const DB_NAME = 'QuantMindSecure';
const STORE_NAME = 'keys';
const KEY_NAME = 'master-key';
const ALGO = { name: 'AES-GCM', length: 256 };

/**
 * Robust encryption utility for Web platforms.
 * Uses Web Crypto API (AES-GCM) with a non-extractable key stored in IndexedDB.
 */
class WebSecureStorage {
  private key: CryptoKey | null = null;

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getMasterKey(): Promise<CryptoKey> {
    if (this.key) return this.key;

    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(KEY_NAME);
      request.onsuccess = async () => {
        if (request.result) {
          this.key = request.result;
          resolve(request.result);
        } else {
          // Generate new key if not found
          const newKey = await window.crypto.subtle.generateKey(
            ALGO,
            false, // non-extractable - extra security
            ['encrypt', 'decrypt']
          );
          await this.saveMasterKey(newKey);
          this.key = newKey;
          resolve(newKey);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async saveMasterKey(key: CryptoKey): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.put(key, KEY_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async encrypt(data: string): Promise<string> {
    if (Platform.OS !== 'web') return data;
    
    const key = await this.getMasterKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    // Combine IV and encrypted data into a single base64 string
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  async decrypt(encryptedBase64: string): Promise<string | null> {
    if (Platform.OS !== 'web') return null;

    try {
      const combined = new Uint8Array(
        atob(encryptedBase64)
          .split('')
          .map((c) => c.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      const key = await this.getMasterKey();

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.warn('[WebSecureStorage] Decryption failed. Returning raw value if applicable.', e);
      return null;
    }
  }
}

export const webSecureStorage = new WebSecureStorage();
