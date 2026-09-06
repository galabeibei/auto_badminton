import { describe, expect, it } from 'vitest';
import { pruneAssistSystemQueue, pruneInactiveOrRemovedPlayers } from './queueValidation';
import { makeTestMatch, makeTestPlayer } from './testHelpers';
import { MatchStatus } from './types';

describe('pruneAssistSystemQueue', () => {
  const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));

  it('never removes manual matches', () => {
    const manual = makeTestMatch({
      id: 'manual',
      players: [players[0], players[1], players[2], players[3]],
      isManual: true,
    });
    const resting = players.map((p) => (p.id === 'p0' ? { ...p, isActive: false } : p));

    const result = pruneAssistSystemQueue([manual], [], resting);
    expect(result).toEqual([manual]);
  });

  it('drops a system suggestion whose player became inactive', () => {
    const system = makeTestMatch({ id: 'system', players: [players[0], players[1], players[2], players[3]] });
    const resting = players.map((p) => (p.id === 'p0' ? { ...p, isActive: false } : p));

    expect(pruneAssistSystemQueue([system], [], resting)).toEqual([]);
  });

  it('drops a system suggestion whose player is now on an active court', () => {
    const system = makeTestMatch({ id: 'system', players: [players[0], players[1], players[2], players[3]] });
    const activeMatch = makeTestMatch({
      id: 'active',
      players: [players[0], players[4], players[5], players[6]],
      status: MatchStatus.PLAYING,
    });

    expect(pruneAssistSystemQueue([system], [activeMatch], players)).toEqual([]);
  });

  it('drops a system suggestion whose player is now claimed by the manual queue', () => {
    const manual = makeTestMatch({
      id: 'manual',
      players: [players[0], players[4], players[5], players[6]],
      isManual: true,
    });
    const system = makeTestMatch({ id: 'system', players: [players[0], players[1], players[2], players[3]] });

    const result = pruneAssistSystemQueue([manual, system], [], players);
    expect(result).toEqual([manual]);
  });

  it('keeps a system suggestion that is still fully valid', () => {
    const system = makeTestMatch({ id: 'system', players: [players[0], players[1], players[2], players[3]] });
    expect(pruneAssistSystemQueue([system], [], players)).toEqual([system]);
  });
});

describe('pruneInactiveOrRemovedPlayers', () => {
  const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));

  it('drops any match (manual or system) containing a resting player', () => {
    const manual = makeTestMatch({
      id: 'manual',
      players: [players[0], players[1], players[2], players[3]],
      isManual: true,
    });
    const system = makeTestMatch({ id: 'system', players: [players[4], players[5], players[6], players[7]] });
    const resting = players.map((p) => (p.id === 'p0' ? { ...p, isActive: false } : p));

    expect(pruneInactiveOrRemovedPlayers([manual, system], resting)).toEqual([system]);
  });

  it('does NOT drop a match just because its players are on an active court', () => {
    // This is the key difference from pruneAssistSystemQueue: Auto plans
    // ahead assuming active players will eventually free up.
    const system = makeTestMatch({ id: 'system', players: [players[0], players[1], players[2], players[3]] });
    expect(pruneInactiveOrRemovedPlayers([system], players)).toEqual([system]);
  });

  it('drops a match containing a player who no longer exists in the roster', () => {
    const system = makeTestMatch({ id: 'system', players: [players[0], players[1], players[2], players[3]] });
    const rosterWithoutP0 = players.filter((p) => p.id !== 'p0');

    expect(pruneInactiveOrRemovedPlayers([system], rosterWithoutP0)).toEqual([]);
  });
});
