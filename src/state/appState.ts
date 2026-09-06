import { MatchMode, SystemStrategy } from '../domain';
import type { Match, Player } from '../domain';

/**
 * The wizard's screens, in flow order. Numeric so existing `stage` comparisons
 * and persisted state stay simple, but named so call sites read clearly.
 */
export const Stage = {
  HOME: 0,
  COURTS: 1,
  MODE: 2,
  STRATEGY: 3,
  PLAYER_LIST: 4,
  RUN: 5,
  STATS: 6,
} as const;

export type Stage = (typeof Stage)[keyof typeof Stage];

export interface AppState {
  stage: Stage;
  courtCount: number;
  mode: MatchMode;
  strategy: SystemStrategy;
  /** Once true, court count/mode/strategy are locked for the rest of this game. */
  hasGameStarted: boolean;
  /** Timestamp the Run screen was (re-)entered; the wait-time fallback for players who've never played. */
  sessionStartTime: number;
  players: Player[];
  /** Matches waiting to be sent to a court (manual + system suggestions, distinguished by `isManual`). */
  queue: Match[];
  /**
   * Match ids the user has explicitly pre-arranged as "send these on next, in
   * this order" - lets them plan several courts ahead while everything is
   * still busy, instead of re-deciding from scratch each time a court frees.
   * May contain ids no longer in `queue`; always read through
   * `domain/plannedOrder.ts`'s helpers, which tolerate that.
   */
  plannedOrder: string[];
  activeMatches: Match[];
  history: Match[];
  sessionCounter: number;
}

export const initialAppState: AppState = {
  stage: Stage.HOME,
  courtCount: 2,
  mode: MatchMode.MIXED,
  strategy: SystemStrategy.ASSIST,
  hasGameStarted: false,
  sessionStartTime: 0,
  players: [],
  queue: [],
  plannedOrder: [],
  activeMatches: [],
  history: [],
  sessionCounter: 0,
};
