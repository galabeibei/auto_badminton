import React, { useReducer } from 'react';
import { appReducer } from './appReducer';
import { initialAppState } from './appState';
import { AppStateContext } from './appStateContext';

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>{children}</AppStateContext.Provider>
  );
};
