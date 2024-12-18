import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const ThemeContext = createContext();

export const themes = {
  light: {
    name: 'light',
    colors: {
      background: '#FFFFFF',
      surface: '#F5F5F5',
      primary: '#00B5E0',
      secondary: '#015B98',
      text: '#000000',
      textSecondary: '#666666',
      border: '#DDDDDD',
      error: '#FF3B30',
      success: '#50C878',
      breathing: {
        inhale: '#50C878',
        hold: '#00B5E0',
        exhale: '#FF3B30',
        countdown: '#FFA500',
      }
    }
  },
  dark: {
    name: 'dark',
    colors: {
      background: '#000000',
      surface: '#111111',
      primary: '#00B5E0',
      secondary: '#015B98',
      text: '#FFFFFF',
      textSecondary: '#999999',
      border: '#333333',
      error: '#FF3B30',
      success: '#50C878',
      breathing: {
        inhale: '#50C878',
        hold: '#00B5E0',
        exhale: '#FF3B30',
        countdown: '#FFA500',
      }
    }
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(themes.dark);

  useEffect(() => {
    // Load user's theme preference from Firestore
    const loadThemePreference = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().preferences?.theme) {
          setTheme(themes[userDoc.data().preferences.theme]);
        }
      }
    };

    loadThemePreference();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme.name === 'light' ? themes.dark : themes.light;
    setTheme(newTheme);

    // Save theme preference to Firestore
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        'preferences.theme': newTheme.name
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 