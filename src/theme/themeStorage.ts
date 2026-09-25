import { DEFAULT_THEME_ID, isThemeId } from './themes';
import type { ThemeId } from './themes';

/**
 * Kept separate from the game-state save (`state/persistence.ts`): the theme
 * is a device preference that should survive "完成" resets and schema bumps.
 */
const THEME_STORAGE_KEY = 'badminton-matchmaker:theme';

/** Themes that were folded into another one; a saved choice follows its replacement. */
const MERGED_THEME_IDS: Readonly<Record<string, ThemeId>> = {
  wizard: 'fairy',
  princess: 'fairy',
};

/** The saved theme, or the classic theme if nothing (valid) is saved or storage is unavailable. */
export const loadThemeId = (): ThemeId => {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(saved)) return saved;
    return (saved && MERGED_THEME_IDS[saved]) || DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
};

export const saveThemeId = (id: ThemeId): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // Private browsing / quota exceeded: the theme just won't be remembered.
  }
};

/** Activates a theme's CSS variables for the whole page (see `themeTokens.ts`). */
export const applyThemeToDocument = (id: ThemeId): void => {
  document.documentElement.dataset.theme = id;
};
