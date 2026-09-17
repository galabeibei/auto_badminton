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

/**
 * Returns `match` with every embedded player swapped for their latest record
 * in `players` (matched by id). A queued match keeps its own copy of each
 * player at the moment it was created/suggested, so if that same player's
 * stats change elsewhere (e.g. one of their other matches finishes and
 * updates their MMR) the queued copy goes stale until refreshed like this.
 */
export const refreshMatchPlayers = (match: Match, players: Player[]): Match => {
  const refreshTeam = (teamPlayers: Player[]) =>
    teamPlayers.map((tp) => players.find((p) => p.id === tp.id) ?? tp);

  return {
    ...match,
    team1: { ...match.team1, players: refreshTeam(match.team1.players) },
    team2: { ...match.team2, players: refreshTeam(match.team2.players) },
  };
};
