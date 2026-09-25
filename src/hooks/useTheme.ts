import { useContext } from 'react';
import { ThemeContext } from '../theme/themeContext';
import type { ThemeContextValue } from '../theme/themeContext';

/** The active theme and a setter that also remembers the choice. Must be used within `<ThemeProvider>`. */
export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
};
