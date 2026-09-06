import { generateUUID } from './id';
import { Gender } from './types';
import type { Player } from './types';

export interface NewPlayerInput {
  name: string;
  gender?: Gender;
  mmr?: number;
}

/**
 * Builds a brand-new Player with every stat field zeroed out. The single
 * source of truth for "what a fresh player record looks like" — used by
 * manual add, CSV import, and test-player generation alike.
 */
export const createPlayer = ({ name, gender = Gender.MALE, mmr = 1200 }: NewPlayerInput): Player => ({
  id: generateUUID(),
  name,
  gender,
  mmr,
  initialMmr: mmr,
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
});
