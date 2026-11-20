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

  describe('hand-corrected ratings', () => {
    const started = (overrides: Partial<AppState> = {}): AppState => ({
      ...initialAppState,
      hasGameStarted: true,
      players: [makeTestPlayer({ id: 'p1', mmr: 1000, initialMmr: 1000 }), makeTestPlayer({ id: 'p2' })],
      ...overrides,
    });

    it('PLAYER_MMR_CHANGED writes the new rating for the targeted player only', () => {
      const next = appReducer(started(), { type: 'PLAYER_MMR_CHANGED', playerId: 'p1', mmr: 1350 });

      expect(next.players.find((p) => p.id === 'p1')?.mmr).toBe(1350);
      expect(next.players.find((p) => p.id === 'p2')?.mmr).toBe(1000);
    });

    it('PLAYER_MMR_CHANGED shifts initialMmr too, so the final stats still show only what was won on court', () => {
      // p1 earned +30 on court (1000 -> 1030) before being corrected up to 1350.
      const state = started({
        players: [makeTestPlayer({ id: 'p1', mmr: 1030, initialMmr: 1000 })],
      });

      const next = appReducer(state, { type: 'PLAYER_MMR_CHANGED', playerId: 'p1', mmr: 1350 });
      const p1 = next.players[0];

      expect(p1.mmr).toBe(1350);
      expect(p1.initialMmr).toBe(1320);
      expect(p1.mmr - p1.initialMmr).toBe(30);
    });

    it('PLAYER_MMR_CHANGED refreshes the stale player copies inside queued and live matches', () => {
      const p1 = makeTestPlayer({ id: 'p1', mmr: 1000 });
      const others = [makeTestPlayer({ id: 'p2' }), makeTestPlayer({ id: 'p3' }), makeTestPlayer({ id: 'p4' })];
      const state = started({
        players: [p1, ...others],
        queue: [makeTestMatch({ id: 'q1', players: [p1, ...others] })],
        activeMatches: [makeTestMatch({ id: 'a1', players: [p1, ...others], courtId: 1 })],
      });

      const next = appReducer(state, { type: 'PLAYER_MMR_CHANGED', playerId: 'p1', mmr: 1400 });

      expect(next.queue[0].team1.players[0].mmr).toBe(1400);
      expect(next.activeMatches[0].team1.players[0].mmr).toBe(1400);
    });

    it('PLAYER_MMR_CHANGED asks for a regroup once the game is running, but not during setup', () => {
      const midGame = appReducer(started(), { type: 'PLAYER_MMR_CHANGED', playerId: 'p1', mmr: 1350 });
      expect(midGame.hasPendingMmrEdits).toBe(true);

      const duringSetup = appReducer(started({ hasGameStarted: false }), {
        type: 'PLAYER_MMR_CHANGED',
        playerId: 'p1',
        mmr: 1350,
      });
      expect(duringSetup.hasPendingMmrEdits).toBe(false);
    });

    it('PLAYER_MMR_CHANGED is a no-op for an unchanged rating or an unknown player', () => {
      const state = started();

      expect(appReducer(state, { type: 'PLAYER_MMR_CHANGED', playerId: 'p1', mmr: 1000 })).toBe(state);
      expect(appReducer(state, { type: 'PLAYER_MMR_CHANGED', playerId: 'nobody', mmr: 1350 })).toBe(state);
    });

    it('REGROUP_APPLIED swaps in the regrouped queue, prunes the stale plan, and stops asking', () => {
      const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: 'p' + i }));
      const manual = makeTestMatch({ id: 'manual', players, isManual: true });
      const state = started({
        hasPendingMmrEdits: true,
        queue: [makeTestMatch({ id: 'system', players }), manual],
        plannedOrder: ['system', 'manual'],
      });

      const next = appReducer(state, { type: 'REGROUP_APPLIED', queue: [manual] });

      expect(next.queue.map((m) => m.id)).toEqual(['manual']);
      expect(next.plannedOrder).toEqual(['manual']);
      expect(next.hasPendingMmrEdits).toBe(false);
    });

    it('REGROUP_DISMISSED keeps the current queue and stops asking', () => {
      const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: 'p' + i }));
      const state = started({ hasPendingMmrEdits: true, queue: [makeTestMatch({ id: 'system', players })] });

      const next = appReducer(state, { type: 'REGROUP_DISMISSED' });

      expect(next.queue).toBe(state.queue);
      expect(next.hasPendingMmrEdits).toBe(false);
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

    it('MATCH_FINISHED refreshes a shared player’s stale data (e.g. MMR) in still-queued matches', () => {
      // P2 is playing on court (about to finish) and is also already sitting
      // in a different, still-queued suggested match - the exact scenario
      // reported: that queued match kept showing P2's pre-match MMR forever.
      const p2 = makeTestPlayer({ id: 'p2', name: 'P2', mmr: 1800 });
      const activeMatch = makeTestMatch({
        id: 'active',
        players: [p2, makeTestPlayer({ id: 'p3' }), makeTestPlayer({ id: 'p4' }), makeTestPlayer({ id: 'p5' })],
        startTime: 1000,
        courtId: 1,
      });
      const queuedMatchWithSamePlayer = makeTestMatch({
        id: 'queued',
        players: [p2, makeTestPlayer({ id: 'p6' }), makeTestPlayer({ id: 'p7' }), makeTestPlayer({ id: 'p8' })],
      });
      const state = {
        ...initialAppState,
        activeMatches: [activeMatch],
        queue: [queuedMatchWithSamePlayer],
        players: [p2],
      };

      const finishedMatch = { ...activeMatch, endTime: 2000 };
      const updatedPlayers = [{ ...p2, mmr: 1850 }];

      const next = appReducer(state, { type: 'MATCH_FINISHED', finishedMatch, updatedPlayers });

      const p2InQueue = next.queue[0].team1.players.find((p) => p.id === 'p2');
      expect(p2InQueue?.mmr).toBe(1850);
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
