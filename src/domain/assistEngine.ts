import {
  ASSIST_SEARCH_POOL_SIZE,
  MODE_LABELS,
  WEIGHT_MMR_SPREAD_BALANCED,
  WEIGHT_MMR_SPREAD_SIMILAR,
  WEIGHT_WAIT_ORDER,
} from './constants';
import { getCombinations } from './combinations';
import { getInteractionCost, createOptimizedMatch } from './pairing';
import { resolveMatchMode } from './modeResolver';
import { MatchMode } from './types';
import type { Match, Player } from './types';

/**
 * Suggests a single new match using the "anchor" method (Assist mode):
 * the player who has waited longest is always included, and the remaining
 * 3 spots are filled by searching nearby candidates for the lowest-cost group.
 *
 * @param availablePlayers Waiting players, already sorted by `getAvailablePlayersSorted`.
 * @param blacklistIds Candidates to exclude (used by the "refresh/veto" action to
 *   generate an alternative suggestion while keeping the same anchor).
 */
export const suggestNextMatch = (
  availablePlayers: Player[],
  mode: MatchMode,
  history: Match[],
  activeMatches: Match[],
  sessionId: number,
  blacklistIds: string[] = [],
): Match | null => {
  if (availablePlayers.length < 4) return null;

  const anchor = availablePlayers[0];

  let candidates = availablePlayers.slice(1);
  if (blacklistIds.length > 0) {
    const blacklist = new Set(blacklistIds);
    candidates = candidates.filter((p) => !blacklist.has(p.id));
  }

  if (candidates.length < 3) return null;

  const searchPool = candidates.slice(0, ASSIST_SEARCH_POOL_SIZE);

  const targetMode = resolveMatchMode(mode, [...history, ...activeMatches]);
  const modeLabel = targetMode === MatchMode.SIMILAR ? MODE_LABELS.SIMILAR : MODE_LABELS.BALANCED;
  const mmrSpreadWeight =
    targetMode === MatchMode.SIMILAR ? WEIGHT_MMR_SPREAD_SIMILAR : WEIGHT_MMR_SPREAD_BALANCED;

  const combos = getCombinations(searchPool, 3);
  let bestGroup: Player[] = [];
  let minCost = Infinity;

  combos.forEach((combo) => {
    const group = [anchor, ...combo];
    let cost = getInteractionCost(group);

    const mmrs = group.map((p) => p.mmr);
    const mmrSpread = Math.max(...mmrs) - Math.min(...mmrs);
    cost += mmrSpread * mmrSpreadWeight;

    combo.forEach((p) => {
      const idx = availablePlayers.findIndex((x) => x.id === p.id);
      cost += idx * WEIGHT_WAIT_ORDER;
    });

    if (cost < minCost) {
      minCost = cost;
      bestGroup = group;
    }
  });

  if (bestGroup.length === 0) {
    bestGroup = [anchor, ...searchPool.slice(0, 3)];
  }

  return createOptimizedMatch(
    bestGroup as [Player, Player, Player, Player],
    modeLabel,
    targetMode,
    sessionId,
    false,
  );
};
