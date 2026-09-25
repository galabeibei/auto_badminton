import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ThemeContext } from './themeContext';
import { applyThemeToDocument, loadThemeId, saveThemeId } from './themeStorage';
import { getTheme } from './themes';
import type { ThemeId } from './themes';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(loadThemeId);

  // Layout effect so the saved theme is applied before the first paint (no flash of the classic theme).
  useLayoutEffect(() => {
    applyThemeToDocument(themeId);
  }, [themeId]);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    saveThemeId(id);
  }, []);

  const value = useMemo(() => ({ theme: getTheme(themeId), setThemeId }), [themeId, setThemeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
