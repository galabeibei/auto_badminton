import { useContext } from 'react';
import { ThemeContext } from '../theme/themeContext';
import { getCopy } from '../theme/copy';
import type { Copy } from '../theme/copy';

/**
 * The active theme's wording (see `theme/copy.ts`). Falls back to the classic
 * wording outside a `<ThemeProvider>`, so presentational components stay
 * usable (and testable) on their own.
 */
export const useCopy = (): Copy => getCopy(useContext(ThemeContext)?.theme.id);
