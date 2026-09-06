import {
  addToPlannedOrder,
  moveInPlannedOrder,
  prunePlannedOrder,
  removeFromPlannedOrder,
} from '../domain';
import { initialAppState, Stage } from './appState';
import type { AppState } from './appState';
import type { AppAction } from './actions';

/**
 * The entire app's state machine as one pure function. Every field that must
 * change together (queue/activeMatches/history/players/sessionCounter) is
 * updated atomically by a single action, so there's no window where two
 * `useState` calls could get out of sync.
 *
 * Heavy lifting (MMR math, matchmaking search, wait-time accumulation) is
 * done by `src/domain` *before* an action is dispatched - this reducer only
 * ever rearranges already-computed data between lists.
 */
export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'STAGE_CHANGED':
      return { ...state, stage: action.stage };

    case 'COURT_COUNT_CHANGED':
      return { ...state, courtCount: action.count };

    case 'MODE_CHANGED':
      return { ...state, mode: action.mode };

    case 'STRATEGY_CHANGED':
      return { ...state, strategy: action.strategy };

    case 'GAME_STARTED':
      return {
        ...state,
        hasGameStarted: true,
        sessionStartTime: action.now,
        stage: Stage.RUN,
      };

    case 'GAME_FINISHED':
      return { ...state, stage: Stage.STATS };

    case 'GAME_RESET':
      return { ...initialAppState };

    case 'STATE_RESTORED':
      return action.state;

    case 'PLAYERS_ADDED':
      return { ...state, players: [...state.players, ...action.players] };

    case 'PLAYER_REMOVED':
      return { ...state, players: state.players.filter((p) => p.id !== action.playerId) };

    case 'PLAYER_ACTIVE_TOGGLED':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, isActive: !p.isActive } : p,
        ),
      };

    case 'QUEUE_UPDATED':
      return { ...state, queue: action.queue, plannedOrder: prunePlannedOrder(state.plannedOrder, action.queue) };

    case 'SESSION_MATCHES_QUEUED':
      return {
        ...state,
        queue: [...state.queue, ...action.matches],
        sessionCounter: action.nextSessionCounter,
      };

    case 'MATCH_STARTED':
      return {
        ...state,
        queue: state.queue.filter((m) => m.id !== action.match.id),
        plannedOrder: removeFromPlannedOrder(state.plannedOrder, action.match.id),
        activeMatches: [...state.activeMatches, action.match],
        players: action.updatedPlayers,
      };

    case 'MATCH_FINISHED':
      return {
        ...state,
        activeMatches: state.activeMatches.filter((m) => m.id !== action.finishedMatch.id),
        history: [...state.history, action.finishedMatch],
        players: action.updatedPlayers,
      };

    case 'MATCH_RETURNED_TO_QUEUE':
      return {
        ...state,
        activeMatches: state.activeMatches.filter((m) => m.id !== action.match.id),
        queue: [action.match, ...state.queue],
      };

    case 'PLANNED_ORDER_ADDED':
      return { ...state, plannedOrder: addToPlannedOrder(state.plannedOrder, action.matchId) };

    case 'PLANNED_ORDER_REMOVED':
      return { ...state, plannedOrder: removeFromPlannedOrder(state.plannedOrder, action.matchId) };

    case 'PLANNED_ORDER_MOVED':
      return { ...state, plannedOrder: moveInPlannedOrder(state.plannedOrder, action.matchId, action.direction) };

    default:
      return state;
  }
};
