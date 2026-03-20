import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Platform, AppState, PanResponder } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { TIER_ENTITLEMENTS, SubscriptionTier } from '@quantmind/shared-types';

// Screens
import { HomeScreen } from '../screens/main/HomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { PortfolioListScreen } from '../screens/portfolio/PortfolioListScreen';
import { PortfolioBuilderScreen } from '../screens/portfolio/PortfolioBuilderScreen';
import { AssetManagementScreen } from '../screens/portfolio/AssetManagementScreen';
import { PortfolioDetailScreen } from '../screens/portfolio/PortfolioDetailScreen';
import { SimulationScreen } from '../screens/simulation/SimulationScreen';
import { SimulationResultsScreen } from '../screens/simulation/SimulationResultsScreen';
import { AIChatScreen } from '../screens/ai/AIChatScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { PrivacyPolicyScreen } from '../screens/settings/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../screens/settings/TermsOfServiceScreen';
import { SupportScreen } from '../screens/settings/SupportScreen';
import { AIPreferencesScreen } from '../screens/settings/AIPreferencesScreen';
import { SubscriptionScreen } from '../screens/settings/SubscriptionScreen';
import { SessionWarningModal } from '../components/auth/SessionWarningModal';

// UI
import { GlowEffect } from '../components/ui/GlowEffect';
import { LayoutGrid, Briefcase, Play, Cpu, UserCircle, Lock } from 'lucide-react-native';
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
      <SettingsStack.Screen name="AIPreferences">
        {(props) => <TierRestrictedScreen {...props} component={AIPreferencesScreen} requirement="allow_ai_tuning" />}
      </SettingsStack.Screen>
      <SettingsStack.Screen name="Subscription" component={SubscriptionScreen} />
    </SettingsStack.Navigator>
  );
}

function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
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
          else if (route.name === 'Oracle') Icon = Cpu;
          else if (route.name === 'Operator') Icon = UserCircle;

          const IconComp = Icon as any;
          return (
            <View style={styles.iconContainer}>
              {focused && (
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
      <MainTab.Screen name="Oracle" component={AINavigator} />
      <MainTab.Screen name="Operator" component={SettingsNavigator} />
    </MainTab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, lastActivityAt, recordActivity, checkSessionExpiry } = useAuthStore();
  const { theme, isDark } = useTheme();
  const [showWarning, setShowWarning] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(0);

  const appState = useRef(AppState.currentState);

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

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <NavigationContainer theme={{ dark: isDark, colors: { ...theme, text: theme.textPrimary } as any }}>
        {user ? (
          // Simplified onboarding check for robustness
          user.metadata?.onboarding_completed ? (
            <MainTabNavigator />
          ) : (
            <AuthStack.Navigator screenOptions={{ headerShown: false }}>
               <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
            </AuthStack.Navigator>
          )
        ) : (
          <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="SignUp" component={SignUpScreen} />
            <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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
