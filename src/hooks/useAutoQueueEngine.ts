import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  getNextPlayablePlannedMatchId,
  getRecommendedMatchId,
  planAutoAdjust,
  planAutoSessionRefill,
  pruneInactiveOrRemovedPlayers,
} from '../domain';
import { useAppState } from './useAppState';
import { useStrictModeInvokeGuard } from './useStrictModeInvokeGuard';

export interface UseAutoQueueEngineOptions {
  /** Called whenever stale matches get dropped because a player went resting/was removed. */
  onStaleMatchesRemoved?: () => void;
}

/**
 * Auto mode's queue orchestration: prunes matches referencing resting/removed
 * players, keeps `AUTO_SESSION_BUFFER` sessions planned ahead of time, and
 * exposes the "recommended match" id plus the "系統自動微調" action.
 */
export const useAutoQueueEngine = ({ onStaleMatchesRemoved }: UseAutoQueueEngineOptions = {}) => {
  const { state, dispatch } = useAppState();
  const onStaleMatchesRemovedRef = useRef(onStaleMatchesRemoved);
  onStaleMatchesRemovedRef.current = onStaleMatchesRemoved;

  const isDuplicatePruneInvoke = useStrictModeInvokeGuard();
  const isDuplicateRefillInvoke = useStrictModeInvokeGuard();

  // LOGIC 2: drop any queued match (manual or system) touching a resting/removed player.
  useEffect(() => {
    if (isDuplicatePruneInvoke([state.players, state.queue])) return;

    const nextQueue = pruneInactiveOrRemovedPlayers(state.queue, state.players);
    if (nextQueue.length !== state.queue.length) {
      dispatch({ type: 'QUEUE_UPDATED', queue: nextQueue });
      onStaleMatchesRemovedRef.current?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.players, state.queue, dispatch]);

  // LOGIC 3: keep AUTO_SESSION_BUFFER sessions queued ahead of time.
  useEffect(() => {
    if (
      isDuplicateRefillInvoke([
        state.players,
        state.queue,
        state.history,
        state.activeMatches,
        state.mode,
        state.sessionCounter,
      ])
    ) {
      return;
    }

    const systemQueue = state.queue.filter((m) => !m.isManual);
    const { newMatches, nextSessionCounter } = planAutoSessionRefill({
      players: state.players,
      systemQueue,
      history: state.history,
      activeMatches: state.activeMatches,
      mode: state.mode,
      sessionCounter: state.sessionCounter,
    });

    if (newMatches.length > 0) {
      dispatch({ type: 'SESSION_MATCHES_QUEUED', matches: newMatches, nextSessionCounter });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.players, state.queue, state.history, state.activeMatches, state.mode, state.sessionCounter, dispatch]);

  const recommendedMatchId = useMemo(() => {
    // If the admin's own pre-arranged plan already has something ready to go,
    // defer to it entirely rather than showing a second, competing
    // recommendation here - there's only one "next" court slot to fill.
    const nextPlanned = getNextPlayablePlannedMatchId(
      state.plannedOrder,
      state.queue,
      state.activeMatches,
      state.courtCount,
    );
    if (nextPlanned) return null;

    const unplannedQueue = state.queue.filter((m) => !state.plannedOrder.includes(m.id));
    return getRecommendedMatchId(unplannedQueue, state.activeMatches, state.courtCount);
  }, [state.queue, state.plannedOrder, state.activeMatches, state.courtCount]);

  const autoAdjust = useCallback((): number => {
    const { queue, swapCount } = planAutoAdjust(state.queue, state.activeMatches, state.players);
    if (swapCount > 0) {
      dispatch({ type: 'QUEUE_UPDATED', queue });
    }
    return swapCount;
  }, [state.queue, state.activeMatches, state.players, dispatch]);

  return { recommendedMatchId, autoAdjust };
};
