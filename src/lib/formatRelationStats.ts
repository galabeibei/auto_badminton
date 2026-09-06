import type { Player } from '../domain';

/**
 * Formats a partner/opponent history record (playerId -> count) as
 * "Alice(2), Bob(1)", sorted by count descending. Falls back to "?(count)"
 * for an id that no longer resolves to a known player (e.g. removed from the roster).
 */
export const formatRelationStats = (record: Record<string, number>, players: Player[]): string => {
  const entries = Object.entries(record);
  if (entries.length === 0) return '-';

  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => {
      const player = players.find((p) => p.id === id);
      return `${player?.name ?? '?'}(${count})`;
    })
    .join(', ');
};
