import { describe, expect, it } from 'vitest';
import {
  addToPlannedOrder,
  getNextPlayablePlannedMatchId,
  getPlannedMatches,
  moveInPlannedOrder,
  prunePlannedOrder,
  removeFromPlannedOrder,
} from './plannedOrder';
import { makeTestMatch, makeTestPlayer } from './testHelpers';
import { MatchStatus } from './types';

describe('addToPlannedOrder', () => {
  it('appends a new id to the end', () => {
    expect(addToPlannedOrder(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
  });

  it('is a no-op if the id is already planned', () => {
    expect(addToPlannedOrder(['a', 'b'], 'a')).toEqual(['a', 'b']);
  });
});

describe('removeFromPlannedOrder', () => {
  it('removes exactly the given id, keeping the rest in order', () => {
    expect(removeFromPlannedOrder(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('is a no-op if the id is not present', () => {
    expect(removeFromPlannedOrder(['a', 'b'], 'z')).toEqual(['a', 'b']);
  });
});

describe('prunePlannedOrder', () => {
  it('drops ids whose match is no longer in the queue', () => {
    const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players });
    expect(prunePlannedOrder(['m1', 'm2', 'm3'], [m1])).toEqual(['m1']);
  });
});

describe('moveInPlannedOrder', () => {
  it('moves an id up, swapping with its predecessor', () => {
    expect(moveInPlannedOrder(['a', 'b', 'c'], 'b', 'up')).toEqual(['b', 'a', 'c']);
  });

  it('moves an id down, swapping with its successor', () => {
    expect(moveInPlannedOrder(['a', 'b', 'c'], 'b', 'down')).toEqual(['a', 'c', 'b']);
  });

  it('is a no-op moving the first item up', () => {
    expect(moveInPlannedOrder(['a', 'b', 'c'], 'a', 'up')).toEqual(['a', 'b', 'c']);
  });

  it('is a no-op moving the last item down', () => {
    expect(moveInPlannedOrder(['a', 'b', 'c'], 'c', 'down')).toEqual(['a', 'b', 'c']);
  });

  it('is a no-op for an id that is not planned', () => {
    expect(moveInPlannedOrder(['a', 'b'], 'z', 'up')).toEqual(['a', 'b']);
  });
});

describe('getPlannedMatches', () => {
  it('resolves ids to Match objects in plan order, skipping stale ids', () => {
    const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players: players.slice(0, 4) });
    const m2 = makeTestMatch({ id: 'm2', players: players.slice(4, 8) });

    const result = getPlannedMatches(['m2', 'missing', 'm1'], [m1, m2]);

    expect(result.map((m) => m.id)).toEqual(['m2', 'm1']);
  });
});

describe('getNextPlayablePlannedMatchId', () => {
  const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));

  it('returns null when every court is already occupied', () => {
    const m1 = makeTestMatch({ id: 'm1', players: players.slice(0, 4) });
    const active = makeTestMatch({ id: 'a1', players: players.slice(4, 8), status: MatchStatus.PLAYING });
    expect(getNextPlayablePlannedMatchId(['m1'], [m1], [active], 1)).toBeNull();
  });

  it('returns the first planned match whose players are all free', () => {
    const blocked = makeTestMatch({ id: 'blocked', players: [players[0], players[4], players[5], players[6]] });
    const free = makeTestMatch({ id: 'free', players: players.slice(1, 5) });
    const active = makeTestMatch({ id: 'a1', players: [players[0], players[7], players[6], players[5]], status: MatchStatus.PLAYING });

    // players[0] is busy (in `active`), so `blocked` (which includes players[0]) must be skipped.
    const result = getNextPlayablePlannedMatchId(['blocked', 'free'], [blocked, free], [active], 2);
    expect(result).toBe('free');
  });

  it('returns null when nothing planned is currently playable', () => {
    const blocked = makeTestMatch({ id: 'blocked', players: [players[0], players[1], players[2], players[3]] });
    const active = makeTestMatch({ id: 'a1', players: [players[0], players[4], players[5], players[6]], status: MatchStatus.PLAYING });
    expect(getNextPlayablePlannedMatchId(['blocked'], [blocked], [active], 2)).toBeNull();
  });

  it('returns null when the plan is empty', () => {
    expect(getNextPlayablePlannedMatchId([], [], [], 2)).toBeNull();
  });
});
