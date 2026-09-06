import { describe, expect, it } from 'vitest';
import { appReducer } from './appReducer';
import { initialAppState, Stage } from './appState';
import { MatchMode, SystemStrategy } from '../domain';
import { makeTestMatch, makeTestPlayer } from '../domain/testHelpers';
import type { AppState } from './appState';

describe('appReducer', () => {
  it('STAGE_CHANGED moves between wizard screens', () => {
    const next = appReducer(initialAppState, { type: 'STAGE_CHANGED', stage: Stage.COURTS });
    expect(next.stage).toBe(Stage.COURTS);
  });

  it('COURT_COUNT_CHANGED / MODE_CHANGED / STRATEGY_CHANGED update their own field only', () => {
    let state = appReducer(initialAppState, { type: 'COURT_COUNT_CHANGED', count: 4 });
    state = appReducer(state, { type: 'MODE_CHANGED', mode: MatchMode.BALANCED });
    state = appReducer(state, { type: 'STRATEGY_CHANGED', strategy: SystemStrategy.AUTO });

    expect(state.courtCount).toBe(4);
    expect(state.mode).toBe(MatchMode.BALANCED);
    expect(state.strategy).toBe(SystemStrategy.AUTO);
  });

  it('GAME_STARTED locks the game, stamps sessionStartTime, and jumps to the Run stage', () => {
    const next = appReducer(initialAppState, { type: 'GAME_STARTED', now: 42 });
    expect(next.hasGameStarted).toBe(true);
    expect(next.sessionStartTime).toBe(42);
    expect(next.stage).toBe(Stage.RUN);
  });

  it('GAME_STARTED can be dispatched again after returning from "adjust roster" and resets the clock', () => {
    const started = appReducer(initialAppState, { type: 'GAME_STARTED', now: 1 });
    const backToList = appReducer(started, { type: 'STAGE_CHANGED', stage: Stage.PLAYER_LIST });
    const startedAgain = appReducer(backToList, { type: 'GAME_STARTED', now: 2 });

    expect(startedAgain.sessionStartTime).toBe(2);
    expect(startedAgain.stage).toBe(Stage.RUN);
  });

  it('GAME_FINISHED moves to Stats without touching any match data', () => {
    const withHistory: AppState = { ...initialAppState, history: [makeTestMatch({ id: 'm1', players: [makeTestPlayer({id:'a'}),makeTestPlayer({id:'b'}),makeTestPlayer({id:'c'}),makeTestPlayer({id:'d'})] })] };
    const next = appReducer(withHistory, { type: 'GAME_FINISHED' });
    expect(next.stage).toBe(Stage.STATS);
    expect(next.history).toBe(withHistory.history);
  });

  it('GAME_RESET wipes everything back to a fresh initial state', () => {
    const dirty: AppState = { ...initialAppState, courtCount: 9, players: [makeTestPlayer({ id: 'a' })], stage: Stage.STATS };
    expect(appReducer(dirty, { type: 'GAME_RESET' })).toEqual(initialAppState);
  });

  it('STATE_RESTORED replaces state wholesale (persistence hydration)', () => {
    const restored: AppState = { ...initialAppState, courtCount: 6 };
    expect(appReducer(initialAppState, { type: 'STATE_RESTORED', state: restored })).toEqual(restored);
  });

  describe('roster editing', () => {
    it('PLAYERS_ADDED appends to the existing roster', () => {
      const p1 = makeTestPlayer({ id: 'p1' });
      const state = { ...initialAppState, players: [p1] };
      const p2 = makeTestPlayer({ id: 'p2' });
      const next = appReducer(state, { type: 'PLAYERS_ADDED', players: [p2] });
      expect(next.players.map((p) => p.id)).toEqual(['p1', 'p2']);
    });

    it('PLAYER_REMOVED drops exactly the targeted player', () => {
      const state = { ...initialAppState, players: [makeTestPlayer({ id: 'p1' }), makeTestPlayer({ id: 'p2' })] };
      const next = appReducer(state, { type: 'PLAYER_REMOVED', playerId: 'p1' });
      expect(next.players.map((p) => p.id)).toEqual(['p2']);
    });

    it('PLAYER_ACTIVE_TOGGLED flips isActive only for the targeted player', () => {
      const state = { ...initialAppState, players: [makeTestPlayer({ id: 'p1', isActive: true }), makeTestPlayer({ id: 'p2', isActive: true })] };
      const next = appReducer(state, { type: 'PLAYER_ACTIVE_TOGGLED', playerId: 'p1' });
      expect(next.players.find((p) => p.id === 'p1')?.isActive).toBe(false);
      expect(next.players.find((p) => p.id === 'p2')?.isActive).toBe(true);
    });
  });

  describe('match lifecycle', () => {
    const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const queuedMatch = makeTestMatch({ id: 'm1', players });

    it('MATCH_STARTED moves a match from queue to active and updates players', () => {
      const state = { ...initialAppState, queue: [queuedMatch], players };
      const updatedPlayers = players.map((p) => ({ ...p, totalWaitTime: 123 }));
      const startedMatch = { ...queuedMatch, startTime: 1000, courtId: 1 };

      const next = appReducer(state, { type: 'MATCH_STARTED', match: startedMatch, updatedPlayers });

      expect(next.queue).toEqual([]);
      expect(next.activeMatches).toEqual([startedMatch]);
      expect(next.players).toBe(updatedPlayers);
    });

    it('MATCH_FINISHED moves a match from active to history and updates players', () => {
      const activeMatch = { ...queuedMatch, startTime: 1000, courtId: 1 };
      const state = { ...initialAppState, activeMatches: [activeMatch], players };
      const finishedMatch = { ...activeMatch, endTime: 2000 };
      const updatedPlayers = players.map((p) => ({ ...p, matchesPlayed: 1 }));

      const next = appReducer(state, { type: 'MATCH_FINISHED', finishedMatch, updatedPlayers });

      expect(next.activeMatches).toEqual([]);
      expect(next.history).toEqual([finishedMatch]);
      expect(next.players).toBe(updatedPlayers);
    });

    it('MATCH_RETURNED_TO_QUEUE moves a match from active back to the front of the queue', () => {
      const activeMatch = { ...queuedMatch, startTime: 1000, courtId: 1 };
      const state = { ...initialAppState, activeMatches: [activeMatch], queue: [] };
      const returned = { ...queuedMatch, isManual: true, courtId: undefined, startTime: undefined };

      const next = appReducer(state, { type: 'MATCH_RETURNED_TO_QUEUE', match: returned });

      expect(next.activeMatches).toEqual([]);
      expect(next.queue).toEqual([returned]);
    });
  });

  describe('queue engines', () => {
    it('SESSION_MATCHES_QUEUED appends matches and advances the session counter', () => {
      const state = { ...initialAppState, queue: [], sessionCounter: 3 };
      const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
      const newMatch = makeTestMatch({ id: 'm1', players, sessionId: 3 });

      const next = appReducer(state, { type: 'SESSION_MATCHES_QUEUED', matches: [newMatch], nextSessionCounter: 4 });

      expect(next.queue).toEqual([newMatch]);
      expect(next.sessionCounter).toBe(4);
    });

    it('QUEUE_UPDATED replaces the queue wholesale', () => {
      const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
      const replacement = [makeTestMatch({ id: 'new', players })];
      const next = appReducer({ ...initialAppState, queue: [makeTestMatch({ id: 'old', players })] }, { type: 'QUEUE_UPDATED', queue: replacement });
      expect(next.queue).toBe(replacement);
    });
  });

  describe('planned order', () => {
    const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players: players.slice(0, 4) });
    const m2 = makeTestMatch({ id: 'm2', players: players.slice(4, 8) });

    it('PLANNED_ORDER_ADDED appends a match id', () => {
      const state = { ...initialAppState, queue: [m1, m2] };
      const next = appReducer(state, { type: 'PLANNED_ORDER_ADDED', matchId: 'm1' });
      expect(next.plannedOrder).toEqual(['m1']);
    });

    it('PLANNED_ORDER_REMOVED drops exactly that match id', () => {
      const state = { ...initialAppState, queue: [m1, m2], plannedOrder: ['m1', 'm2'] };
      const next = appReducer(state, { type: 'PLANNED_ORDER_REMOVED', matchId: 'm1' });
      expect(next.plannedOrder).toEqual(['m2']);
    });

    it('PLANNED_ORDER_MOVED reorders the plan', () => {
      const state = { ...initialAppState, queue: [m1, m2], plannedOrder: ['m1', 'm2'] };
      const next = appReducer(state, { type: 'PLANNED_ORDER_MOVED', matchId: 'm2', direction: 'up' });
      expect(next.plannedOrder).toEqual(['m2', 'm1']);
    });

    it('MATCH_STARTED drops the started match out of the plan', () => {
      const state = { ...initialAppState, queue: [m1, m2], plannedOrder: ['m1', 'm2'], players };
      const startedMatch = { ...m1, startTime: 1000, courtId: 1 };
      const next = appReducer(state, { type: 'MATCH_STARTED', match: startedMatch, updatedPlayers: players });
      expect(next.plannedOrder).toEqual(['m2']);
    });

    it('QUEUE_UPDATED prunes any planned id no longer present in the new queue', () => {
      const state = { ...initialAppState, queue: [m1, m2], plannedOrder: ['m1', 'm2'] };
      // m2 gets deleted (e.g. manual delete), m1 stays.
      const next = appReducer(state, { type: 'QUEUE_UPDATED', queue: [m1] });
      expect(next.plannedOrder).toEqual(['m1']);
    });
  });
});
