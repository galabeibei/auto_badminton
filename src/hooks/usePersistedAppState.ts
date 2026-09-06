import { useEffect, useRef, useState } from 'react';
import { useAppState } from './useAppState';
import { clearState, loadState, saveState } from '../state/persistence';
import { Stage } from '../state/appState';
import type { AppState } from '../state/appState';

const SAVE_DEBOUNCE_MS = 300;

/**
 * Wires up decision D2 (localStorage persistence): on mount, checks for a
 * previous in-progress game and surfaces it for the UI to offer restoring;
 * afterwards, auto-saves the live state (debounced) any time it changes, and
 * clears the save whenever the app is back at the Home screen (including
 * right after a full game reset).
 */
export const usePersistedAppState = () => {
  const { state, dispatch } = useAppState();
  const [pendingRestore, setPendingRestore] = useState<AppState | null>(null);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const saved = loadState();
    if (saved && saved.stage !== Stage.HOME) {
      setPendingRestore(saved);
    }
  }, []);

  useEffect(() => {
    if (pendingRestore) return; // don't overwrite the backup before the user decides

    const timeoutId = setTimeout(() => {
      if (state.stage === Stage.HOME) {
        clearState();
      } else {
        saveState(state);
      }
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [state, pendingRestore]);

  const restore = () => {
    if (!pendingRestore) return;
    dispatch({ type: 'STATE_RESTORED', state: pendingRestore });
    setPendingRestore(null);
  };

  const discard = () => {
    clearState();
    setPendingRestore(null);
  };

  return { hasPendingRestore: pendingRestore !== null, restore, discard };
};
