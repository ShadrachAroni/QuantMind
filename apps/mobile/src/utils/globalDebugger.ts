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
      terminalDebugger.logFatal(error, isFatal);
      
      // Still show the original error in development
      if (__DEV__) {
        // We don't want to swallow it entirely in dev, so we let it propagate
        // However, some setups might prefer to silence the red screen.
      }
    };
    
    // Internal RN error handler
    // @ts-ignore
    if (global.ErrorUtils) {
      // @ts-ignore
      global.ErrorUtils.setGlobalHandler(globalHandler);
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
