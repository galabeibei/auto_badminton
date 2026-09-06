import { describe, expect, it } from 'vitest';
import { getRecommendedMatchId } from './recommendedMatch';
import { makeTestMatch, makeTestPlayer } from './testHelpers';
import { MatchStatus } from './types';

describe('getRecommendedMatchId', () => {
  const players = Array.from({ length: 12 }, (_, i) => makeTestPlayer({ id: `p${i}` }));

  it('returns null when every court is already occupied', () => {
    const activeMatch = makeTestMatch({
      id: 'a1',
      players: [players[0], players[1], players[2], players[3]],
      status: MatchStatus.PLAYING,
    });
    const queued = makeTestMatch({ id: 'q1', players: [players[4], players[5], players[6], players[7]] });

    expect(getRecommendedMatchId([queued], [activeMatch], 1)).toBeNull();
  });

  it('prefers a playable manual match over a playable system match', () => {
    const manual = makeTestMatch({
      id: 'manual',
      players: [players[0], players[1], players[2], players[3]],
      isManual: true,
    });
    const system = makeTestMatch({ id: 'system', players: [players[4], players[5], players[6], players[7]] });

    expect(getRecommendedMatchId([system, manual], [], 2)).toBe('manual');
  });

  it('skips a match whose players are still on a court and recommends the next playable one', () => {
    const activeMatch = makeTestMatch({
      id: 'a1',
      players: [players[0], players[1], players[2], players[3]],
      status: MatchStatus.PLAYING,
    });
    const blockedSystem = makeTestMatch({ id: 'blocked', players: [players[0], players[4], players[5], players[6]] });
    const freeSystem = makeTestMatch({ id: 'free', players: [players[7], players[8], players[9], players[10]] });

    expect(getRecommendedMatchId([blockedSystem, freeSystem], [activeMatch], 2)).toBe('free');
  });

  it('returns null when nothing in the queue is currently playable', () => {
    const activeMatch = makeTestMatch({
      id: 'a1',
      players: [players[0], players[1], players[2], players[3]],
      status: MatchStatus.PLAYING,
    });
    const blocked = makeTestMatch({ id: 'blocked', players: [players[0], players[4], players[5], players[6]] });

    expect(getRecommendedMatchId([blocked], [activeMatch], 2)).toBeNull();
  });
});
