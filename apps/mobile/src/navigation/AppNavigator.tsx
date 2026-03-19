import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { theme } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

// Main Screens
import { HomeScreen } from '../screens/main/HomeScreen';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';

// Portfolio Screens
import { PortfolioListScreen } from '../screens/portfolio/PortfolioListScreen';
import { PortfolioBuilderScreen } from '../screens/portfolio/PortfolioBuilderScreen';
import { PortfolioDetailScreen } from '../screens/portfolio/PortfolioDetailScreen';

// Simulation Screens
import { SimulationScreen } from '../screens/simulation/SimulationScreen';
import { SimulationResultsScreen } from '../screens/simulation/SimulationResultsScreen';

// AI & Settings
import { AIChatScreen } from '../screens/ai/AIChatScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { PrivacyPolicyScreen } from '../screens/settings/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../screens/settings/TermsOfServiceScreen';
import { SupportScreen } from '../screens/settings/SupportScreen';

// Icons
import { Activity, Cpu, Play, Settings2 } from 'lucide-react-native';

const AuthStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();
const PortfolioStack = createNativeStackNavigator();
const SimulationStack = createNativeStackNavigator();
const AIStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

function PortfolioNavigator() {
  return (
    <PortfolioStack.Navigator screenOptions={{ headerShown: false }}>
      <PortfolioStack.Screen name="PortfolioList" component={PortfolioListScreen} />
      <PortfolioStack.Screen name="PortfolioBuilder" component={PortfolioBuilderScreen} />
      <PortfolioStack.Screen name="PortfolioDetail" component={PortfolioDetailScreen} />
    </PortfolioStack.Navigator>
  );
}

function SimulationNavigator() {
  return (
    <SimulationStack.Navigator screenOptions={{ headerShown: false }}>
      <SimulationStack.Screen name="SimulationSetup" component={SimulationScreen} />
      <SimulationStack.Screen name="SimulationResults" component={SimulationResultsScreen} />
    </SimulationStack.Navigator>
  );
}

function AINavigator() {
  return (
    <AIStack.Navigator screenOptions={{ headerShown: false }}>
      <AIStack.Screen name="AIChatMain" component={AIChatScreen} />
    </AIStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
      <SettingsStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <SettingsStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <SettingsStack.Screen name="Support" component={SupportScreen} />
    </SettingsStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceLight,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: theme.typography.fonts.mono,
          fontSize: 10,
        },
        tabBarIcon: ({ color, size }) => {
          const ActiveIcon = Activity as any;
          const PlayIcon = Play as any;
          const CpuIcon = Cpu as any;
          const SettingsIcon = Settings2 as any;
          
          if (route.name === 'Home') return <ActiveIcon size={size} color={color} />;
          if (route.name === 'Portfolios') return <ActiveIcon size={size} color={color} />;
          if (route.name === 'Simulations') return <PlayIcon size={size} color={color} />;
          if (route.name === 'AI') return <CpuIcon size={size} color={color} />;
          if (route.name === 'Settings') return <SettingsIcon size={size} color={color} />;
          return null;
        },
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} />
      <MainTab.Screen name="Portfolios" component={PortfolioNavigator} />
      <MainTab.Screen name="Simulations" component={SimulationNavigator} />
      <MainTab.Screen name="AI" component={AINavigator} />
      <MainTab.Screen name="Settings" component={SettingsNavigator} />
    </MainTab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuthStore();

  return (
    <NavigationContainer>
      {user ? (
        user.metadata?.onboarding_completed ? (
          <MainTabNavigator />
        ) : (
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
             <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
          </AuthStack.Navigator>
        )
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="SignUp" component={SignUpScreen} />
          <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
