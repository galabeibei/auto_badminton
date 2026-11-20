import { getMatchPlayerIds } from './matchPlayers';
import { rotationKey } from './tiebreak';
import type { Match, Player } from './types';

/**
 * Default fairness ordering shared by every matchmaking engine:
 * 1. Longest wait first (`lastMatchEndTime` ascending; 0 = never played = oldest).
 * 2. Fewest matches played first.
 * 3. A rating-neutral arbitrary order (see `tiebreak.ts`) - deliberately NOT
 *    "higher MMR first", which made the weakest players the ones left waiting
 *    whenever nothing else separated the queue (most of all at the start of a
 *    game, when nobody has played yet).
 */
export const byWaitPriority = (a: Player, b: Player): number => {
  if (a.lastMatchEndTime !== b.lastMatchEndTime) return a.lastMatchEndTime - b.lastMatchEndTime;
  if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed;
  return rotationKey(a.id, 0) - rotationKey(b.id, 0);
};

/**
 * Returns every active player who is not currently on a court and not already
 * sitting in any queued match, sorted by `byWaitPriority`. This is the shared
 * "who's next" list every matchmaking engine reads from.
 */
export const getAvailablePlayersSorted = (
  allPlayers: Player[],
  activeMatches: Match[],
  queuedMatches: Match[],
): Player[] => {
  const busyIds = new Set<string>([
    ...getMatchPlayerIds(activeMatches),
    ...getMatchPlayerIds(queuedMatches),
  ]);

  return allPlayers.filter((p) => p.isActive && !busyIds.has(p.id)).sort(byWaitPriority);
};
