import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearState, loadState, saveState } from './persistence';
import { initialAppState } from './appState';

describe('persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips a saved state', () => {
    const state = { ...initialAppState, courtCount: 7 };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it('returns null when nothing has been saved', () => {
    expect(loadState()).toBeNull();
  });

  it('clearState removes a saved state', () => {
    saveState(initialAppState);
    clearState();
    expect(loadState()).toBeNull();
  });

  it('discards and clears a malformed envelope instead of throwing', () => {
    window.localStorage.setItem('badminton-matchmaker:v2', 'not json');
    expect(() => loadState()).not.toThrow();
    expect(loadState()).toBeNull();
  });

  it('discards a save from a different/older schema version', () => {
    window.localStorage.setItem(
      'badminton-matchmaker:v2',
      JSON.stringify({ version: 0, savedAt: 0, state: initialAppState }),
    );
    expect(loadState()).toBeNull();
  });

  it('never throws even when localStorage itself throws', () => {
    const spy = vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => saveState(initialAppState)).not.toThrow();
    spy.mockRestore();
  });
});
