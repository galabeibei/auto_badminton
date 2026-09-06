import { calculateNewMMR } from './elo';
import type { Match, MatchResultChange, Player } from './types';

export interface ApplyMatchResultOutput {
  updatedPlayers: Player[];
  changes: MatchResultChange[];
}

/**
 * Applies a scored match result to every player's stats: MMR, win/loss,
 * total points, partner/opponent history, playtime, and `lastMatchEndTime`.
 * Looks up the latest copy of each player from `allPlayers` rather than
 * trusting the (possibly stale) snapshot stored on the match.
 */
export const applyMatchResult = (
  allPlayers: Player[],
  match: Match,
  score1: number,
  score2: number,
  durationMinutes = 0,
  now: number = Date.now(),
): ApplyMatchResultOutput => {
  const realTeam1 = match.team1.players.map((mp) => allPlayers.find((p) => p.id === mp.id) ?? mp);
  const realTeam2 = match.team2.players.map((mp) => allPlayers.find((p) => p.id === mp.id) ?? mp);

  const { team1New, team2New } = calculateNewMMR(realTeam1, realTeam2, score1, score2);
  const changes: MatchResultChange[] = [];

  const applyTeamUpdate = (
    player: Player,
    ownTeam: Player[],
    opponentTeam: Player[],
    newMmr: number,
    ownScore: number,
    opponentScore: number,
  ): Player => {
    changes.push({ playerId: player.id, name: player.name, oldMMR: player.mmr, newMMR: newMmr });

    const newPartners = { ...player.partners };
    ownTeam.forEach((teammate) => {
      if (teammate.id !== player.id) {
        newPartners[teammate.id] = (newPartners[teammate.id] || 0) + 1;
      }
    });

    const newOpponents = { ...player.opponents };
    opponentTeam.forEach((opponent) => {
      newOpponents[opponent.id] = (newOpponents[opponent.id] || 0) + 1;
    });

    return {
      ...player,
      mmr: newMmr,
      matchesPlayed: player.matchesPlayed + 1,
      wins: player.wins + (ownScore > opponentScore ? 1 : 0),
      losses: player.losses + (ownScore < opponentScore ? 1 : 0),
      totalPoints: player.totalPoints + ownScore,
      partners: newPartners,
      opponents: newOpponents,
      totalMinutes: player.totalMinutes + durationMinutes,
      lastMatchEndTime: now,
    };
  };

  const updatedPlayers = allPlayers.map((p) => {
    const t1Idx = realTeam1.findIndex((rp) => rp.id === p.id);
    if (t1Idx !== -1) {
      return applyTeamUpdate(p, realTeam1, realTeam2, team1New[t1Idx], score1, score2);
    }
    const t2Idx = realTeam2.findIndex((rp) => rp.id === p.id);
    if (t2Idx !== -1) {
      return applyTeamUpdate(p, realTeam2, realTeam1, team2New[t2Idx], score2, score1);
    }
    return p;
  });

  return { updatedPlayers, changes };
};

/**
 * Applies a match that was played without recording a score: increments
 * matches-played, partner/opponent history and playtime, but leaves MMR,
 * wins and losses untouched.
 */
export const processNoScoreMatch = (
  allPlayers: Player[],
  match: Match,
  durationMinutes = 0,
  now: number = Date.now(),
): Player[] => {
  const team1Ids = match.team1.players.map((p) => p.id);
  const team2Ids = match.team2.players.map((p) => p.id);
  const allMatchPlayerIds = new Set([...team1Ids, ...team2Ids]);

  return allPlayers.map((p) => {
    if (!allMatchPlayerIds.has(p.id)) return p;

    const inTeam1 = team1Ids.includes(p.id);
    const [ownIds, opponentIds] = inTeam1 ? [team1Ids, team2Ids] : [team2Ids, team1Ids];

    const newPartners = { ...p.partners };
    ownIds.forEach((id) => {
      if (id !== p.id) newPartners[id] = (newPartners[id] || 0) + 1;
    });

    const newOpponents = { ...p.opponents };
    opponentIds.forEach((id) => {
      newOpponents[id] = (newOpponents[id] || 0) + 1;
    });

    return {
      ...p,
      matchesPlayed: p.matchesPlayed + 1,
      partners: newPartners,
      opponents: newOpponents,
      totalMinutes: p.totalMinutes + durationMinutes,
      lastMatchEndTime: now,
    };
  });
};
