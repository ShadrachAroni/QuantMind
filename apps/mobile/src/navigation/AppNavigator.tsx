import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Platform, AppState, PanResponder } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { TIER_ENTITLEMENTS, SubscriptionTier } from '@quantmind/shared-types';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { useSyncStore } from '../store/syncStore';
import { useResponsive } from '../hooks/useResponsive';
import { usePerformance } from '../context/PerformanceContext';

// Screens
import { HomeScreen } from '../screens/main/HomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { PreAuthScreen } from '../screens/auth/PreAuthScreen';
import { PortfolioListScreen } from '../screens/portfolio/PortfolioListScreen';
import { PortfolioBuilderScreen } from '../screens/portfolio/PortfolioBuilderScreen';
import { AssetManagementScreen } from '../screens/portfolio/AssetManagementScreen';
import { PortfolioDetailScreen } from '../screens/portfolio/PortfolioDetailScreen';
import { SimulationScreen } from '../screens/simulation/SimulationScreen';
import { SimulationResultsScreen } from '../screens/simulation/SimulationResultsScreen';
import { BacktestScreen } from '../screens/simulation/BacktestScreen';
import { AIChatScreen } from '../screens/ai/AIChatScreen';
import { AnalyticsOverviewScreen } from '../screens/main/AnalyticsOverviewScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { PrivacyPolicyScreen } from '../screens/settings/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../screens/settings/TermsOfServiceScreen';
import { SupportScreen } from '../screens/settings/SupportScreen';
import { AboutAppScreen } from '../screens/settings/AboutAppScreen';
import { HowToUseScreen } from '../screens/settings/HowToUseScreen';
import { AIPreferencesScreen } from '../screens/settings/AIPreferencesScreen';
import { SubscriptionScreen } from '../screens/settings/SubscriptionScreen';
import { MFAScreen } from '../screens/settings/MFAScreen';
import { ActiveSessionsScreen } from '../screens/settings/ActiveSessionsScreen';
import { ChangePasswordScreen } from '../screens/settings/ChangePasswordScreen';
import { DataManagementScreen } from '../screens/settings/DataManagementScreen';
import { ModelMethodologyScreen } from '../screens/settings/ModelMethodologyScreen';
import { CustomAIIntegrationsScreen } from '../screens/settings/CustomAIIntegrationsScreen';
import { ChangelogScreen } from '../screens/settings/ChangelogScreen';
import { BillingHistoryScreen } from '../screens/settings/BillingHistoryScreen';
import { PasswordExpiredScreen } from '../screens/auth/PasswordExpiredScreen';
import { SessionWarningModal } from '../components/auth/SessionWarningModal';
import { MaintenanceScene } from '../screens/MaintenanceScene';
import { OfflineScene } from '../screens/OfflineScene';

// UI
import { GlowEffect } from '../components/ui/GlowEffect';
import { LayoutGrid, Briefcase, Play, BarChart3, Activity, Cpu, UserCircle, Lock } from 'lucide-react-native';
import { Typography } from '../components/ui/Typography';
import { sharedTheme } from '../constants/theme';

const AuthStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();
const PortfolioStack = createNativeStackNavigator();
const SimulationStack = createNativeStackNavigator();
const AIStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

// Feature Gating Wrapper
function TierRestrictedScreen({ component: Component, requirement }: any) {
  const { tier } = useAuthStore();
  const { theme } = useTheme();
  // Safe cast for indexing
  const userTier = (tier || 'free') as any;
  const entitlements = (TIER_ENTITLEMENTS as any)[userTier];
  const isAllowed = entitlements ? (entitlements as any)[requirement] : false;

  if (!isAllowed) {
    const LockIcon = Lock as any;
    return (
      <View style={[styles.lockedContainer, { backgroundColor: theme.background }]}>
        <LockIcon size={48} color={theme.textTertiary} />
        <Typography variant="h3" style={{ marginTop: 24, color: theme.textPrimary }}>ACCESS_DENIED</Typography>
        <Typography variant="body" style={{ textAlign: 'center', marginTop: 12, paddingHorizontal: 40, color: theme.textSecondary }}>
          This module requires an upgraded clearance level.
        </Typography>
      </View>
    );
  }

  return <Component />;
}

function PortfolioNavigator() {
  return (
    <PortfolioStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <PortfolioStack.Screen name="PortfolioList" component={PortfolioListScreen} />
      <PortfolioStack.Screen name="AssetManagement">
        {(props) => <TierRestrictedScreen {...props} component={AssetManagementScreen} requirement="allow_asset_management" />}
      </PortfolioStack.Screen>
      <PortfolioStack.Screen name="PortfolioBuilder" component={PortfolioBuilderScreen} />
      <PortfolioStack.Screen name="PortfolioDetail" component={PortfolioDetailScreen} />
    </PortfolioStack.Navigator>
  );
}

