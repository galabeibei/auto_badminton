import React from 'react';
import { render } from '@testing-library/react';
import { AppStateProvider } from '../state/AppStateProvider';
import { ThemeProvider } from '../theme/ThemeProvider';
import type { AppState } from '../state/appState';

/**
 * Renders `ui` wrapped in a fresh `<ThemeProvider>` + `<AppStateProvider>`,
 * for screens/components that read app state via context. Pass
 * `initialState` for a screen that only makes sense mid-game (a match on a
 * court, a roster already filled in).
 */
export const renderWithAppState = (ui: React.ReactElement, initialState?: AppState) =>
  render(
    <ThemeProvider>
      <AppStateProvider initialState={initialState}>{ui}</AppStateProvider>
    </ThemeProvider>,
  );
