import type { Match, Player } from './types';

/** Flattens both teams of a match into a single player array. */
export const getMatchPlayers = (match: Match): Player[] => [
  ...match.team1.players,
  ...match.team2.players,
];

/** Union of every player id appearing in any of `matches`. */
export const getMatchPlayerIds = (matches: Match[]): Set<string> => {
  const ids = new Set<string>();
  matches.forEach((m) => getMatchPlayers(m).forEach((p) => ids.add(p.id)));
  return ids;
};
