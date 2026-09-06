import { getMatchPlayerIds } from './matchPlayers';
import type { Match, Player } from './types';

/**
 * Records how long each player in `match` waited before being sent to a
 * court just now. Wait time is measured from their last recorded
 * `lastMatchEndTime` (or `sessionStartTime` if they've never played yet) to
 * `now`. Call this once, right when a match transitions from queued to playing.
 */
export const applyWaitTimeOnStart = (
  players: Player[],
  match: Match,
  now: number,
  sessionStartTime: number,
): Player[] => {
  const matchPlayerIds = getMatchPlayerIds([match]);

  return players.map((p) => {
    if (!matchPlayerIds.has(p.id)) return p;

    const startWait = p.lastMatchEndTime > 0 ? p.lastMatchEndTime : sessionStartTime;
    const addedWait = now - startWait;

    return {
      ...p,
      totalWaitTime: p.totalWaitTime + addedWait,
      maxWaitTime: Math.max(p.maxWaitTime, addedWait),
    };
  });
};
