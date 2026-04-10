import { Platform } from 'react-native';
import { terminalDebugger } from './terminalDebugger';

/**
 * Global Diagnostics Bootstrap
 * Hooks into system-level error handlers to catch non-rendering crashes.
 */
export function initGlobalHandlers() {
  // 1. JS Runtime Errors
  if (Platform.OS !== 'web') {
    // Native (React Native)
    const globalHandler = (error: any, isFatal: boolean) => {
      // JSI errors sometimes come back as opaque objects or with less detail 
      // in the standard console. Try to extract more if possible.
      let debugMessage = error;
      if (error && typeof error === 'object' && !error.message && !error.stack) {
        try {
          debugMessage = `JSI_OPAQUE_ERROR: ${JSON.stringify(error)}`;
        } catch (e) {
          debugMessage = 'JSI_OPAQUE_ERROR (Unserializable)';
        }
      }

      terminalDebugger.logFatal(debugMessage, isFatal);
      
      // Still show the original error in development
      if (__DEV__ && isFatal) {
        // Log original object for potential native debugging connection
        console.error('DEBUG_ORIGINAL_ERROR:', error);
      }
    };
    
    // Internal RN error handler
    if ((global as any).ErrorUtils) {
      (global as any).ErrorUtils.setGlobalHandler(globalHandler);
    }
  } else {
    // Web
    window.onerror = (message, source, lineno, colno, error) => {
      terminalDebugger.logFatal(error || { message, stack: `${source}:${lineno}:${colno}` }, true);
      return false; // Let browser handle it as well
    };

    window.onunhandledrejection = (event) => {
      terminalDebugger.logUnhandledRejection(event.reason);
    };
  }

  // 2. Network Interceptor (Optional: Monkey-patch fetch)
  const originalFetch = global.fetch;
  global.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      if (!response.ok) {
        // Can log non-200s here if needed
      }
      return response;
    } catch (error) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      terminalDebugger.logNetwork('FETCH', url, error);
      throw error;
    }
  };

  console.log('🛡️  [GLOBAL_DEBUGGER] Critical error handlers initialized.');
}
