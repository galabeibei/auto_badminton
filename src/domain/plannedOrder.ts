import { getMatchPlayerIds, getMatchPlayers } from './matchPlayers';
import type { Match } from './types';

/**
 * "Pre-arranged court order": an explicit, user-controlled sequence of match
 * ids saying "when a court frees up, send these on in this order" - for
 * planning several moves ahead while every court is still busy, instead of
 * re-deciding from scratch each time one frees up.
 *
 * Stored as a plain array of match ids on `AppState.plannedOrder`. A id can
 * become stale (its match started, was deleted, or got pruned) without this
 * array being updated in lock-step; every reader here tolerates that by
 * simply skipping ids no longer present in `queue`.
 */

export const addToPlannedOrder = (order: string[], matchId: string): string[] =>
  order.includes(matchId) ? order : [...order, matchId];

export const removeFromPlannedOrder = (order: string[], matchId: string): string[] =>
  order.filter((id) => id !== matchId);

/** Drops any id no longer present in `queue`, keeping the remaining order. */
export const prunePlannedOrder = (order: string[], queue: Match[]): string[] => {
  const queueIds = new Set(queue.map((m) => m.id));
  return order.filter((id) => queueIds.has(id));
};

/** Swaps `matchId` with its neighbour in the given direction; a no-op at either end. */
export const moveInPlannedOrder = (order: string[], matchId: string, direction: 'up' | 'down'): string[] => {
  const index = order.indexOf(matchId);
  if (index === -1) return order;

  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= order.length) return order;

  const next = [...order];
  [next[index], next[swapWith]] = [next[swapWith], next[index]];
  return next;
};

/** Resolves the ordered list of ids into actual Match objects, dropping any that are no longer queued. */
export const getPlannedMatches = (order: string[], queue: Match[]): Match[] =>
  order
    .map((id) => queue.find((m) => m.id === id))
    .filter((m): m is Match => !!m);

/**
 * The next planned match that could actually take a court right now: the
 * first entry (in plan order) whose players are all free of any active
 * court. Returns null when every court is already occupied (matching
 * `getRecommendedMatchId`'s guard) or nothing planned is currently playable.
 */
export const getNextPlayablePlannedMatchId = (
  order: string[],
  queue: Match[],
  activeMatches: Match[],
  courtCount: number,
): string | null => {
  if (activeMatches.length >= courtCount) return null;

  const activePlayerIds = getMatchPlayerIds(activeMatches);
  const plannedMatches = getPlannedMatches(order, queue);
  const nextPlayable = plannedMatches.find((m) => getMatchPlayers(m).every((p) => !activePlayerIds.has(p.id)));

  return nextPlayable ? nextPlayable.id : null;
};
