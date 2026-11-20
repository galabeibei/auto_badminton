import { AUTO_MODE_LABELS, AUTO_SESSION_BUFFER } from './constants';
import { createOptimizedMatch } from './pairing';
import { resolveMatchMode, type ResolvedMode } from './modeResolver';
import { getMatchPlayerIds } from './matchPlayers';
import { countPairGroupings, rebalanceSessionGroups } from './sessionGrouping';
import { rotationKey } from './tiebreak';
import { MatchMode } from './types';
import type { Match, Player } from './types';

/**
 * Generates every match for a single session out of a pool of players that is
 * already sorted by priority. Works purely in chunks of 4 — any remainder
 * (pool size not divisible by 4) is left out and simply waits for the next
 * session. `mode` must already be resolved to SIMILAR or BALANCED.
 *
 * The MMR-derived chunks are only the starting point: `rebalanceSessionGroups`
 * then swaps players between them to break up quartets that have already
 * played together (or are already queued together in `pendingMatches`),
 * without giving up the shape the mode asks for.
 */
export const generateSessionMatches = (
  availablePlayers: Player[],
  mode: ResolvedMode,
  sessionId: number,
  pendingMatches: Match[] = [],
): Match[] => {
  if (availablePlayers.length < 4) return [];

  const playableCount = Math.floor(availablePlayers.length / 4) * 4;
  const pool = availablePlayers.slice(0, playableCount);
  const modeLabel = mode === MatchMode.SIMILAR ? AUTO_MODE_LABELS.SIMILAR : AUTO_MODE_LABELS.BALANCED;

  const sortedByMmr = [...pool].sort((a, b) => b.mmr - a.mmr);
  const groups: Player[][] = [];

  if (mode === MatchMode.SIMILAR) {
    // Strongest play strongest, weakest play weakest: chunk adjacent players.
    for (let i = 0; i < sortedByMmr.length; i += 4) {
      groups.push(sortedByMmr.slice(i, i + 4));
    }
  } else {
    // Fold method: pair the strongest with the weakest so each match's total
    // strength stays close across matches even though each match itself is lopsided.
    const groupCount = sortedByMmr.length / 4;
    for (let i = 0; i < groupCount; i++) {
      groups.push([
        sortedByMmr[i * 2],
        sortedByMmr[i * 2 + 1],
        sortedByMmr[sortedByMmr.length - 1 - i * 2],
        sortedByMmr[sortedByMmr.length - 1 - (i * 2 + 1)],
      ]);
    }
  }

  return rebalanceSessionGroups(groups, mode, countPairGroupings(pendingMatches)).map((group) =>
    createOptimizedMatch(group as [Player, Player, Player, Player], modeLabel, mode, sessionId, false),
  );
};

/**
 * Priority order used to decide who gets planned into the next Auto session
 * first - and, when the pool doesn't divide by 4, who sits this one out.
 *
 * The final tiebreak is deliberately rating-neutral and re-shuffled per
 * session (`seed`): ranking ties by MMR meant the lowest-rated players were
 * the ones benched every single time nothing else separated them.
 */
const byAutoRefillPriority =
  (queueCounts: Map<string, number>, seed: number) => (a: Player, b: Player) => {
    const qA = queueCounts.get(a.id) || 0;
    const qB = queueCounts.get(b.id) || 0;
    if (qA !== qB) return qA - qB;
    if (a.lastMatchEndTime !== b.lastMatchEndTime) return a.lastMatchEndTime - b.lastMatchEndTime;
    if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed;
    return rotationKey(a.id, seed) - rotationKey(b.id, seed);
  };

export interface AutoRefillInput {
  players: Player[];
  /** Currently queued matches that are NOT manual groupings. */
  systemQueue: Match[];
  /**
   * Queued manual groupings. Only used to tell who already has a match in a
   * given session - a match pulled back off a court ("重排") becomes a manual
   * one but keeps its session, and must not be back-filled a second time.
   */
  manualQueue?: Match[];
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
  manualQueue = [],
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

  const queueCounts = new Map<string, number>();
  const countIntoQueue = (matches: Match[]) =>
    matches.forEach((m) => {
      [...m.team1.players, ...m.team2.players].forEach((p) => {
        queueCounts.set(p.id, (queueCounts.get(p.id) || 0) + 1);
      });
    });
  countIntoQueue(systemQueue);

  // A session can lose matches after it was planned - someone goes 休息 and
  // every match they were in is dropped - which used to strand their three
  // team-mates for the rest of that session, because the refill below only
  // counts how many session *ids* are queued. Fill those gaps back in first,
  // for anyone who has no match in that session at all (not queued, not on a
  // court, not already played).
  const backfilled: Match[] = [];
  queuedSessionIds.forEach((sessionId) => {
    const inSession = (matches: Match[]) => matches.filter((m) => m.sessionId === sessionId);
    const queuedHere = inSession(systemQueue);
    const spokenFor = getMatchPlayerIds([
      ...queuedHere,
      ...inSession(manualQueue),
      ...inSession(activeMatches),
      ...inSession(history),
      ...backfilled,
    ]);

    const idle = activePlayers
      .filter((p) => !spokenFor.has(p.id))
      .sort(byAutoRefillPriority(queueCounts, sessionId));
    if (idle.length < 4) return;

    const batch = generateSessionMatches(idle, queuedHere[0].mode as ResolvedMode, sessionId, [
      ...activeMatches,
      ...systemQueue,
      ...backfilled,
    ]);
    backfilled.push(...batch);
    countIntoQueue(batch);
  });

  if (queuedSessionIds.length >= AUTO_SESSION_BUFFER) {
    return { newMatches: backfilled, nextSessionCounter: sessionCounter };
  }

  let nextSessionId = sessionCounter;
  if (queuedSessionIds.length > 0) {
    const maxInQueue = queuedSessionIds[queuedSessionIds.length - 1];
    if (maxInQueue >= nextSessionId) nextSessionId = maxInQueue + 1;
  }

  const sessionsNeeded = AUTO_SESSION_BUFFER - queuedSessionIds.length;

  const sortedActivePlayers = [...activePlayers];

  // Everything already "on the books" is used to keep Similar/Balanced counts
  // even (decision D1): history + live courts + the existing queue, plus
  // whatever this same refill call has generated so far.
  const recentMatches = [...history, ...activeMatches, ...systemQueue, ...backfilled];
  const newMatches: Match[] = [];

  for (let i = 0; i < sessionsNeeded; i++) {
    const sessionId = nextSessionId + i;
    const targetMode = resolveMatchMode(mode, [...recentMatches, ...newMatches]);

    sortedActivePlayers.sort(byAutoRefillPriority(queueCounts, sessionId));

    // Everything already booked - on court, queued, or planned a moment ago in
    // this same refill - so this session doesn't re-group people who are
    // about to play together anyway.
    const batch = generateSessionMatches(sortedActivePlayers, targetMode, sessionId, [
      ...activeMatches,
      ...systemQueue,
      ...backfilled,
      ...newMatches,
    ]);
    if (batch.length === 0) continue;

    newMatches.push(...batch);
    countIntoQueue(batch);
  }

  return {
    newMatches: [...backfilled, ...newMatches],
    nextSessionCounter: nextSessionId + sessionsNeeded,
  };
};
