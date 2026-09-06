import type { MatchMode, SystemStrategy } from '../domain';
import type { Match, Player } from '../domain';
import type { AppState, Stage } from './appState';

export type AppAction =
  // Navigation between the setup wizard's screens. No side effects beyond
  // changing which screen is shown.
  | { type: 'STAGE_CHANGED'; stage: Stage }
  | { type: 'COURT_COUNT_CHANGED'; count: number }
  | { type: 'MODE_CHANGED'; mode: MatchMode }
  | { type: 'STRATEGY_CHANGED'; strategy: SystemStrategy }
  // Fired every time the Player List screen's "next" button moves into the
  // Run screen - both the very first time, and any time the user comes back
  // from "adjust roster" mid-game. Locks settings and resets the wait-time
  // fallback clock, matching the original app remounting the Run screen.
  | { type: 'GAME_STARTED'; now: number }
  | { type: 'GAME_FINISHED' }
  | { type: 'GAME_RESET' }
  // Persistence (decision D2): replaces the whole state wholesale, e.g. when
  // the user chooses to restore a previous session from localStorage.
  | { type: 'STATE_RESTORED'; state: AppState }
  // Player List screen roster editing.
  | { type: 'PLAYERS_ADDED'; players: Player[] }
  | { type: 'PLAYER_REMOVED'; playerId: string }
  | { type: 'PLAYER_ACTIVE_TOGGLED'; playerId: string }
  // Run screen: queue reshuffles whose new shape was already computed by a
  // domain function (pruning stale suggestions, swapping players, the
  // veto/refresh action, manual add/remove, auto-adjust).
  | { type: 'QUEUE_UPDATED'; queue: Match[] }
  // Run screen: a matchmaking engine (Assist or Auto) added freshly
  // generated matches and advanced the session counter.
  | { type: 'SESSION_MATCHES_QUEUED'; matches: Match[]; nextSessionCounter: number }
  // Run screen: match lifecycle. `updatedPlayers` is always the full roster
  // already recomputed by a domain function (waitTime/matchResult).
  | { type: 'MATCH_STARTED'; match: Match; updatedPlayers: Player[] }
  | { type: 'MATCH_FINISHED'; finishedMatch: Match; updatedPlayers: Player[] }
  | { type: 'MATCH_RETURNED_TO_QUEUE'; match: Match }
  // Run screen: the pre-arranged "send these on next, in this order" plan.
  | { type: 'PLANNED_ORDER_ADDED'; matchId: string }
  | { type: 'PLANNED_ORDER_REMOVED'; matchId: string }
  | { type: 'PLANNED_ORDER_MOVED'; matchId: string; direction: 'up' | 'down' };
