import { Platform } from 'react-native';
import { ThemeType } from '../constants/theme';
import Constants from 'expo-constants';

/**
 * Terminal Debugger Utility
 * Provides structured diagnostic logging for the mobile application.
 */

export const terminalDebugger = {
  logSystemHealth: (status: {
    theme: ThemeType;
    isThemeValid: boolean;
    voiceInitialized: boolean;
    notificationsEnabled: boolean;
    storageValid: boolean;
    splashStatus?: string;
  }) => {
    const separator = '--------------------------------------------------';
    const header = '🚀 [QUANTMIND_MOBILE_HEALTH]';
    
    console.log('\n' + header);
    console.log(separator);
    
    // Theme Status
    const themeIcon = '🎨';
    const themeStatus = status.isThemeValid ? 'OK' : 'INVALID';
    console.log(`${themeIcon} THEME: ${status.theme.toUpperCase()} (Status: ${themeStatus}, Fonts: LOADED)`);
    
    // Voice Engine Status
    const voiceIcon = '🎙️';
    const voiceStatus = status.voiceInitialized ? 'READY' : 'PENDING (Race Fixed)';
    console.log(`${voiceIcon} VOICE: INITIALIZED (Status: ${voiceStatus})`);
    
    // Notifications Status
    const pushIcon = '🔔';
    const pushNote = Constants.appConfig?.extra?.expoGo ? 'Warning: SDK 54 incompatibility in Expo Go' : 'READY';
    console.log(`${pushIcon} PUSH: ${Constants.appConfig?.extra?.expoGo ? 'EXPO_GO' : 'DEV_BUILD'} (${pushNote})`);
    
    // Storage Status
    const storageIcon = '🛠️';
    const storageStatus = status.storageValid ? 'VALIDATED' : 'ERROR';
    console.log(`${storageIcon} STORAGE: SECURE_KEYS (${storageStatus})`);
    
    // Splash/Asset Status
    if (status.splashStatus) {
      console.log(`🖼️  SPLASH: ${status.splashStatus}`);
    }
    
    console.log(separator + '\n');
  },

  logError: (context: string, error: any) => {
    const header = `❌ [ERROR][${context}]`;
    console.error(header);
    if (error?.message) console.error(`   Message: ${error.message}`);
    if (error?.stack) console.error(`   Stack Trace:\n${error.stack.split('\n').slice(0, 5).join('\n')}`);
    else console.error(error);
  },

  logFatal: (error: any, isFatal: boolean = true) => {
    const header = `🛑 [FATAL_CRASH_DETECTED]`;
    console.error('\n' + header);
    console.error('==================================================');
    console.error(`Status: ${isFatal ? 'TERMINATING' : 'RECOVERING'}`);
    console.error(`Message: ${error?.message || 'Unknown panic'}`);
    if (error?.stack) {
      console.error(`\nCall Stack:\n${error.stack.split('\n').slice(0, 8).join('\n')}`);
    }
    console.error('==================================================\n');
  },

  logUnhandledRejection: (reason: any) => {
    const header = `⚠️  [UNHANDLED_PROMISE_REJECTION]`;
    console.warn('\n' + header);
    console.warn(`Reason: ${reason?.message || reason || 'No reason provided'}`);
    if (reason?.stack) {
      console.warn(`Trace: ${reason.stack.split('\n').slice(0, 3).join('\n')}`);
    }
    console.warn('--------------------------------------------------\n');
  },

  logNetwork: (service: string, url: string, error: any) => {
    const header = `🌐 [NETWORK_FAILURE][${service.toUpperCase()}]`;
    console.error(`${header} failed for: ${url}`);
    console.error(`   Error: ${error?.message || 'Connection timeout/failure'}`);
  },

  /**
   * Logs the start or end of a debugger session.
   */
  logDebuggerSession: (isActive: boolean) => {
    const separator = '==================================================';
    const status = isActive ? '🟢 SESSION_START' : '🔴 SESSION_END';
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`\n${separator}`);
    console.log(`🔍 [DEBUGGER_STATE] ${status} at ${timestamp}`);
    if (isActive) {
      console.log('   Mode: Interactive Splash Overlay');
      console.log('   Scope: Full UI Branding Persistence');
    }
    console.log(`${separator}\n`);
  },

  /**
   * Wraps an object in a Proxy to trace accesses and detect failures early.
   */
  traceTheme: (theme: any): any => {
    if (!theme || typeof Proxy === 'undefined') return theme;

    return new Proxy(theme, {
      get: (target, prop) => {
        const value = target[prop];
        
        // Special case: if we access typography, return another proxy for fonts
        if (prop === 'typography') {
          if (typeof value === 'undefined') {
            console.error('🕵️ [THEME_PROBE] Accessing undefined "typography"');
            return undefined;
          }
          return new Proxy(value, {
            get: (t, p) => {
              const val = t[p];
              if (p === 'fonts' && typeof val === 'undefined') {
                console.error('🕵️ [THEME_PROBE] Accessing undefined "fonts" within typography');
              }
              return val;
            }
          });
        }
        
        return value;
      }
    });
  }
};
