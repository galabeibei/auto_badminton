import { getMatchPlayerIds, getMatchPlayers } from './matchPlayers';
import type { Match, Player } from './types';

const swapPlayerInMatch = (match: Match, oldId: string, replacement: Player): Match => ({
  ...match,
  team1: {
    ...match.team1,
    players: match.team1.players.map((p) => (p.id === oldId ? replacement : p)),
  },
  team2: {
    ...match.team2,
    players: match.team2.players.map((p) => (p.id === oldId ? replacement : p)),
  },
});

export interface AutoAdjustResult {
  queue: Match[];
  swapCount: number;
}

/**
 * "Rescue" swap for Auto mode: when the highest-priority queued match can't
 * take the court because some of its players are still on an active court,
 * this finds free, well-rested substitutes to swap in so the match can start
 * immediately — and swaps the displaced players into wherever the substitute
 * came from, so nobody just vanishes from the queue.
 *
 * Only ever targets `queue`'s first non-manual (system) match, matching the
 * "unblock the very next match" framing shown in the UI.
 */
export const planAutoAdjust = (
  queue: Match[],
  activeMatches: Match[],
  players: Player[],
): AutoAdjustResult => {
  const noop: AutoAdjustResult = { queue, swapCount: 0 };

  const systemQueue = queue.filter((m) => !m.isManual);
  if (systemQueue.length === 0) return noop;

  const targetMatch = systemQueue[0];
  const targetMatchIds = getMatchPlayers(targetMatch).map((p) => p.id);

  const activePlayerIds = getMatchPlayerIds(activeMatches);
  const busyInTarget = targetMatchIds.filter((id) => activePlayerIds.has(id));
  if (busyInTarget.length === 0) return noop;

  const candidates = players
    .filter(
      (p) => p.isActive && !activePlayerIds.has(p.id) && !targetMatchIds.includes(p.id),
    )
    .sort((a, b) => {
      if (a.lastMatchEndTime !== b.lastMatchEndTime) return a.lastMatchEndTime - b.lastMatchEndTime;
      return a.matchesPlayed - b.matchesPlayed;
    });

  const newQueue = [...queue];
  const usedCandidateIds = new Set<string>();
  let swapCount = 0;

  busyInTarget.forEach((busyId) => {
    const candidate = candidates.find((c) => {
      if (usedCandidateIds.has(c.id)) return false;

      const sourceMatch = newQueue.find(
        (m) => m.id !== targetMatch.id && getMatchPlayers(m).some((p) => p.id === c.id),
      );

      // If the candidate is sitting in another queued match, we can only pull
      // them out if that match doesn't already contain `busyId` (otherwise
      // swapping busyId in would create a duplicate player there).
      if (sourceMatch) {
        const busyAlreadyInSource = getMatchPlayers(sourceMatch).some((p) => p.id === busyId);
        if (busyAlreadyInSource) return false;
      }
      return true;
    });

    if (!candidate) return;

    usedCandidateIds.add(candidate.id);
    swapCount++;

    const targetIndex = newQueue.findIndex((m) => m.id === targetMatch.id);
    if (targetIndex !== -1) {
      newQueue[targetIndex] = swapPlayerInMatch(newQueue[targetIndex], busyId, candidate);
    }

    const sourceIndex = newQueue.findIndex(
      (m) => m.id !== targetMatch.id && getMatchPlayers(m).some((p) => p.id === candidate.id),
    );
    if (sourceIndex !== -1) {
      const busyPlayer = players.find((p) => p.id === busyId);
      if (busyPlayer) {
        newQueue[sourceIndex] = swapPlayerInMatch(newQueue[sourceIndex], candidate.id, busyPlayer);
      }
    }
  });

  if (swapCount === 0) return noop;

  return { queue: newQueue, swapCount };
};
