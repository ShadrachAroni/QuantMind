import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeType, ThemeColors, THEMES } from '../constants/theme';
import * as SecureStore from 'expo-secure-store';

interface ThemeContextType {
  theme: ThemeColors;
  themeType: ThemeType;
  setThemeType: (type: ThemeType) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeType, setThemeType] = useState<ThemeType>('dark');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync('@theme_type');
        if (savedTheme) {
          setThemeType(savedTheme as ThemeType);
        } else if (systemColorScheme) {
          setThemeType(systemColorScheme === 'dark' ? 'dark' : 'light');
        }
      } catch (e) {
        console.warn('Failed to load theme', e);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const handleSetTheme = async (type: ThemeType) => {
    setThemeType(type);
    try {
      await SecureStore.setItemAsync('@theme_type', type);
    } catch (e) {
      console.warn('Failed to save theme', e);
    }
  };

  const currentTheme = THEMES[themeType] || THEMES.dark;
  const isDark = themeType !== 'light';

  return (
    <ThemeContext.Provider value={{ 
      theme: currentTheme, 
      themeType, 
      setThemeType: handleSetTheme,
      isDark
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
