import type { AppState } from './appState';

/**
 * Bumping this invalidates any previously saved game the instant the
 * `AppState`/`Player`/`Match` shape changes, without needing a migration:
 * old saves simply fail the version check and are discarded.
 */
const STORAGE_VERSION = 2;
const STORAGE_KEY = 'badminton-matchmaker:v2';

interface PersistedEnvelope {
  version: typeof STORAGE_VERSION;
  savedAt: number;
  state: AppState;
}

const isPersistedEnvelope = (value: unknown): value is PersistedEnvelope =>
  typeof value === 'object' &&
  value !== null &&
  (value as { version?: unknown }).version === STORAGE_VERSION &&
  typeof (value as { state?: unknown }).state === 'object';

/**
 * Persists the given state to localStorage. Silently does nothing if
 * localStorage is unavailable (private browsing, quota exceeded, etc.) -
 * persistence is a convenience, never something that should crash the app.
 */
export const saveState = (state: AppState): void => {
  try {
    const envelope: PersistedEnvelope = { version: STORAGE_VERSION, savedAt: Date.now(), state };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    /* best-effort only */
  }
};

/** Reads back a previously saved state, or null if there isn't a valid one. */
export const loadState = (): AppState | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isPersistedEnvelope(parsed)) {
      clearState();
      return null;
    }
    return parsed.state;
  } catch {
    clearState();
    return null;
  }
};

/** Removes any saved state (called on a full game reset). */
export const clearState = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* best-effort only */
  }
};
