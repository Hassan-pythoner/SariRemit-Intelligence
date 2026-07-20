import React, { createContext, useContext, useState, useEffect } from 'react';
import { ENABLE_LIGHT_MODE, ENABLE_SYSTEM_THEME } from '../services/constants';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setPreference: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'sariremit-theme-preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial preference from localStorage with default 'system'
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (!ENABLE_LIGHT_MODE) return 'dark';
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference;
      if (stored === 'light' || stored === 'dark' || (stored === 'system' && ENABLE_SYSTEM_THEME)) {
        return stored;
      }
    } catch (e) {
      console.warn('[ThemeService] Failed to read theme from localStorage', e);
    }
    return ENABLE_SYSTEM_THEME ? 'system' : 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Calculate resolved theme based on preference & device settings
  useEffect(() => {
    if (!ENABLE_LIGHT_MODE) {
      setResolvedTheme('dark');
      return;
    }

    if (preference === 'light') {
      setResolvedTheme('light');
    } else if (preference === 'dark') {
      setResolvedTheme('dark');
    } else {
      // system theme
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');

      const listener = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };

      // Modern listener
      mediaQuery.addEventListener('change', listener);
      return () => {
        mediaQuery.removeEventListener('change', listener);
      };
    }
  }, [preference]);

  // Apply resolved theme class and attributes to document element
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    }

    // Update mobile status bar and theme-color where supported
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const colorVal = resolvedTheme === 'light' ? '#F1F5F9' : '#051326';
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colorVal);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = colorVal;
      document.head.appendChild(meta);
    }
  }, [resolvedTheme]);

  // Save preference to local storage
  const setPreference = (newPref: ThemePreference) => {
    if (!ENABLE_LIGHT_MODE) return;
    setPreferenceState(newPref);
    try {
      localStorage.setItem(STORAGE_KEY, newPref);
    } catch (e) {
      console.warn('[ThemeService] Failed to save theme preference to localStorage', e);
    }
  };

  // Toggle theme utility
  const toggleTheme = () => {
    if (!ENABLE_LIGHT_MODE) return;
    if (resolvedTheme === 'dark') {
      setPreference('light');
    } else {
      setPreference('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference, toggleTheme }}>
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
