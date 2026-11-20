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

/**
 * Session re-grouping (see `sessionGrouping.ts`). Measured per *rung of the
 * ladder* rather than per MMR point, so the trade-off behaves the same for a
 * tightly-bunched club roster as for a wide-open one: one rung is the average
 * rating gap between adjacently-ranked players in that session's pool.
 *
 * At 500 a repeat partnership (`WEIGHT_PARTNER_HISTORY`, 500) buys exactly one
 * extra rung of spread in Similar mode, and a repeat match-up (100) a fifth of
 * one - enough to keep mixing the pool up, not enough to put the strongest
 * player in with the weakest.
 */
export const WEIGHT_SESSION_SPREAD_SIMILAR = 500;
/** Cost per rung a Balanced-mode group's total strength deviates from the session average. */
export const WEIGHT_SESSION_IMBALANCE_BALANCED = 250;
/** Penalty for re-grouping a pair who already share a queued or in-progress match. */
export const WEIGHT_PENDING_PAIR = 300;
/**
 * Hard limit on how much wider a Similar-mode group may get than the plain
 * rating-ordered grouping it started from, in rungs. The cost above is a
 * trade-off; this is the line it may not cross, so no amount of accumulated
 * history can end up matching the strongest player against the weakest.
 */
export const MAX_EXTRA_SPREAD_RUNGS = 4;

/** How many of the highest-priority waiting players are considered as candidates. */
export const ASSIST_SEARCH_POOL_SIZE = 12;
/** Assist mode keeps exactly this many system suggestions queued at once. */
export const ASSIST_SUGGESTION_LIMIT = 1;
/** Auto mode keeps this many upcoming sessions queued at once. */
export const AUTO_SESSION_BUFFER = 2;

/** Lowest / highest rating a human may type into a rating field. */
export const MMR_MIN = 0;
export const MMR_MAX = 5000;

export const MODE_LABELS: Record<'SIMILAR' | 'BALANCED', string> = {
  SIMILAR: 'A. 相近',
  BALANCED: 'B. 平衡',
};

export const AUTO_MODE_LABELS: Record<'SIMILAR' | 'BALANCED', string> = {
  SIMILAR: 'A. 相近 (Auto)',
  BALANCED: 'B. 平衡 (Auto)',
};

export const MANUAL_MODE_LABEL = 'Manual';
