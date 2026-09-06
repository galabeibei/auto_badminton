import { createContext } from 'react';
import type React from 'react';
import type { AppState } from './appState';
import type { AppAction } from './actions';

export interface AppStateContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppStateContext = createContext<AppStateContextValue | null>(null);