function SimulationNavigator() {
  return (
    <SimulationStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <SimulationStack.Screen name="SimulationSetup" component={SimulationScreen} />
      <SimulationStack.Screen name="SimulationResults" component={SimulationResultsScreen} />
    </SimulationStack.Navigator>
  );
}

function AINavigator() {
  return (
    <AIStack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <AIStack.Screen name="AIChatMain" component={AIChatScreen} />
    </AIStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
      <SettingsStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <SettingsStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <SettingsStack.Screen name="Support" component={SupportScreen} />
      <SettingsStack.Screen name="AboutApp" component={AboutAppScreen} />
      <SettingsStack.Screen name="HowToUse" component={HowToUseScreen} />
      <SettingsStack.Screen name="AIPreferences">
        {(props) => <TierRestrictedScreen {...props} component={AIPreferencesScreen} requirement="allow_ai_tuning" />}
      </SettingsStack.Screen>
      <SettingsStack.Screen name="Subscription" component={SubscriptionScreen} />
      <SettingsStack.Screen name="MFA" component={MFAScreen} />
      <SettingsStack.Screen name="ActiveSessions" component={ActiveSessionsScreen} />
      <SettingsStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <SettingsStack.Screen name="DataManagement" component={DataManagementScreen} />
      <SettingsStack.Screen name="ModelMethodology" component={ModelMethodologyScreen} />
      <SettingsStack.Screen name="CustomAIIntegrations">
        {(props) => <TierRestrictedScreen {...props} component={CustomAIIntegrationsScreen} requirement="allow_ai_tuning" />}
      </SettingsStack.Screen>
      <SettingsStack.Screen name="Changelog" component={ChangelogScreen} />
      <SettingsStack.Screen name="BillingHistory" component={BillingHistoryScreen} />
    </SettingsStack.Navigator>
  );
}

function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const { isTablet, isLandscape, width, scaleFactor } = useResponsive();
  const { enableGlows } = usePerformance();

  const isSideRail = isTablet || (isLandscape && width > 600);

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: isSideRail ? 0 : 1,
          borderTopColor: theme.border,
          borderRightWidth: isSideRail ? 1 : 0,
          borderRightColor: theme.border,
          height: isSideRail ? '100%' : (Platform.OS === 'ios' ? 88 : 68),
          width: isSideRail ? 80 : '100%',
          paddingBottom: isSideRail ? 20 : (Platform.OS === 'ios' ? 28 : 10),
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: isSideRail ? undefined : 0,
          flexDirection: isSideRail ? 'column' : 'row',
          elevation: 0,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarLabelStyle: {
          fontFamily: sharedTheme.typography.fonts.mono,
          fontSize: 8,
          letterSpacing: 1,
          marginTop: 4,
        },
        tabBarIcon: ({ color, focused }) => {
          let Icon;
          if (route.name === 'Home') Icon = LayoutGrid;
          else if (route.name === 'Portfolios') Icon = Briefcase;
          else if (route.name === 'Sims') Icon = Play;
          else if (route.name === 'Backtest') Icon = BarChart3;
          else if (route.name === 'Terminal') Icon = Activity;
          else if (route.name === 'Oracle') Icon = Cpu;
          else if (route.name === 'Operator') Icon = UserCircle;

          const IconComp = Icon as any;
          return (
            <View style={styles.iconContainer}>
              {focused && enableGlows && (
                <View style={styles.activeGlow}>
                  <GlowEffect color={color} size={32} glowRadius={15} />
                </View>
              )}
              <IconComp size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          );
        },
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} />
      <MainTab.Screen name="Portfolios" component={PortfolioNavigator} />
      <MainTab.Screen name="Sims" component={SimulationNavigator} />
      <MainTab.Screen name="Terminal" component={AnalyticsOverviewScreen} />
      <MainTab.Screen name="Backtest">
        {(props) => <TierRestrictedScreen {...props} component={BacktestScreen} requirement="allow_backtest" />}
      </MainTab.Screen>
      <MainTab.Screen name="Oracle" component={AINavigator} />
      <MainTab.Screen name="Operator" component={SettingsNavigator} />
    </MainTab.Navigator>
  );
}

