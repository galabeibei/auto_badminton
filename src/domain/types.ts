/**
 * Core domain types. This module has zero dependencies on React and describes
 * the vocabulary every other domain module is built from.
 */

export enum Gender {
  MALE = '男',
  FEMALE = '女',
}

export interface Player {
  id: string;
  name: string;
  gender: Gender;
  /** Current skill rating. */
  mmr: number;
  /** Snapshot of `mmr` when the player joined this session, used to show net change at the end. */
  initialMmr: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  /** Sum of this player's own-team score across all matches (not win/loss). */
  totalPoints: number;
  /** Total minutes spent playing, accumulated across matches. */
  totalMinutes: number;
  /** Total time spent waiting between matches, in milliseconds. */
  totalWaitTime: number;
  /** The single longest wait interval recorded, in milliseconds. */
  maxWaitTime: number;
  /**
   * Timestamp (ms) this player's last match was marked finished (scored or
   * no-score). 0 means "never played". Doubles as the "wait start" reference
   * point for the next wait-time calculation once they're queued again.
   */
  lastMatchEndTime: number;
  /** playerId -> number of times this player has been teamed up with them. */
  partners: Record<string, number>;
  /** playerId -> number of times this player has faced them as an opponent. */
  opponents: Record<string, number>;
  /** false = resting; excluded from all matchmaking. */
  isActive: boolean;
}

export enum MatchMode {
  SIMILAR = 'A',
  BALANCED = 'B',
  MIXED = 'C',
}

export enum SystemStrategy {
  /** Suggests one match at a time, filling gaps as they appear. */
  ASSIST = 'ASSIST',
  /** Generates matches in session batches ahead of time. */
  AUTO = 'AUTO',
}

export enum MatchStatus {
  QUEUED = 'QUEUED',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

export interface Team {
  players: Player[];
  score?: number;
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  status: MatchStatus;
  courtId?: number;
  /** Human readable label for the mode actually used (Mixed is always resolved before this is set). */
  modeLabel: string;
  /** The concrete mode this match was generated under (never MIXED). */
  mode: MatchMode;
  /** Batch/round number this match belongs to. */
  sessionId: number;
  startTime?: number;
  endTime?: number;
  /** true = created by a human via manual grouping; false/undefined = system suggestion. */
  isManual?: boolean;
}

export type MatchOutcome = 'team1' | 'team2' | 'draw';

export interface MatchResultChange {
  playerId: string;
  name: string;
  oldMMR: number;
  newMMR: number;
}
