import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeType, Theme, getTheme } from '../constants/theme';
import { storage } from '../utils/storage';
import { SecureKeys } from '../constants/keys';
import { terminalDebugger } from '../utils/terminalDebugger';

interface ThemeContextType {
  theme: Theme;
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
        const savedTheme = await storage.getItemAsync(SecureKeys.SETTINGS.THEME_TYPE);
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
      await storage.setItemAsync(SecureKeys.SETTINGS.THEME_TYPE, type);
    } catch (e) {
      console.warn('Failed to save theme', e);
    }
  };

  const currentTheme = getTheme(themeType);
  const tracedTheme = terminalDebugger.traceTheme(currentTheme);
  const isDark = themeType !== 'light';

  return (
    <ThemeContext.Provider value={{ 
      theme: tracedTheme, 
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
