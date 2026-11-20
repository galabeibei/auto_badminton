import React, { useReducer } from 'react';
import { appReducer } from './appReducer';
import { initialAppState } from './appState';
import type { AppState } from './appState';
import { AppStateContext } from './appStateContext';

interface AppStateProviderProps {
  children: React.ReactNode;
  /** Starting state, for tests that need a game already in progress. The app itself always starts fresh. */
  initialState?: AppState;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children, initialState }) => {
  const [state, dispatch] = useReducer(appReducer, initialState ?? initialAppState);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>{children}</AppStateContext.Provider>
  );
};
