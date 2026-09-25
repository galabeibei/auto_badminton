import React from 'react';
import { render } from '@testing-library/react';
import { AppStateProvider } from '../state/AppStateProvider';
import { ThemeProvider } from '../theme/ThemeProvider';

/** Renders `ui` wrapped in a fresh `<ThemeProvider>` + `<AppStateProvider>`, for screens/components that read app state via context. */
export const renderWithAppState = (ui: React.ReactElement) =>
  render(
    <ThemeProvider>
      <AppStateProvider>{ui}</AppStateProvider>
    </ThemeProvider>,
  );
