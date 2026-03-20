import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'quantmind_biometric_enabled';
const BIOMETRIC_PROMPTED_KEY = 'quantmind_biometric_prompted';

export enum BiometricType {
  NONE = 'NONE',
  FINGERPRINT = 'FINGERPRINT',
  FACE_ID = 'FACE_ID',
  IRIS = 'IRIS',
  MULTIPLE = 'MULTIPLE',
  UNKNOWN = 'UNKNOWN',
}

export const biometricService = {
  /**
   * Check if the device has biometric hardware and if the user has enrolled at least one biometric.
   */
  async isCompatible(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  /**
   * Get the specific types of biometrics supported by the device.
   */
  async getSupportedTypes(): Promise<BiometricType> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (types.length === 0) return BiometricType.NONE;
    if (types.length > 1) return BiometricType.MULTIPLE;

    switch (types[0]) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return BiometricType.FINGERPRINT;
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return BiometricType.FACE_ID;
      case LocalAuthentication.AuthenticationType.IRIS:
        return BiometricType.IRIS;
      default:
        return BiometricType.UNKNOWN;
    }
  },

  /**
   * Prompt the user for biometric authentication.
   */
  async authenticate(reason: string = 'Authenticate to access your QuantMind terminal'): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });

    return result.success;
  },

  /**
   * Get the user's biometric preference.
   */
  async isEnabled(): Promise<boolean> {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  },

  /**
   * Set the user's biometric preference.
   */
  async setEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  },

  /**
   * Check if the user has already been prompted to enable biometrics.
   */
  async hasBeenPrompted(): Promise<boolean> {
    const prompted = await SecureStore.getItemAsync(BIOMETRIC_PROMPTED_KEY);
    return prompted === 'true';
  },

  /**
   * Mark that the user has been prompted for biometrics.
   */
  async setPrompted(prompted: boolean): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRIC_PROMPTED_KEY, prompted ? 'true' : 'false');
  },
};
