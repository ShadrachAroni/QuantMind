import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * Voice Intelligence Service
 * Manages Siri Shortcuts (iOS) and App Actions (Android)
 */

export const VOICE_INTENTS = {
  CHECK_VAR: 'quantmind://va-check',
  RUN_SIMULATION: 'quantmind://run-sim',
  GET_SENTIMENT: 'quantmind://get-sentiment',
};

let isInitialized = false;

export const voiceService = {
  /**
   * Register available shortcuts with the OS
   * On iOS, this would typically involve setting up NSUserActivity
   */
  registerShortcuts: async () => {
    if (isInitialized) {
      console.log('VOICE_ENGINE: Already initialized, skipping registration.');
      return true;
    }

    try {
      if (Platform.OS === 'ios') {
        console.log('VOICE_ENGINE: Registering Siri Shortcuts handlers... (Race condition mitigated)');
        // Logic for registering user activities would go here in a prebuild/native context
      } else {
        console.log('VOICE_ENGINE: Registering Android App Actions...');
      }
      isInitialized = true;
      return true;
    } catch (e) {
      console.error('VOICE_ENGINE_INIT_ERROR:', e);
      return false;
    }
  },

  isReady: () => isInitialized,

  /**
   * Handles incoming voice-triggered deep links
   */
  handleVoiceIntent: (url: string) => {
    const { path, queryParams } = Linking.parse(url);
    
    console.log('VOICE_INTENT_RECEIVED:', { path, queryParams });

    switch (path) {
      case 'va-check':
        // Navigate to Risk screen or return VaR data via TTS (if supported)
        return 'NAVIGATE_RISK';
      case 'get-sentiment':
        return 'NAVIGATE_ORACLE';
      case 'run-sim':
        return 'NAVIGATE_SIMULATION';
      default:
        return null;
    }
  }
};
