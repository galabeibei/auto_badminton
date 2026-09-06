import { Gender, MatchMode, MatchStatus } from './types';
import type { Match, Player } from './types';

/** Test-only player builder with sensible defaults, overridable per field. */
export const makeTestPlayer = (overrides: Partial<Player> & { id: string }): Player => ({
  name: overrides.id,
  gender: Gender.MALE,
  mmr: 1000,
  initialMmr: 1000,
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  totalPoints: 0,
  totalMinutes: 0,
  totalWaitTime: 0,
  maxWaitTime: 0,
  lastMatchEndTime: 0,
  partners: {},
  opponents: {},
  isActive: true,
  ...overrides,
});

/** Test-only match builder for a 4-player match, defaults to QUEUED/SIMILAR. */
export const makeTestMatch = (
  overrides: Partial<Omit<Match, 'team1' | 'team2'>> & {
    id: string;
    /** Exactly 4 players: [team1p1, team1p2, team2p1, team2p2]. */
    players: Player[];
  },
): Match => {
  const { players, ...rest } = overrides;
  return {
    team1: { players: [players[0], players[1]] },
    team2: { players: [players[2], players[3]] },
    status: MatchStatus.QUEUED,
    modeLabel: 'A. 相近',
    mode: MatchMode.SIMILAR,
    sessionId: 0,
    ...rest,
  };
};
