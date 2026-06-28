import React, { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark' | 'ocean' | 'nature' | 'rose' | 'lavender' | 'sunset' | 'orchid';

export const THEMES: { id: Theme; label: string }[] = [
  { id: 'light', label: 'النهاري' },
  { id: 'dark', label: 'الليلي' },
  { id: 'ocean', label: 'المحيط' },
  { id: 'nature', label: 'الطبيعة' },
  { id: 'rose', label: 'الورد' },
  { id: 'lavender', label: 'اللافندر' },
  { id: 'sunset', label: 'الغروب' },
  { id: 'orchid', label: 'الأوركيد (بنفسجي وردي)' },
];

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent) => void;
  setTheme: (theme: Theme, event?: React.MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) || 'light'
  );

  useEffect(() => {
    // Initial load sync
    document.documentElement.classList.remove('dark', 'ocean', 'nature', 'rose', 'lavender', 'sunset', 'orchid');
    if (theme !== 'light') {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  const changeThemeWithTransition = (newTheme: Theme, event?: React.MouseEvent) => {
    if (theme === newTheme) return;

    const applyTheme = () => {
      setThemeState(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.remove('dark', 'ocean', 'nature', 'rose', 'lavender', 'sunset', 'orchid');
      if (newTheme !== 'light') {
        document.documentElement.classList.add(newTheme);
      }
    };

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    document.documentElement.style.setProperty('--clip-x', `${x}px`);
    document.documentElement.style.setProperty('--clip-y', `${y}px`);
    document.documentElement.style.setProperty('--clip-r', `${endRadius}px`);

    if ((document as any).startViewTransition) {
      try {
        (document as any).startViewTransition(() => {
          applyTheme();
        });
      } catch (err) {
        console.warn('View transition failed, falling back to simple applyTheme', err);
        applyTheme();
      }
    } else {
      document.documentElement.classList.add('theme-changing');
      applyTheme();
      setTimeout(() => {
        document.documentElement.classList.remove('theme-changing');
      }, 400);
    }
  };

  const toggleTheme = (event?: React.MouseEvent) => {
    const currentIndex = THEMES.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    changeThemeWithTransition(THEMES[nextIndex].id, event);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: changeThemeWithTransition }}>
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

