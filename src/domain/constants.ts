/**
 * All tunable weights for the matchmaking algorithms, collected in one place.
 * (In the original codebase these were scattered magic numbers at the top of a
 * single 570-line file; keeping them here makes the trade-offs explicit and
 * lets tests reference them by name instead of re-deriving numbers.)
 */

/** Elo K-factor: how many points change hands on any single result. */
export const K_FACTOR = 32;

/** Cost penalty per prior time two candidates were teammates. */
export const WEIGHT_PARTNER_HISTORY = 500;
/** Cost penalty per prior time two candidates were opponents. */
export const WEIGHT_OPPONENT_HISTORY = 100;
/** Multiplier applied to a candidate group's MMR spread in Similar mode. */
export const WEIGHT_MMR_SPREAD_SIMILAR = 1;
/** Multiplier applied to a candidate group's MMR spread in Balanced mode. */
export const WEIGHT_MMR_SPREAD_BALANCED = 0.25;
/** Cost penalty per position a candidate sits behind the anchor in the wait queue. */
export const WEIGHT_WAIT_ORDER = 75;

/** How many of the highest-priority waiting players are considered as candidates. */
export const ASSIST_SEARCH_POOL_SIZE = 12;
/** Assist mode keeps exactly this many system suggestions queued at once. */
export const ASSIST_SUGGESTION_LIMIT = 1;
/** Auto mode keeps this many upcoming sessions queued at once. */
export const AUTO_SESSION_BUFFER = 2;

export const MODE_LABELS: Record<'SIMILAR' | 'BALANCED', string> = {
  SIMILAR: 'A. 相近',
  BALANCED: 'B. 平衡',
};

export const AUTO_MODE_LABELS: Record<'SIMILAR' | 'BALANCED', string> = {
  SIMILAR: 'A. 相近 (Auto)',
  BALANCED: 'B. 平衡 (Auto)',
};

export const MANUAL_MODE_LABEL = 'Manual';
