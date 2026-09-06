import { useCallback, useEffect } from 'react';
import {
  ASSIST_SUGGESTION_LIMIT,
  getAvailablePlayersSorted,
  getMatchPlayers,
  pruneAssistSystemQueue,
  suggestNextMatch,
} from '../domain';
import type { Match } from '../domain';
import { useAppState } from './useAppState';
import { useStrictModeInvokeGuard } from './useStrictModeInvokeGuard';

/**
 * Assist mode's queue orchestration: keeps exactly `ASSIST_SUGGESTION_LIMIT`
 * (1) system suggestion queued at all times, pruning any suggestion that's
 * gone stale (a player became busy or was set to resting), and exposes the
 * "换一组" (refresh/veto) action for the UI.
 */
export const useAssistQueueEngine = () => {
  const { state, dispatch } = useAppState();
  const isDuplicateInvoke = useStrictModeInvokeGuard();

  useEffect(() => {
    if (
      isDuplicateInvoke([
        state.players,
        state.activeMatches,
        state.queue,
        state.history,
        state.mode,
        state.sessionCounter,
      ])
    ) {
      return;
    }

    const prunedQueue = pruneAssistSystemQueue(state.queue, state.activeMatches, state.players);
    const queueChangedByPrune = prunedQueue.length !== state.queue.length;

    const systemCount = prunedQueue.filter((m) => !m.isManual).length;
    const needed = Math.max(0, ASSIST_SUGGESTION_LIMIT - systemCount);

    const addedMatches: Match[] = [];
    let workingQueue = prunedQueue;
    let nextSessionCounter = state.sessionCounter;

    for (let i = 0; i < needed; i++) {
      const available = getAvailablePlayersSorted(state.players, state.activeMatches, workingQueue);
      if (available.length < 4) break;

      const newMatch = suggestNextMatch(available, state.mode, state.history, state.activeMatches, nextSessionCounter);
      if (!newMatch) break;

      workingQueue = [...workingQueue, newMatch];
      addedMatches.push(newMatch);
      nextSessionCounter += 1;
    }

    if (queueChangedByPrune) {
      dispatch({ type: 'QUEUE_UPDATED', queue: prunedQueue });
    }
    if (addedMatches.length > 0) {
      dispatch({ type: 'SESSION_MATCHES_QUEUED', matches: addedMatches, nextSessionCounter });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.players, state.activeMatches, state.queue, state.history, state.mode, state.sessionCounter, dispatch]);

  /** "换一组": keeps the longest-waiting player of `match` as the anchor, replaces everyone else. */
  const refreshSuggestion = useCallback(
    (match: Match): boolean => {
      const matchPlayers = getMatchPlayers(match);
      const sortedByWait = [...matchPlayers].sort((a, b) => {
        const realA = state.players.find((p) => p.id === a.id) ?? a;
        const realB = state.players.find((p) => p.id === b.id) ?? b;
        return realA.lastMatchEndTime - realB.lastMatchEndTime;
      });

      const anchorId = sortedByWait[0].id;
      const othersIds = matchPlayers.filter((p) => p.id !== anchorId).map((p) => p.id);

      const queueWithoutTarget = state.queue.filter((m) => m.id !== match.id);
      const available = getAvailablePlayersSorted(state.players, state.activeMatches, queueWithoutTarget);
      const newMatch = suggestNextMatch(
        available,
        state.mode,
        state.history,
        state.activeMatches,
        match.sessionId,
        othersIds,
      );

      if (!newMatch) return false;
      dispatch({ type: 'QUEUE_UPDATED', queue: [...queueWithoutTarget, newMatch] });
      return true;
    },
    [state.players, state.queue, state.activeMatches, state.mode, state.history, dispatch],
  );

  return { refreshSuggestion };
};
