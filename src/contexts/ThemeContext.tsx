import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to dark mode for entire application
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) return saved;
    return 'dark'; // Default to dark mode for entire web
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const lightColors: ThemeColors = {
    background: '#ffffff',
    surface: '#f5f5f5',
    border: '#e0e0e0',
    text: '#1a1a1a',
    textSecondary: '#666666',
  };

  const darkColors: ThemeColors = {
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme, colors: theme === 'dark' ? darkColors : lightColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
