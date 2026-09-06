import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { generateTestPlayers } from '../domain';
import { AppStateProvider } from '../state/AppStateProvider';
import { useAppState } from './useAppState';
import { useAutoQueueEngine } from './useAutoQueueEngine';

/**
 * Regression test for a real bug caught by manually clicking through the app:
 * React 18 Strict Mode double-invokes effects once during development (mount
 * -> simulate cleanup -> remount) *before* any state dispatched by the first
 * invocation has been processed. useAutoQueueEngine's session-refill effect
 * generates brand-new Match objects (fresh ids) from state, so without a
 * guard, the second invocation saw the same "before" state and generated a
 * whole extra set of sessions - doubling every match in the Auto-mode queue.
 */
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <React.StrictMode>
    <AppStateProvider>{children}</AppStateProvider>
  </React.StrictMode>
);

describe('useAutoQueueEngine under React.StrictMode', () => {
  it('plans exactly AUTO_SESSION_BUFFER (2) sessions once, not duplicated by the dev double-invoke', () => {
    const { result } = renderHook(
      () => {
        const { state, dispatch } = useAppState();
        useAutoQueueEngine();
        return { state, dispatch };
      },
      { wrapper },
    );

    act(() => {
      result.current.dispatch({ type: 'PLAYERS_ADDED', players: generateTestPlayers(14, []) });
    });

    const systemQueue = result.current.state.queue.filter((m) => !m.isManual);
    const sessionIds = new Set(systemQueue.map((m) => m.sessionId));

    expect(sessionIds.size).toBe(2);
    // 14 players -> 3 full matches per session (2 sit out), across 2 sessions.
    expect(systemQueue).toHaveLength(6);
    expect(new Set(systemQueue.map((m) => m.id)).size).toBe(6); // every match is distinct, none duplicated
  });
});
