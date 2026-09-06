import { useContext } from 'react';
import { AppStateContext } from '../state/appStateContext';
import type { AppStateContextValue } from '../state/appStateContext';

/** Access to the single global `{ state, dispatch }` pair. Must be used within `<AppStateProvider>`. */
export const useAppState = (): AppStateContextValue => {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within an <AppStateProvider>');
  }
  return ctx;
};
