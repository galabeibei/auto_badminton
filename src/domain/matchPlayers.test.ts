import { describe, expect, it } from 'vitest';
import { getMatchPlayerIds, getMatchPlayers, refreshMatchPlayers } from './matchPlayers';
import { makeTestMatch, makeTestPlayer } from './testHelpers';

describe('getMatchPlayers / getMatchPlayerIds', () => {
  it('flattens both teams and collects their ids', () => {
    const players = [
      makeTestPlayer({ id: 'a' }),
      makeTestPlayer({ id: 'b' }),
      makeTestPlayer({ id: 'c' }),
      makeTestPlayer({ id: 'd' }),
    ];
    const match = makeTestMatch({ id: 'm1', players });

    expect(getMatchPlayers(match).map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(getMatchPlayerIds([match])).toEqual(new Set(['a', 'b', 'c', 'd']));
  });
});

describe('refreshMatchPlayers', () => {
  it('replaces each embedded player with their latest record by id', () => {
    const stalePlayers = [
      makeTestPlayer({ id: 'a', mmr: 1000 }),
      makeTestPlayer({ id: 'b', mmr: 1000 }),
      makeTestPlayer({ id: 'c', mmr: 1000 }),
      makeTestPlayer({ id: 'd', mmr: 1000 }),
    ];
    const match = makeTestMatch({ id: 'm1', players: stalePlayers });

    const freshPlayers = stalePlayers.map((p) => (p.id === 'a' ? { ...p, mmr: 1800 } : p));
    const refreshed = refreshMatchPlayers(match, freshPlayers);

    expect(refreshed.team1.players.find((p) => p.id === 'a')?.mmr).toBe(1800);
    // Everyone else is untouched.
    expect(refreshed.team1.players.find((p) => p.id === 'b')?.mmr).toBe(1000);
    expect(refreshed.team2.players.map((p) => p.mmr)).toEqual([1000, 1000]);
  });

  it('leaves a player as-is when their id is missing from the given list', () => {
    const players = [
      makeTestPlayer({ id: 'a' }),
      makeTestPlayer({ id: 'b' }),
      makeTestPlayer({ id: 'c' }),
      makeTestPlayer({ id: 'd' }),
    ];
    const match = makeTestMatch({ id: 'm1', players });

    // 'a' has since been removed from the roster entirely.
    const refreshed = refreshMatchPlayers(match, players.filter((p) => p.id !== 'a'));

    expect(refreshed.team1.players.find((p) => p.id === 'a')).toBe(players[0]);
  });
});
