import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { storage } from './storage';
import { supabase } from '../services/supabase';
import { SecureKeys } from '../constants/keys';

export const hsmService = {
  /**
   * Checks if HWM/Biometrics are available on the device
   */
  async isHardwareAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  /**
   * Signs a simulation report using device biometrics and secure hashing
   */
  async signReport(simulationId: string, reportData: any): Promise<{ signature: string; timestamp: string } | null> {
    try {
      // 1. Authenticate User
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'AUTHORIZE_INSTITUTIONAL_REPORT_SIGNING',
        fallbackLabel: 'Enter Passcode',
        disableDeviceFallback: false,
      });

      if (!auth.success) {
        throw new Error('AUTHENTICATION_FAILED');
      }

      // 2. Generate Report Hash
      const dataString = JSON.stringify({
        id: simulationId,
        metrics: reportData.metrics,
        timestamp: new Date().toISOString(),
      });
      
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        dataString
      );

      // 3. Create "Institutional Signature" 
      let deviceSecret = await storage.getItemAsync(SecureKeys.DEVICE.HSM_SECRET);
      
      // Migration logic
      if (!deviceSecret) {
        const legacySecret = await storage.getItemAsync('hsm_device_secret');
        if (legacySecret) {
          deviceSecret = legacySecret;
          await storage.setItemAsync(SecureKeys.DEVICE.HSM_SECRET, legacySecret);
          await storage.deleteItemAsync('hsm_device_secret');
        } else {
          deviceSecret = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, Math.random().toString());
          await storage.setItemAsync(SecureKeys.DEVICE.HSM_SECRET, deviceSecret);
        }
      }

      const signature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${hash}.${deviceSecret}`
      );

      const timestamp = new Date().toISOString();

      // 4. Update Supabase
      const { error } = await supabase
        .from('simulations')
        .update({
          hsm_signature: signature,
          signed_at: timestamp,
          is_locked: true
        })
        .eq('id', simulationId);

      if (error) throw error;

      return { signature, timestamp };
    } catch (err) {
      console.error('HSM_SIGNING_ERROR:', err);
      throw err;
    }
  }
};
