import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Appearance, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryPersister } from './src/services/storage/queryPersister';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { theme } from './src/constants/theme';
import { SplashScreen as CustomSplashScreen } from './src/screens/Splash';
import { terminalDebugger } from './src/utils/terminalDebugger';
import { GlobalErrorBoundary } from './src/components/debug/GlobalErrorBoundary';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { PerformanceProvider } from './src/context/PerformanceContext';
import { ToastProvider } from './src/context/ToastContext';
import { useNotifications } from './src/hooks/useNotifications';
import { voiceService } from './src/services/voiceService';
import { initGlobalHandlers } from './src/utils/globalDebugger';
import * as Linking from 'expo-linking';
import * as Font from 'expo-font';
import Animated, { useSharedValue, withTiming, Easing, runOnJS, useAnimatedStyle } from 'react-native-reanimated';
import { CookieConsent } from './src/components/common/CookieConsent';

// Initialize Global Error Handlers immediately
initGlobalHandlers();

import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding until we're ready
SplashScreen.preventAutoHideAsync().catch(() => {});

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24 * 7, // 1 week retention
    },
  },
});

import { validateTheme } from './src/constants/theme';

function AppContent() {
  const { width, height } = useWindowDimensions();
  const { theme, isDark, themeType } = useTheme();
  const { initialize, isLoading, initialized } = useAuthStore();
  const { notificationsEnabled } = useNotifications();
  const splashTranslateY = useSharedValue(0);
  const [isAnimationFinished, setIsAnimationFinished] = useState(false);
  const [splashMounted, setSplashMounted] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.hideAsync();
        await initialize();
        await voiceService.registerShortcuts();
      } catch (e) {
        terminalDebugger.logError('APP_PREPARE_FAILURE', e);
      }
    }
    prepare();
  }, [initialize]);

  // Handle the transition when BOTH initialization and animation are done
  useEffect(() => {
    if (initialized && isAnimationFinished) {
      splashTranslateY.value = withTiming(height, {
        duration: 1000,
        easing: Easing.inOut(Easing.quad),
      }, (finished) => {
        if (finished) {
          runOnJS(setSplashMounted)(false);
        }
      });
    }
  }, [initialized, isAnimationFinished]);

  const handleSplashComplete = () => {
    setIsAnimationFinished(true);
  };

  const animatedSplashStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: splashTranslateY.value }],
  }));

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" translucent={true} />
      
      {/* Real app content remains rendered behind splash for zero delay */}
      {initialized && <AppNavigator />}

      {/* Futuristic Splash Overlay */}
      {splashMounted && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.splashOverlay, animatedSplashStyle]}>
          <CustomSplashScreen onAnimationComplete={handleSplashComplete} />
        </Animated.View>
      )}

      {/* Web-only Cookie Consent */}
      <CookieConsent />
    </View>
  );
}

export default function App() {
  useEffect(() => {
    // Skia web initialisation removed — SVG renderer is used instead
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider 
          client={queryClient} 
          persistOptions={{ 
            persister: queryPersister,
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
          }}
        >
          <GlobalErrorBoundary>
            <ThemeProvider>
              <PerformanceProvider>
                <ToastProvider>
                  <AppContent />
                </ToastProvider>
              </PerformanceProvider>
            </ThemeProvider>
          </GlobalErrorBoundary>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    elevation: 9998,
    backgroundColor: '#060B1A',
  },
});
