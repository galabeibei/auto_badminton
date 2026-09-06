import { AUTO_MODE_LABELS, AUTO_SESSION_BUFFER } from './constants';
import { createOptimizedMatch } from './pairing';
import { resolveMatchMode, type ResolvedMode } from './modeResolver';
import { MatchMode } from './types';
import type { Match, Player } from './types';

/**
 * Generates every match for a single session out of a pool of players that is
 * already sorted by priority. Works purely in chunks of 4 — any remainder
 * (pool size not divisible by 4) is left out and simply waits for the next
 * session. `mode` must already be resolved to SIMILAR or BALANCED.
 */
export const generateSessionMatches = (
  availablePlayers: Player[],
  mode: ResolvedMode,
  sessionId: number,
): Match[] => {
  if (availablePlayers.length < 4) return [];

  const playableCount = Math.floor(availablePlayers.length / 4) * 4;
  const pool = availablePlayers.slice(0, playableCount);
  const modeLabel = mode === MatchMode.SIMILAR ? AUTO_MODE_LABELS.SIMILAR : AUTO_MODE_LABELS.BALANCED;

  const matches: Match[] = [];
  const sortedByMmr = [...pool].sort((a, b) => b.mmr - a.mmr);

  if (mode === MatchMode.SIMILAR) {
    // Strongest play strongest, weakest play weakest: chunk adjacent players.
    for (let i = 0; i < sortedByMmr.length; i += 4) {
      const chunk = sortedByMmr.slice(i, i + 4) as [Player, Player, Player, Player];
      matches.push(createOptimizedMatch(chunk, modeLabel, mode, sessionId, false));
    }
  } else {
    // Fold method: pair the strongest with the weakest so each match's total
    // strength stays close across matches even though each match itself is lopsided.
    const groupCount = sortedByMmr.length / 4;
    for (let i = 0; i < groupCount; i++) {
      const chunk: [Player, Player, Player, Player] = [
        sortedByMmr[i * 2],
        sortedByMmr[i * 2 + 1],
        sortedByMmr[sortedByMmr.length - 1 - i * 2],
        sortedByMmr[sortedByMmr.length - 1 - (i * 2 + 1)],
      ];
      matches.push(createOptimizedMatch(chunk, modeLabel, mode, sessionId, false));
    }
  }

  return matches;
};

/** Priority order used to decide who gets planned into the next Auto session first. */
const byAutoRefillPriority = (queueCounts: Map<string, number>) => (a: Player, b: Player) => {
  const qA = queueCounts.get(a.id) || 0;
  const qB = queueCounts.get(b.id) || 0;
  if (qA !== qB) return qA - qB;
  if (a.lastMatchEndTime !== b.lastMatchEndTime) return a.lastMatchEndTime - b.lastMatchEndTime;
  if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed;
  return b.mmr - a.mmr;
};

export interface AutoRefillInput {
  players: Player[];
  /** Currently queued matches that are NOT manual groupings. */
  systemQueue: Match[];
  history: Match[];
  activeMatches: Match[];
  mode: MatchMode;
  sessionCounter: number;
}

export interface AutoRefillResult {
  newMatches: Match[];
  nextSessionCounter: number;
}

/**
 * Keeps the Auto-mode system queue stocked with `AUTO_SESSION_BUFFER` upcoming
 * sessions. Returns an empty result (no-op) when there's already enough
 * buffered or too few active players to form a match.
 */
export const planAutoSessionRefill = ({
  players,
  systemQueue,
  history,
  activeMatches,
  mode,
  sessionCounter,
}: AutoRefillInput): AutoRefillResult => {
  const noop: AutoRefillResult = { newMatches: [], nextSessionCounter: sessionCounter };

  const activePlayers = players.filter((p) => p.isActive);
  if (activePlayers.length < 4) return noop;

  const queuedSessionIds = Array.from(new Set(systemQueue.map((m) => m.sessionId))).sort(
    (a, b) => a - b,
  );
  if (queuedSessionIds.length >= AUTO_SESSION_BUFFER) return noop;

  let nextSessionId = sessionCounter;
  if (queuedSessionIds.length > 0) {
    const maxInQueue = queuedSessionIds[queuedSessionIds.length - 1];
    if (maxInQueue >= nextSessionId) nextSessionId = maxInQueue + 1;
  }

  const sessionsNeeded = AUTO_SESSION_BUFFER - queuedSessionIds.length;

  const queueCounts = new Map<string, number>();
  systemQueue.forEach((m) => {
    [...m.team1.players, ...m.team2.players].forEach((p) => {
      queueCounts.set(p.id, (queueCounts.get(p.id) || 0) + 1);
    });
  });

  const sortedActivePlayers = [...activePlayers].sort(byAutoRefillPriority(queueCounts));

  // Everything already "on the books" is used to keep Similar/Balanced counts
  // even (decision D1): history + live courts + the existing queue, plus
  // whatever this same refill call has generated so far.
  const recentMatches = [...history, ...activeMatches, ...systemQueue];
  const newMatches: Match[] = [];

  for (let i = 0; i < sessionsNeeded; i++) {
    const sessionId = nextSessionId + i;
    const targetMode = resolveMatchMode(mode, [...recentMatches, ...newMatches]);

    const batch = generateSessionMatches(sortedActivePlayers, targetMode, sessionId);
    if (batch.length === 0) continue;

    newMatches.push(...batch);
    batch.forEach((m) => {
      [...m.team1.players, ...m.team2.players].forEach((p) => {
        queueCounts.set(p.id, (queueCounts.get(p.id) || 0) + 1);
      });
    });
    sortedActivePlayers.sort(byAutoRefillPriority(queueCounts));
  }

  return { newMatches, nextSessionCounter: nextSessionId + sessionsNeeded };
};
