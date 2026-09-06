import { useCallback } from 'react';
import {
  applyMatchResult,
  applyWaitTimeOnStart,
  checkPlayerConflict,
  createManualMatch,
  processNoScoreMatch,
  replacePlayerInMatch,
  swapPlayersInQueue,
} from '../domain';
import type { Match, MatchOutcome, MatchResultChange, Player, QueueSlot, ReplaceOutcome } from '../domain';
import { MatchStatus } from '../domain';
import { useAppState } from './useAppState';
import { useMatchAnnouncer } from './useMatchAnnouncer';

export type GoToCourtResult =
  | { ok: true }
  | { ok: false; reason: 'NO_COURT' }
  | { ok: false; reason: 'CONFLICT'; conflictingPlayerIds: string[] };

export interface MatchResultSummary {
  match: Match;
  score1: number;
  score2: number;
  changes: MatchResultChange[];
}

/**
 * Handlers shared by both the Assist and Auto run screens: everything that
 * isn't "how do we decide what to suggest next" (that part is strategy
 * -specific and lives in useAssistQueueEngine / useAutoQueueEngine).
 */
export const useRunLobbyActions = () => {
  const { state, dispatch } = useAppState();
  const { announceMatch, isSoundEnabled, toggleSound } = useMatchAnnouncer();

  const goToCourt = useCallback(
    (match: Match): GoToCourtResult => {
      const usedCourts = new Set(state.activeMatches.map((m) => m.courtId));
      let availableCourt = -1;
      for (let i = 1; i <= state.courtCount; i++) {
        if (!usedCourts.has(i)) {
          availableCourt = i;
          break;
        }
      }
      if (availableCourt === -1) return { ok: false, reason: 'NO_COURT' };

      const conflicts = checkPlayerConflict(match, state.activeMatches);
      if (conflicts.length > 0) {
        return { ok: false, reason: 'CONFLICT', conflictingPlayerIds: conflicts };
      }

      const now = Date.now();
      const updatedPlayers = applyWaitTimeOnStart(state.players, match, now, state.sessionStartTime);
      const refreshTeamPlayers = (teamPlayers: Player[]) =>
        teamPlayers.map((tp) => updatedPlayers.find((p) => p.id === tp.id) ?? tp);

      const freshMatch: Match = {
        ...match,
        team1: { ...match.team1, players: refreshTeamPlayers(match.team1.players) },
        team2: { ...match.team2, players: refreshTeamPlayers(match.team2.players) },
        status: MatchStatus.PLAYING,
        courtId: availableCourt,
        startTime: now,
      };

      announceMatch(freshMatch);
      dispatch({ type: 'MATCH_STARTED', match: freshMatch, updatedPlayers });
      return { ok: true };
    },
    [state.activeMatches, state.courtCount, state.players, state.sessionStartTime, dispatch, announceMatch],
  );

  const matchOver = useCallback(
    (match: Match, outcome: MatchOutcome): MatchResultSummary => {
      const score1 = outcome === 'team1' ? 1 : 0;
      const score2 = outcome === 'team2' ? 1 : 0;
      const durationMinutes = match.startTime ? (Date.now() - match.startTime) / 60000 : 0;

      const { updatedPlayers, changes } = applyMatchResult(state.players, match, score1, score2, durationMinutes);

      const finishedMatch: Match = {
        ...match,
        status: MatchStatus.FINISHED,
        team1: { ...match.team1, score: score1 },
        team2: { ...match.team2, score: score2 },
        endTime: Date.now(),
      };

      dispatch({ type: 'MATCH_FINISHED', finishedMatch, updatedPlayers });
      return { match, score1, score2, changes };
    },
    [state.players, dispatch],
  );

  const confirmNoScore = useCallback(
    (match: Match) => {
      const durationMinutes = match.startTime ? (Date.now() - match.startTime) / 60000 : 0;
      const updatedPlayers = processNoScoreMatch(state.players, match, durationMinutes);
      const finishedMatch: Match = { ...match, status: MatchStatus.FINISHED, endTime: Date.now() };
      dispatch({ type: 'MATCH_FINISHED', finishedMatch, updatedPlayers });
    },
    [state.players, dispatch],
  );

  const returnToQueue = useCallback(
    (match: Match) => {
      const queuedMatch: Match = {
        ...match,
        status: MatchStatus.QUEUED,
        courtId: undefined,
        startTime: undefined,
        endTime: undefined,
        isManual: true,
      };
      dispatch({ type: 'MATCH_RETURNED_TO_QUEUE', match: queuedMatch });
    },
    [dispatch],
  );

  const addManualMatch = useCallback(
    (selectedIds: string[]) => {
      const selectedPlayers = selectedIds
        .map((id) => state.players.find((p) => p.id === id))
        .filter((p): p is Player => !!p);
      if (selectedPlayers.length !== 4) return;

      const newMatch = createManualMatch(
        selectedPlayers as [Player, Player, Player, Player],
        state.sessionCounter,
      );
      dispatch({ type: 'QUEUE_UPDATED', queue: [newMatch, ...state.queue] });
    },
    [state.players, state.sessionCounter, state.queue, dispatch],
  );

  const deleteManualMatch = useCallback(
    (matchId: string) => {
      dispatch({ type: 'QUEUE_UPDATED', queue: state.queue.filter((m) => m.id !== matchId) });
    },
    [state.queue, dispatch],
  );

  const trySwapPlayers = useCallback(
    (source: QueueSlot, target: QueueSlot, options: { allowCrossSession: boolean }) => {
      const result = swapPlayersInQueue(state.queue, source, target, options);
      if (result.ok) {
        dispatch({ type: 'QUEUE_UPDATED', queue: result.queue });
      }
      return result;
    },
    [state.queue, dispatch],
  );

  const replacePlayer = useCallback(
    (target: QueueSlot, replacementPlayerId: string): ReplaceOutcome => {
      const replacement = state.players.find((p) => p.id === replacementPlayerId);
      if (!replacement) return { ok: false, reason: 'NOT_FOUND' };

      const result = replacePlayerInMatch(state.queue, target, replacement);
      if (result.ok) {
        dispatch({ type: 'QUEUE_UPDATED', queue: result.queue });
      }
      return result;
    },
    [state.players, state.queue, dispatch],
  );

  const togglePlanned = useCallback(
    (matchId: string) => {
      if (state.plannedOrder.includes(matchId)) {
        dispatch({ type: 'PLANNED_ORDER_REMOVED', matchId });
      } else {
        dispatch({ type: 'PLANNED_ORDER_ADDED', matchId });
      }
    },
    [state.plannedOrder, dispatch],
  );

  const movePlanned = useCallback(
    (matchId: string, direction: 'up' | 'down') => {
      dispatch({ type: 'PLANNED_ORDER_MOVED', matchId, direction });
    },
    [dispatch],
  );

  return {
    isSoundEnabled,
    toggleSound,
    goToCourt,
    matchOver,
    confirmNoScore,
    returnToQueue,
    addManualMatch,
    deleteManualMatch,
    trySwapPlayers,
    replacePlayer,
    togglePlanned,
    movePlanned,
  };
};
