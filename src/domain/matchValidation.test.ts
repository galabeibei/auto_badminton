import { describe, expect, it } from 'vitest';
import { checkPlayerConflict, isValidSwap } from './matchValidation';
import { makeTestMatch, makeTestPlayer } from './testHelpers';
import { MatchStatus } from './types';

describe('checkPlayerConflict', () => {
  it('detects a player already playing in an active match', () => {
    const players = Array.from({ length: 5 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const activeMatch = makeTestMatch({
      id: 'm1',
      players: [players[0], players[1], players[2], players[3]],
      status: MatchStatus.PLAYING,
    });
    const candidate = makeTestMatch({
      id: 'm2',
      players: [players[0], players[4], players[2], players[3]],
    });

    expect(checkPlayerConflict(candidate, [activeMatch])).toContain('p0');
  });

  it('returns an empty array when nobody conflicts', () => {
    const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const activeMatch = makeTestMatch({
      id: 'm1',
      players: [players[0], players[1], players[2], players[3]],
      status: MatchStatus.PLAYING,
    });
    const candidate = makeTestMatch({
      id: 'm2',
      players: [players[4], players[5], players[6], players[7]],
    });

    expect(checkPlayerConflict(candidate, [activeMatch])).toHaveLength(0);
  });
});

describe('isValidSwap', () => {
  it('always allows swapping within the same match', () => {
    const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]] });

    expect(isValidSwap(m1, m1, 'p0', 'p1')).toBe(true);
  });

  it('rejects a swap that would duplicate a player in the target match', () => {
    const players = Array.from({ length: 5 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]] });
    // m2 already contains p0 - swapping p1 (from m1) with p0 (from m2) would leave p0 in m1 twice.
    const m2 = makeTestMatch({ id: 'm2', players: [players[0], players[4], players[2], players[3]] });

    expect(isValidSwap(m1, m2, 'p1', 'p0')).toBe(false);
  });

  it('allows a swap between two matches with no overlapping players', () => {
    const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]] });
    const m2 = makeTestMatch({ id: 'm2', players: [players[4], players[5], players[6], players[7]] });

    expect(isValidSwap(m1, m2, 'p0', 'p4')).toBe(true);
  });
});
