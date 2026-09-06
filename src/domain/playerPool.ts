import { getMatchPlayerIds } from './matchPlayers';
import type { Match, Player } from './types';

/**
 * Default fairness ordering shared by every matchmaking engine:
 * 1. Longest wait first (`lastMatchEndTime` ascending; 0 = never played = oldest).
 * 2. Fewest matches played first.
 * 3. Higher MMR first (a stable, low-impact tiebreaker).
 */
export const byWaitPriority = (a: Player, b: Player): number => {
  if (a.lastMatchEndTime !== b.lastMatchEndTime) return a.lastMatchEndTime - b.lastMatchEndTime;
  if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed;
  return b.mmr - a.mmr;
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
