import { MatchMode } from './types';
import type { Match } from './types';

export type ResolvedMode = MatchMode.SIMILAR | MatchMode.BALANCED;

/**
 * Resolves the MIXED mode into a concrete SIMILAR/BALANCED choice by counting
 * how many of `recentMatches` were played under each concrete mode, and
 * picking whichever has been played less so far (ties favour SIMILAR).
 *
 * A concrete mode (SIMILAR/BALANCED) is returned unchanged.
 *
 * Both the Assist engine (one suggestion at a time) and the Auto engine
 * (one session at a time) call this with the same rule, just with different
 * `recentMatches` inputs — see docs/ARCHITECTURE.md decision D1 for why the
 * original app used two different, inconsistent rules here.
 */
export const resolveMatchMode = (mode: MatchMode, recentMatches: Match[]): ResolvedMode => {
  if (mode !== MatchMode.MIXED) return mode;

  let similarCount = 0;
  let balancedCount = 0;
  recentMatches.forEach((m) => {
    if (m.mode === MatchMode.SIMILAR) similarCount++;
    else if (m.mode === MatchMode.BALANCED) balancedCount++;
  });

  return similarCount <= balancedCount ? MatchMode.SIMILAR : MatchMode.BALANCED;
};
