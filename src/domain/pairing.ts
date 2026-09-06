import { MANUAL_MODE_LABEL, WEIGHT_OPPONENT_HISTORY, WEIGHT_PARTNER_HISTORY } from './constants';
import { generateUUID } from './id';
import { MatchMode, MatchStatus } from './types';
import type { Match, Player } from './types';

/**
 * Sum of "we've played together/against before" penalties across every pair
 * in a group of players. Being teammates before is penalised 5x harder than
 * being opponents before, reflecting that repeat partnerships feel more
 * repetitive to players than repeat match-ups.
 */
export const getInteractionCost = (players: Player[]): number => {
  let cost = 0;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const p1 = players[i];
      const p2 = players[j];
      const partnersCount = p1.partners[p2.id] || 0;
      const opponentsCount = p1.opponents[p2.id] || 0;
      cost += partnersCount * WEIGHT_PARTNER_HISTORY + opponentsCount * WEIGHT_OPPONENT_HISTORY;
    }
  }
  return cost;
};

interface Pairing {
  t1: [Player, Player];
  t2: [Player, Player];
}

const scorePairing = ({ t1, t2 }: Pairing): number => {
  const avg1 = (t1[0].mmr + t1[1].mmr) / 2;
  const avg2 = (t2[0].mmr + t2[1].mmr) / 2;
  const balancePenalty = Math.abs(avg1 - avg2);

  const p1History = t1[0].partners[t1[1].id] || 0;
  const p2History = t2[0].partners[t2[1].id] || 0;

  let oppHistory = 0;
  t1.forEach((a) => {
    t2.forEach((b) => {
      oppHistory += a.opponents[b.id] || 0;
    });
  });

  return balancePenalty * 2 + (p1History + p2History) * 500 + oppHistory * 50;
};

/**
 * Given exactly 4 players, tries all 3 ways to split them into two teams of 2
 * and picks whichever split has the closest average MMR (with a penalty for
 * repeat partnerships/match-ups), then wraps the result as a queued Match.
 */
export const createOptimizedMatch = (
  chunk: [Player, Player, Player, Player],
  modeLabel: string,
  mode: MatchMode,
  sessionId: number,
  isManual = false,
): Match => {
  const pairings: Pairing[] = [
    { t1: [chunk[0], chunk[1]], t2: [chunk[2], chunk[3]] },
    { t1: [chunk[0], chunk[2]], t2: [chunk[1], chunk[3]] },
    { t1: [chunk[0], chunk[3]], t2: [chunk[1], chunk[2]] },
  ];

  let best = pairings[0];
  let minScore = Infinity;
  pairings.forEach((pairing) => {
    const score = scorePairing(pairing);
    if (score < minScore) {
      minScore = score;
      best = pairing;
    }
  });

  return {
    id: generateUUID(),
    team1: { players: [...best.t1] },
    team2: { players: [...best.t2] },
    status: MatchStatus.QUEUED,
    modeLabel,
    mode,
    sessionId,
    isManual,
  };
};

/**
 * Builds a manual match: the first two selected players are always team 1 and
 * the last two are always team 2 (unlike `createOptimizedMatch`, a manual
 * grouping fully respects the order the user picked, with no auto-balancing).
 */
export const createManualMatch = (
  players: [Player, Player, Player, Player],
  sessionId: number,
): Match => ({
  id: generateUUID(),
  team1: { players: [players[0], players[1]] },
  team2: { players: [players[2], players[3]] },
  status: MatchStatus.QUEUED,
  modeLabel: MANUAL_MODE_LABEL,
  mode: MatchMode.MIXED,
  sessionId,
  isManual: true,
});
