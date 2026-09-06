import { getMatchPlayerIds, getMatchPlayers } from './matchPlayers';
import type { Match } from './types';

/**
 * Auto mode only: picks which queued match should be highlighted as
 * "recommended to start next". Manual matches always outrank system
 * suggestions; within each group the existing queue order (session id, then
 * insertion order) is respected. Returns null whenever courts are already
 * full, or nothing in the queue is currently playable (every match has at
 * least one player stuck on an active court).
 */
export const getRecommendedMatchId = (
  queue: Match[],
  activeMatches: Match[],
  courtCount: number,
): string | null => {
  if (activeMatches.length >= courtCount) return null;

  const activePlayerIds = getMatchPlayerIds(activeMatches);
  const isPlayable = (m: Match) => getMatchPlayers(m).every((p) => !activePlayerIds.has(p.id));

  const manualQueue = queue.filter((m) => m.isManual);
  const validManual = manualQueue.find(isPlayable);
  if (validManual) return validManual.id;

  const systemQueue = queue.filter((m) => !m.isManual);
  const validSystem = systemQueue.find(isPlayable);
  return validSystem ? validSystem.id : null;
};
