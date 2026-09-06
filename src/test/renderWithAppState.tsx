import React from 'react';
import { render } from '@testing-library/react';
import { AppStateProvider } from '../state/AppStateProvider';

/** Renders `ui` wrapped in a fresh `<AppStateProvider>`, for screens/components that read app state via context. */
export const renderWithAppState = (ui: React.ReactElement) => render(<AppStateProvider>{ui}</AppStateProvider>);