const linking = {
  prefixes: ['quantmind://', 'https://quantmind.app'],
  config: {
    screens: {
      Onboarding: 'onboarding',
      Login: 'login',
      MainTab: {
        path: '',
        screens: {
          Home: 'home',
          Portfolios: {
            path: 'terminal',
            screens: {
              PortfolioList: '',
              PortfolioDetail: 'portfolio/:id',
            },
          },
          Sims: {
            path: 'sims',
            screens: {
              SimulationSetup: '',
              SimulationResults: 'risk/:portfolioId/:simulationId',
            },
          },
          Backtest: 'backtest',
          Oracle: 'oracle',
          Operator: {
            path: 'operator',
            screens: {
              SettingsMain: 'settings',
              Subscription: 'billing',
              BillingHistory: 'history',
            },
          },
        },
      },
    },
  },
};

export default function AppNavigator() {
  const { user, lastActivityAt, recordActivity, checkSessionExpiry, isPasswordExpired, onboardingCompleted } = useAuthStore();
  const { isOnline } = useRealtimeSync(user?.id);
  const { isMaintenanceMode } = useSyncStore();
  const { theme, isDark } = useTheme();
  const [showWarning, setShowWarning] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(0);

  const appState = useRef(AppState.currentState);

  // Maintenance Check
  const isUserAdmin = (user?.metadata as any)?.is_admin === true;
  const showMaintenance = isMaintenanceMode && !isUserAdmin;

  // Constants for session logic
  const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
  const WARNING_THRESHOLD = SESSION_TIMEOUT - (10 * 60 * 1000); // 10 mins before 24h

  // Activity Tracking via PanResponder
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: () => {
      if (user) recordActivity();
      return false;
    },
  }), [user, recordActivity]);

  // AppState & Expiry Check
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkSessionExpiry();
      }
      appState.current = nextAppState;
    });

    // Background check for warning (every minute)
    const interval = setInterval(() => {
      if (user && lastActivityAt) {
        const now = Date.now();
        const inactiveTime = now - lastActivityAt;

        if (inactiveTime > SESSION_TIMEOUT) {
          checkSessionExpiry();
        } else if (inactiveTime > WARNING_THRESHOLD) {
          setTimeUntilExpiry(SESSION_TIMEOUT - inactiveTime);
          setShowWarning(true);
        } else {
          setShowWarning(false);
        }
      }
    }, 60000); // Check every minute

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [user, lastActivityAt, checkSessionExpiry]);

  const handleExtend = async () => {
    await recordActivity();
    setShowWarning(false);
  };

  if (!isOnline) {
    return <OfflineScene />;
  }

  if (showMaintenance) {
    return <MaintenanceScene />;
  }

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <NavigationContainer
        linking={linking}
        theme={{ 
          dark: isDark, 
          colors: { 
            ...theme, 
            text: theme.textPrimary,
            card: theme.surface,
            border: theme.border,
            notification: theme.primary,
          } as any,
          fonts: Platform.select({
            web: {
              regular: { fontFamily: 'sans-serif', fontWeight: '400' },
              medium: { fontFamily: 'sans-serif', fontWeight: '500' },
              bold: { fontFamily: 'sans-serif', fontWeight: '700' },
              heavy: { fontFamily: 'sans-serif', fontWeight: '900' },
            },
            default: {
              regular: { fontFamily: 'System', fontWeight: '400' },
              medium: { fontFamily: 'System', fontWeight: '500' },
              bold: { fontFamily: 'System', fontWeight: '700' },
              heavy: { fontFamily: 'System', fontWeight: '900' },
            }
          }) as any
        }}
      >
        {user ? (
          isPasswordExpired ? (
            <AuthStack.Navigator screenOptions={{ headerShown: false }}>
              <AuthStack.Screen name="PasswordExpired" component={PasswordExpiredScreen} />
              <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </AuthStack.Navigator>
          ) : onboardingCompleted ? (
            <MainTabNavigator />
          ) : (
            <AuthStack.Navigator screenOptions={{ headerShown: false }}>
              <AuthStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            </AuthStack.Navigator>
          )
        ) : (
          <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
            <AuthStack.Screen 
              name="PreAuth" 
              component={PreAuthScreen} 
              options={{ animation: 'slide_from_bottom' }}
            />
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="SignUp" component={SignUpScreen} />
            <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <AuthStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          </AuthStack.Navigator>
        )}
      </NavigationContainer>

      <SessionWarningModal
        visible={showWarning}
        onExtend={handleExtend}
        expiryTime={timeUntilExpiry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 30,
  },
  activeGlow: {
    position: 'absolute',
    top: -5,
  },
  lockedContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
