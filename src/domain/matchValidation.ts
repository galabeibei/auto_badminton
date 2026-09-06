import { getMatchPlayerIds, getMatchPlayers } from './matchPlayers';
import type { Match } from './types';

/**
 * Returns true if swapping player `p1Id` (from match1) with `p2Id` (from
 * match2) would NOT create a duplicate player within either match.
 * Swapping within the same match is always valid.
 */
export const isValidSwap = (match1: Match, match2: Match, p1Id: string, p2Id: string): boolean => {
  if (match1.id === match2.id) return true;

  const m1OtherPlayers = [...match1.team1.players, ...match1.team2.players].filter(
    (p) => p.id !== p1Id,
  );
  const m2OtherPlayers = [...match2.team1.players, ...match2.team2.players].filter(
    (p) => p.id !== p2Id,
  );

  if (m1OtherPlayers.some((p) => p.id === p2Id)) return false;
  if (m2OtherPlayers.some((p) => p.id === p1Id)) return false;

  return true;
};

/**
 * Returns the ids of any players in `candidateMatch` who are already playing
 * in one of `activeMatches`. An empty array means it's safe to send the
 * candidate match to a court.
 */
export const checkPlayerConflict = (candidateMatch: Match, activeMatches: Match[]): string[] => {
  const activePlayerIds = getMatchPlayerIds(activeMatches);
  const candidatePlayerIds = getMatchPlayers(candidateMatch).map((p) => p.id);
  return candidatePlayerIds.filter((id) => activePlayerIds.has(id));
};
