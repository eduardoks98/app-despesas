import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, StatusBar } from 'react-native';
import { StorageService } from '../services/core';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
    
    // Listen to system appearance changes
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      if (theme === 'system') {
        setIsDarkMode(colorScheme === 'dark');
        StatusBar.setBarStyle(colorScheme === 'dark' ? 'light-content' : 'dark-content');
      }
    });

    return () => listener?.remove();
  }, [theme]);

  useEffect(() => {
    // Update status bar style when dark mode changes
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content');
  }, [isDarkMode]);

  const loadTheme = async () => {
    try {
      const savedTheme = await StorageService.getTheme();
      const systemColorScheme = Appearance.getColorScheme();
      
      if (savedTheme) {
        setThemeState(savedTheme);
        
        if (savedTheme === 'system') {
          setIsDarkMode(systemColorScheme === 'dark');
        } else {
          setIsDarkMode(savedTheme === 'dark');
        }
      } else {
        // Default to system
        setThemeState('system');
        setIsDarkMode(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme:', error);
      // Fallback to system
      const systemColorScheme = Appearance.getColorScheme();
      setThemeState('system');
      setIsDarkMode(systemColorScheme === 'dark');
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await StorageService.saveTheme(newTheme);
      
      if (newTheme === 'system') {
        const systemColorScheme = Appearance.getColorScheme();
        setIsDarkMode(systemColorScheme === 'dark');
      } else {
        setIsDarkMode(newTheme === 'dark');
      }
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    isDarkMode,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};