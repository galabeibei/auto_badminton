import { K_FACTOR } from './constants';
import type { Player } from './types';

export interface NewMmrResult {
  team1New: number[];
  team2New: number[];
}

/**
 * Calculates each player's new MMR after a match, using a standard logistic
 * Elo curve on the two teams' average ratings. Every player on a team
 * receives the same delta (individual MMR within the team doesn't change the
 * amount they gain/lose).
 */
export const calculateNewMMR = (
  team1: Player[],
  team2: Player[],
  score1: number,
  score2: number,
): NewMmrResult => {
  const avgMMR1 = team1.reduce((sum, p) => sum + p.mmr, 0) / team1.length;
  const avgMMR2 = team2.reduce((sum, p) => sum + p.mmr, 0) / team2.length;

  const expectedScore1 = 1 / (1 + 10 ** ((avgMMR2 - avgMMR1) / 400));
  const actualScore1 = score1 > score2 ? 1 : score1 === score2 ? 0.5 : 0;

  const ratingChange1 = K_FACTOR * (actualScore1 - expectedScore1);
  const ratingChange2 = -ratingChange1;

  return {
    team1New: team1.map((p) => Math.round(p.mmr + ratingChange1)),
    team2New: team2.map((p) => Math.round(p.mmr + ratingChange2)),
  };
};
