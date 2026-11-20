import {
  MAX_EXTRA_SPREAD_RUNGS,
  WEIGHT_PENDING_PAIR,
  WEIGHT_SESSION_IMBALANCE_BALANCED,
  WEIGHT_SESSION_SPREAD_SIMILAR,
} from './constants';
import { getMatchPlayers } from './matchPlayers';
import { getInteractionCost } from './pairing';
import { MatchMode } from './types';
import type { ResolvedMode } from './modeResolver';
import type { Match, Player } from './types';

/**
 * Re-mixing a planned session so the same four people don't keep meeting.
 *
 * Auto mode builds its groups of four straight off the MMR ordering, which
 * makes each session structurally right (similar ratings together, or strong
 * folded onto weak) but completely blind to who has already played with whom:
 * with a stable roster the top four and the bottom four were grouped together
 * session after session, and only the team split inside each quartet rotated.
 *
 * This module keeps the structure and fixes the blindness: start from the
 * MMR-derived groups, then swap players between groups for as long as a swap
 * lowers the session's total cost, where cost is
 *
 *   structure (how far the group drifts from what the mode asks for)
 *   + repetition (how often these four have already met, on court or in the
 *     matches already queued ahead of this one).
 *
 * Because the structural term is weighted per MMR point, a swap that breaks
 * up a repeat pairing is accepted only while it keeps the group close to the
 * mode's intent - a repeat partnership is worth about 170 points of extra
 * rating spread in Similar mode, not a free pass to pair 1800 with 1000.
 */

/** Stable key for an unordered pair of player ids. */
export const pairKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** How many times each pair of players already shares one of `matches` (queued or on court). */
export const countPairGroupings = (matches: Match[]): Map<string, number> => {
  const counts = new Map<string, number>();

  matches.forEach((match) => {
    const ids = getMatchPlayers(match).map((p) => p.id);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = pairKey(ids[i], ids[j]);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  });

  return counts;
};

/** Penalty for pairs in `group` who are already booked to play together elsewhere. */
const pendingCost = (group: Player[], pendingPairs: Map<string, number>): number => {
  if (pendingPairs.size === 0) return 0;

  let cost = 0;
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      cost += (pendingPairs.get(pairKey(group[i].id, group[j].id)) ?? 0) * WEIGHT_PENDING_PAIR;
    }
  }
  return cost;
};

/** What the session as a whole is aiming for, so each group can be priced against it. */
export interface GroupingContext {
  mode: ResolvedMode;
  /** The average group total; Balanced mode measures deviation from this. */
  targetSum: number;
  /** Average rating gap between adjacently-ranked players in this pool - one "rung". */
  mmrPerRung: number;
  /** Pairs already booked to play together elsewhere (queued or on court). */
  pendingPairs: Map<string, number>;
}

export const buildGroupingContext = (
  groups: Player[][],
  mode: ResolvedMode,
  pendingPairs: Map<string, number> = new Map(),
): GroupingContext => {
  const mmrs = groups.flat().map((p) => p.mmr);
  const span = Math.max(...mmrs) - Math.min(...mmrs);

  return {
    mode,
    targetSum: mmrs.reduce((total, mmr) => total + mmr, 0) / groups.length,
    // A floor of 1 keeps the cost finite for a roster where everyone shares
    // the same rating (a brand-new club night), where spread is 0 anyway.
    mmrPerRung: Math.max(1, span / Math.max(1, mmrs.length - 1)),
    pendingPairs,
  };
};

const spreadOf = (group: Player[]): number => {
  const mmrs = group.map((p) => p.mmr);
  return Math.max(...mmrs) - Math.min(...mmrs);
};

/**
 * The widest a Similar-mode group may become: whatever the plain rating
 * ordering already produced, plus a few rungs of room to mix people up.
 * Infinity in Balanced mode, which is lopsided inside a group by design.
 */
export const spreadLimit = (groups: Player[][], context: GroupingContext): number =>
  context.mode === MatchMode.SIMILAR
    ? Math.max(...groups.map(spreadOf)) + MAX_EXTRA_SPREAD_RUNGS * context.mmrPerRung
    : Infinity;

/** How far this group of four drifts from what its mode is trying to achieve, in rungs. */
const structuralCost = (group: Player[], context: GroupingContext): number => {
  const mmrs = group.map((p) => p.mmr);

  if (context.mode === MatchMode.SIMILAR) {
    // Similar mode wants the four ratings close together.
    return (spreadOf(group) / context.mmrPerRung) * WEIGHT_SESSION_SPREAD_SIMILAR;
  }

  // Balanced mode wants every group to carry roughly the same total strength,
  // so no court ends up being where all the strong players went.
  const sum = mmrs.reduce((total, mmr) => total + mmr, 0);
  return (Math.abs(sum - context.targetSum) / context.mmrPerRung) * WEIGHT_SESSION_IMBALANCE_BALANCED;
};

/** Total cost of one group of four: how well it fits the mode, plus how repetitive it is. */
export const groupCost = (group: Player[], context: GroupingContext): number =>
  structuralCost(group, context) + getInteractionCost(group) + pendingCost(group, context.pendingPairs);

/** Safety stop; in practice the search runs out of improving swaps long before this. */
const MAX_SWAP_PASSES = 30;

/**
 * Repeatedly applies the single best player-for-player swap between two
 * groups until no swap lowers the total cost (plain steepest-descent hill
 * climbing, deterministic: ties keep the earlier candidate).
 *
 * With no history and no pending matches the MMR-derived groups are already
 * optimal, so this returns them untouched - the mode's own shape is never
 * traded away for nothing.
 */
export const rebalanceSessionGroups = (
  groups: Player[][],
  mode: ResolvedMode,
  pendingPairs: Map<string, number> = new Map(),
): Player[][] => {
  if (groups.length < 2) return groups;

  const context = buildGroupingContext(groups, mode, pendingPairs);
  const maxSpread = spreadLimit(groups, context);

  const next = groups.map((group) => [...group]);
  const cost = (group: Player[]) => groupCost(group, context);
  const costs = next.map(cost);

  for (let pass = 0; pass < MAX_SWAP_PASSES; pass++) {
    let best: { i: number; j: number; left: Player[]; right: Player[]; leftCost: number; rightCost: number } | null =
      null;
    let bestGain = 1e-9; // strictly better only

    for (let i = 0; i < next.length; i++) {
      for (let j = i + 1; j < next.length; j++) {
        for (let a = 0; a < next[i].length; a++) {
          for (let b = 0; b < next[j].length; b++) {
            const left = [...next[i]];
            const right = [...next[j]];
            left[a] = next[j][b];
            right[b] = next[i][a];

            if (spreadOf(left) > maxSpread || spreadOf(right) > maxSpread) continue;

            const leftCost = cost(left);
            const rightCost = cost(right);
            const gain = costs[i] + costs[j] - leftCost - rightCost;

            if (gain > bestGain) {
              bestGain = gain;
              best = { i, j, left, right, leftCost, rightCost };
            }
          }
        }
      }
    }

    if (!best) break;

    next[best.i] = best.left;
    next[best.j] = best.right;
    costs[best.i] = best.leftCost;
    costs[best.j] = best.rightCost;
  }

  return next;
};
