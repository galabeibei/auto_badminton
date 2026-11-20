import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { generateTestPlayers } from '../domain';
import { AppStateProvider } from '../state/AppStateProvider';
import { ThemeProvider } from '../theme/ThemeProvider';
import { useAppState } from './useAppState';
import { useAutoQueueEngine } from './useAutoQueueEngine';
import { useRunLobbyActions } from './useRunLobbyActions';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <AppStateProvider>{children}</AppStateProvider>
  </ThemeProvider>
);

/** A running Auto-mode lobby: 8 players queued ahead, plus one manual grouping. */
const setUpRunningLobby = () => {
  const rendered = renderHook(
    () => {
      const { state, dispatch } = useAppState();
      useAutoQueueEngine();
      const lobby = useRunLobbyActions();
      return { state, dispatch, lobby };
    },
    { wrapper },
  );

  act(() => {
    rendered.result.current.dispatch({ type: 'PLAYERS_ADDED', players: generateTestPlayers(8, []) });
  });
  act(() => {
    rendered.result.current.dispatch({ type: 'GAME_STARTED', now: 1 });
  });
  act(() => {
    const ids = rendered.result.current.state.players.slice(0, 4).map((p) => p.id);
    rendered.result.current.lobby.addManualMatch(ids);
  });

  return rendered;
};

const systemIds = (queue: { id: string; isManual?: boolean }[]) =>
  queue.filter((m) => !m.isManual).map((m) => m.id);

describe('useRunLobbyActions regrouping after a rating correction', () => {
  it('asks for a regroup once a rating is corrected mid-game', () => {
    const { result } = setUpRunningLobby();

    expect(result.current.state.hasPendingMmrEdits).toBe(false);

    act(() => {
      result.current.dispatch({
        type: 'PLAYER_MMR_CHANGED',
        playerId: result.current.state.players[0].id,
        mmr: 2500,
      });
    });

    expect(result.current.state.hasPendingMmrEdits).toBe(true);
  });

  it('replans every system suggestion on confirm, keeping manual groupings and stopping the prompt', () => {
    const { result } = setUpRunningLobby();
    const before = systemIds(result.current.state.queue);
    expect(before.length).toBeGreaterThan(0);

    act(() => {
      result.current.dispatch({
        type: 'PLAYER_MMR_CHANGED',
        playerId: result.current.state.players[0].id,
        mmr: 2500,
      });
    });
    act(() => {
      result.current.lobby.applyRegroup();
    });

    const after = systemIds(result.current.state.queue);
    // The Auto engine refills straight away, so the queue is just as deep as
    // before - but every suggestion is a freshly planned one.
    expect(after).toHaveLength(before.length);
    expect(after.some((id) => before.includes(id))).toBe(false);
    expect(result.current.state.queue.filter((m) => m.isManual)).toHaveLength(1);
    expect(result.current.state.hasPendingMmrEdits).toBe(false);
  });

  it('plans the new suggestions from the corrected rating', () => {
    const { result } = setUpRunningLobby();
    const weakest = [...result.current.state.players].sort((a, b) => a.mmr - b.mmr)[0];

    act(() => {
      result.current.dispatch({ type: 'PLAYER_MMR_CHANGED', playerId: weakest.id, mmr: 5000 });
    });
    act(() => {
      result.current.lobby.applyRegroup();
    });

    // Now the strongest player on the roster by a mile, they must show up in
    // the new suggestions carrying the corrected rating.
    const queuedCopies = result.current.state.queue
      .filter((m) => !m.isManual)
      .flatMap((m) => [...m.team1.players, ...m.team2.players])
      .filter((p) => p.id === weakest.id);

    expect(queuedCopies.length).toBeGreaterThan(0);
    expect(queuedCopies.every((p) => p.mmr === 5000)).toBe(true);
  });

  it('leaves the existing suggestions alone when the prompt is dismissed', () => {
    const { result } = setUpRunningLobby();
    const before = systemIds(result.current.state.queue);

    act(() => {
      result.current.dispatch({
        type: 'PLAYER_MMR_CHANGED',
        playerId: result.current.state.players[0].id,
        mmr: 2500,
      });
    });
    act(() => {
      result.current.lobby.dismissRegroup();
    });

    expect(systemIds(result.current.state.queue)).toEqual(before);
    expect(result.current.state.hasPendingMmrEdits).toBe(false);
  });
});
