import { describe, expect, it } from 'vitest';
import { createManualMatch, createOptimizedMatch, getInteractionCost } from './pairing';
import { makeTestPlayer } from './testHelpers';
import { MatchMode } from './types';

describe('getInteractionCost', () => {
  it('is zero for strangers', () => {
    const players = [makeTestPlayer({ id: 'a' }), makeTestPlayer({ id: 'b' })];
    expect(getInteractionCost(players)).toBe(0);
  });

  it('penalises repeat partners 5x harder than repeat opponents', () => {
    const a = makeTestPlayer({ id: 'a', partners: { b: 1 } });
    const b = makeTestPlayer({ id: 'b', partners: { a: 1 } });
    const c = makeTestPlayer({ id: 'c', opponents: { d: 1 } });
    const d = makeTestPlayer({ id: 'd', opponents: { c: 1 } });

    expect(getInteractionCost([a, b])).toBe(500);
    expect(getInteractionCost([c, d])).toBe(100);
  });
});

describe('createOptimizedMatch', () => {
  it('splits 4 equally-rated strangers into two teams of two', () => {
    const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}`, mmr: 1000 }));

    const match = createOptimizedMatch(
      [players[0], players[1], players[2], players[3]],
      'A. 相近',
      MatchMode.SIMILAR,
      0,
    );

    expect(match.team1.players).toHaveLength(2);
    expect(match.team2.players).toHaveLength(2);
    const allIds = [...match.team1.players, ...match.team2.players].map((p) => p.id);
    expect(new Set(allIds).size).toBe(4);
  });

  it('picks the split with the closest average MMR', () => {
    // Sorted by mmr: strong(2000), midHigh(1300), midLow(1100), weak(1000)
    // Best split by balance alone would be {strong, weak} vs {midHigh, midLow}: 1500 vs 1200 (diff 300)
    // vs {strong, midLow} vs {midHigh, weak}: 1550 vs 1150 (diff 400)
    // vs {strong, midHigh} vs {midLow, weak}: 1650 vs 1050 (diff 600)
    const strong = makeTestPlayer({ id: 'strong', mmr: 2000 });
    const midHigh = makeTestPlayer({ id: 'midHigh', mmr: 1300 });
    const midLow = makeTestPlayer({ id: 'midLow', mmr: 1100 });
    const weak = makeTestPlayer({ id: 'weak', mmr: 1000 });

    const match = createOptimizedMatch([strong, midHigh, midLow, weak], 'A. 相近', MatchMode.SIMILAR, 0);

    const team1Ids = match.team1.players.map((p) => p.id).sort();
    const team2Ids = match.team2.players.map((p) => p.id).sort();
    const sides = [team1Ids, team2Ids].sort();

    expect(sides).toEqual([['midHigh', 'midLow'].sort(), ['strong', 'weak'].sort()].sort());
  });

  it('avoids re-pairing recent partners when an equally balanced alternative exists', () => {
    const a = makeTestPlayer({ id: 'a', mmr: 1000, partners: { b: 3 } });
    const b = makeTestPlayer({ id: 'b', mmr: 1000, partners: { a: 3 } });
    const c = makeTestPlayer({ id: 'c', mmr: 1000 });
    const d = makeTestPlayer({ id: 'd', mmr: 1000 });

    const match = createOptimizedMatch([a, b, c, d], 'A. 相近', MatchMode.SIMILAR, 0);

    const team1Ids = match.team1.players.map((p) => p.id);
    const team2Ids = match.team2.players.map((p) => p.id);
    // a and b should end up on opposite teams since all-equal MMR means the
    // partner-history penalty is the deciding factor.
    expect(team1Ids.includes('a') && team1Ids.includes('b')).toBe(false);
    expect(team2Ids.includes('a') && team2Ids.includes('b')).toBe(false);
  });

  it('marks the match as manual only when explicitly requested', () => {
    const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const match = createOptimizedMatch(
      [players[0], players[1], players[2], players[3]],
      'A. 相近',
      MatchMode.SIMILAR,
      0,
      true,
    );
    expect(match.isManual).toBe(true);
  });
});

describe('createManualMatch', () => {
  it('respects the exact order the caller picked, without auto-balancing', () => {
    const strong = makeTestPlayer({ id: 'strong', mmr: 2000 });
    const alsoStrong = makeTestPlayer({ id: 'alsoStrong', mmr: 1900 });
    const weak = makeTestPlayer({ id: 'weak', mmr: 800 });
    const alsoWeak = makeTestPlayer({ id: 'alsoWeak', mmr: 700 });

    const match = createManualMatch([strong, alsoStrong, weak, alsoWeak], 3);

    expect(match.team1.players.map((p) => p.id)).toEqual(['strong', 'alsoStrong']);
    expect(match.team2.players.map((p) => p.id)).toEqual(['weak', 'alsoWeak']);
    expect(match.isManual).toBe(true);
    expect(match.sessionId).toBe(3);
  });
});
