import { createContext } from 'react';
import type { ThemeDefinition, ThemeId } from './themes';

export interface ThemeContextValue {
  theme: ThemeDefinition;
  setThemeId: (id: ThemeId) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
