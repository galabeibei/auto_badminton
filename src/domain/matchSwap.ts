import { getMatchPlayers } from './matchPlayers';
import { isValidSwap } from './matchValidation';
import type { Match, Player } from './types';

export interface QueueSlot {
  matchId: string;
  teamId: 'team1' | 'team2';
  index: number;
}

export type SwapOutcome =
  | { ok: true; queue: Match[] }
  | { ok: false; reason: 'NOT_FOUND' | 'CROSS_SESSION' | 'DUPLICATE' };

export type ReplaceOutcome =
  | { ok: true; queue: Match[] }
  | { ok: false; reason: 'NOT_FOUND' | 'DUPLICATE' };

const getPlayerAt = (match: Match, slot: QueueSlot): Player => match[slot.teamId].players[slot.index];

const withPlayerAt = (match: Match, slot: QueueSlot, player: Player): Match => ({
  ...match,
  [slot.teamId]: {
    ...match[slot.teamId],
    players: match[slot.teamId].players.map((p, i) => (i === slot.index ? player : p)),
  },
});

/**
 * Swaps the players sitting at `source` and `target` (each a team/index slot
 * within a queued match), returning the new queue on success. Refuses a swap
 * that would duplicate a player within either match, and - when
 * `allowCrossSession` is false (Auto mode only) - refuses swapping across two
 * different sessions, to keep each session's internal rotation fair.
 */
export const swapPlayersInQueue = (
  queue: Match[],
  source: QueueSlot,
  target: QueueSlot,
  options: { allowCrossSession: boolean } = { allowCrossSession: true },
): SwapOutcome => {
  const sourceMatch = queue.find((m) => m.id === source.matchId);
  const targetMatch = queue.find((m) => m.id === target.matchId);
  if (!sourceMatch || !targetMatch) return { ok: false, reason: 'NOT_FOUND' };

  const sameMatch = sourceMatch.id === targetMatch.id;
  if (!options.allowCrossSession && !sameMatch && sourceMatch.sessionId !== targetMatch.sessionId) {
    return { ok: false, reason: 'CROSS_SESSION' };
  }

  const sourcePlayer = getPlayerAt(sourceMatch, source);
  const targetPlayer = getPlayerAt(targetMatch, target);

  if (!isValidSwap(sourceMatch, targetMatch, sourcePlayer.id, targetPlayer.id)) {
    return { ok: false, reason: 'DUPLICATE' };
  }

  if (sameMatch) {
    const updated = withPlayerAt(withPlayerAt(sourceMatch, source, targetPlayer), target, sourcePlayer);
    return { ok: true, queue: queue.map((m) => (m.id === updated.id ? updated : m)) };
  }

  const newSourceMatch = withPlayerAt(sourceMatch, source, targetPlayer);
  const newTargetMatch = withPlayerAt(targetMatch, target, sourcePlayer);
  return {
    ok: true,
    queue: queue.map((m) => {
      if (m.id === newSourceMatch.id) return newSourceMatch;
      if (m.id === newTargetMatch.id) return newTargetMatch;
      return m;
    }),
  };
};

/**
 * Replaces whoever is sitting at `target` with `replacement`, a player
 * chosen from anywhere in the roster (not necessarily someone already
 * sitting in another queued match). Unlike `swapPlayersInQueue`, this never
 * touches a second match - it only refuses when `replacement` is already
 * one of the *other* three players in this same match, which would
 * otherwise duplicate them within it.
 */
export const replacePlayerInMatch = (
  queue: Match[],
  target: QueueSlot,
  replacement: Player,
): ReplaceOutcome => {
  const match = queue.find((m) => m.id === target.matchId);
  if (!match) return { ok: false, reason: 'NOT_FOUND' };

  const currentPlayer = getPlayerAt(match, target);
  const otherPlayers = getMatchPlayers(match).filter((p) => p.id !== currentPlayer.id);
  if (otherPlayers.some((p) => p.id === replacement.id)) {
    return { ok: false, reason: 'DUPLICATE' };
  }

  const updated = withPlayerAt(match, target, replacement);
  return { ok: true, queue: queue.map((m) => (m.id === updated.id ? updated : m)) };
};
