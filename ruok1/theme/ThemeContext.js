import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { 
  lightColors, 
  darkColors, 
  purpleColors, 
  darkPurpleColors, 
  forestColors, 
  darkForestColors,
  tennesseeColors,
  darkTennesseeColors 
} from './colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const THEME_MODES = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
};

export const THEME_VARIANTS = {
  DEFAULT: 'default',
  PURPLE: 'purple',
  FOREST: 'forest',
  TENNESSEE: 'tennessee',
};

export const ThemeProvider = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(THEME_MODES.LIGHT);
  const [themeVariant, setThemeVariant] = useState(THEME_VARIANTS.DEFAULT);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const [savedMode, savedVariant] = await Promise.all([
        AsyncStorage.getItem('themeMode'),
        AsyncStorage.getItem('themeVariant'),
      ]);
      if (savedMode) setThemeMode(savedMode);
      if (savedVariant) setThemeVariant(savedVariant);
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const setTheme = async (mode, variant = themeVariant) => {
    try {
      await Promise.all([
        AsyncStorage.setItem('themeMode', mode),
        AsyncStorage.setItem('themeVariant', variant),
      ]);
      setThemeMode(mode);
      setThemeVariant(variant);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const isDark = themeMode === THEME_MODES.DARK || 
                (themeMode === THEME_MODES.SYSTEM && deviceColorScheme === 'dark');

  const getThemeColors = () => {
    switch (themeVariant) {
      case THEME_VARIANTS.PURPLE:
        return isDark ? darkPurpleColors : purpleColors;
      case THEME_VARIANTS.FOREST:
        return isDark ? darkForestColors : forestColors;
      case THEME_VARIANTS.TENNESSEE:
        return isDark ? darkTennesseeColors : tennesseeColors;
      default:
        return isDark ? darkColors : lightColors;
    }
  };

  const theme = {
    colors: getThemeColors(),
    isDark,
    setTheme,
    themeMode,
    themeVariant,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 