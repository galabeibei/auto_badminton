import { getMatchPlayers } from './matchPlayers';
import type { Match, Player } from './types';

/**
 * Assist mode's queue health-check: a system (non-manual) suggestion is
 * dropped if any of its players is now playing on a court, sitting in the
 * manual queue, or has been set to resting/removed. Manual matches are never
 * touched by this check.
 */
export const pruneAssistSystemQueue = (
  queue: Match[],
  activeMatches: Match[],
  players: Player[],
): Match[] => {
  const manualQueue = queue.filter((m) => m.isManual);
  const systemQueue = queue.filter((m) => !m.isManual);

  const validSystemQueue = systemQueue.filter((m) => {
    const ids = getMatchPlayers(m).map((p) => p.id);
    const busyInActive = activeMatches.some((am) => getMatchPlayers(am).some((p) => ids.includes(p.id)));
    const busyInManual = manualQueue.some((mm) => getMatchPlayers(mm).some((p) => ids.includes(p.id)));
    const anyoneInactive = ids.some((id) => !players.find((p) => p.id === id)?.isActive);
    return !busyInActive && !busyInManual && !anyoneInactive;
  });

  return [...manualQueue, ...validSystemQueue];
};

/**
 * Auto mode's queue health-check: ANY queued match (manual or system) is
 * dropped as soon as one of its players no longer exists or is resting.
 * Unlike Assist, this deliberately does NOT check active-court membership -
 * Auto plans sessions ahead of time assuming players currently on a court
 * will eventually free up, and relies on the "recommended match" / "auto
 * adjust" features to work around that instead of discarding the plan.
 */
export const pruneInactiveOrRemovedPlayers = (queue: Match[], players: Player[]): Match[] =>
  queue.filter((m) =>
    getMatchPlayers(m).every((p) => players.find((cp) => cp.id === p.id)?.isActive),
  );
