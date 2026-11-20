import { getMatchPlayerIds } from './matchPlayers';
import type { Match, Player } from './types';

/**
 * Records how long each player in `match` waited before being sent to a
 * court just now. Wait time is measured from their last recorded
 * `lastMatchEndTime` (or `sessionStartTime` if they've never played yet) to
 * `now`. Call this once, right when a match transitions from queued to playing.
 */
/** When this player's current wait began: their last match's end, or the lobby opening if they've never played. */
const waitStartedAt = (player: Player, sessionStartTime: number): number =>
  player.lastMatchEndTime > 0 ? player.lastMatchEndTime : sessionStartTime;

export const applyWaitTimeOnStart = (
  players: Player[],
  match: Match,
  now: number,
  sessionStartTime: number,
): Player[] => {
  const matchPlayerIds = getMatchPlayerIds([match]);

  return players.map((p) => {
    if (!matchPlayerIds.has(p.id)) return p;

    const addedWait = now - waitStartedAt(p, sessionStartTime);

    return {
      ...p,
      totalWaitTime: p.totalWaitTime + addedWait,
      maxWaitTime: Math.max(p.maxWaitTime, addedWait),
    };
  });
};

/**
 * Gives back the wait `applyWaitTimeOnStart` recorded when this match was sent
 * to a court, because it is being pulled back off that court ("重排") without
 * having been played.
 *
 * Without this the interval is counted twice: `lastMatchEndTime` only moves
 * when a match *finishes*, so the next time the match goes on, the clock is
 * read from that same old timestamp again. A player who waited 10 minutes,
 * went on, was requeued and went on again 5 minutes later would be recorded
 * as having waited 25 minutes instead of 15.
 *
 * `maxWaitTime` is deliberately left where it is: that wait really did
 * happen, and the longer of the two intervals ends up being recorded anyway
 * when the match is sent on again.
 */
export const revertWaitTimeOnRequeue = (
  players: Player[],
  match: Match,
  sessionStartTime: number,
): Player[] => {
  if (!match.startTime) return players;
  const startTime = match.startTime;
  const matchPlayerIds = getMatchPlayerIds([match]);

  return players.map((p) => {
    if (!matchPlayerIds.has(p.id)) return p;

    const recordedWait = startTime - waitStartedAt(p, sessionStartTime);

    return {
      ...p,
      totalWaitTime: Math.max(0, p.totalWaitTime - recordedWait),
    };
  });
};
