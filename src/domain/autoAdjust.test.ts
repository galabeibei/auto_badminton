import { describe, expect, it } from 'vitest';
import { planAutoAdjust } from './autoAdjust';
import { makeTestMatch, makeTestPlayer } from './testHelpers';
import { MatchStatus } from './types';

const assertNoDuplicatePlayers = (queue: ReturnType<typeof planAutoAdjust>['queue']) => {
  queue.forEach((m) => {
    const ids = [...m.team1.players, ...m.team2.players].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
};

describe('planAutoAdjust', () => {
  it('is a no-op when the queue is empty', () => {
    const result = planAutoAdjust([], [], []);
    expect(result.swapCount).toBe(0);
    expect(result.queue).toEqual([]);
  });

  it('is a no-op when the first system match has nobody currently on a court', () => {
    const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const queued = makeTestMatch({ id: 'q1', players: [players[0], players[1], players[2], players[3]] });

    const result = planAutoAdjust([queued], [], players);

    expect(result.swapCount).toBe(0);
    expect(result.queue).toEqual([queued]);
  });

  it('swaps a busy player out for a free substitute so the match can start', () => {
    const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const activeMatch = makeTestMatch({
      id: 'active',
      players: [players[0], players[1], players[6], players[7]],
      status: MatchStatus.PLAYING,
    });
    // p0 is stuck on a court but also queued here, blocking this match from starting.
    const target = makeTestMatch({
      id: 'target',
      players: [players[0], players[2], players[3], players[4]],
    });

    const result = planAutoAdjust([target], [activeMatch], players);

    expect(result.swapCount).toBe(1);
    const targetAfter = result.queue.find((m) => m.id === 'target')!;
    const idsAfter = [...targetAfter.team1.players, ...targetAfter.team2.players].map((p) => p.id);
    expect(idsAfter).not.toContain(players[0].id);
    expect(idsAfter).toContain(players[5].id); // the only remaining free, non-busy player
    assertNoDuplicatePlayers(result.queue);
  });

  it('only tries to unblock the first system match, even if an earlier manual match is also blocked', () => {
    const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const activeMatch = makeTestMatch({
      id: 'active',
      players: [players[0], players[1], players[2], players[3]],
      status: MatchStatus.PLAYING,
    });
    // Placed first in the array, and also blocked (contains busy p0) - but it's manual,
    // so it must never be treated as the match planAutoAdjust tries to fix.
    const manualBlocked = makeTestMatch({
      id: 'manual',
      players: [players[0], players[4], players[5], players[6]],
      isManual: true,
    });
    // The actual target: systemQueue[0], blocked by busy p1.
    const systemFirst = makeTestMatch({
      id: 'system',
      players: [players[1], players[4], players[5], players[6]],
    });

    const result = planAutoAdjust([manualBlocked, systemFirst], [activeMatch], players);

    const manualAfter = result.queue.find((m) => m.id === 'manual')!;
    const manualIdsAfter = [...manualAfter.team1.players, ...manualAfter.team2.players].map((p) => p.id);
    // manualBlocked's own busy player (p0) is left untouched - only systemFirst got fixed.
    expect(manualIdsAfter).toContain(players[0].id);

    const systemAfter = result.queue.find((m) => m.id === 'system')!;
    const systemIdsAfter = [...systemAfter.team1.players, ...systemAfter.team2.players].map((p) => p.id);
    expect(systemIdsAfter).not.toContain(players[1].id);
  });

  it('skips a candidate whose current match already contains the busy player, to avoid a duplicate', () => {
    const players = Array.from({ length: 11 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const [p0, p1, p2, p3, p4, p5, p6, pA, pFiller1, pFiller2, pB] = players;

    const activeMatch = makeTestMatch({ id: 'active', players: [p0, p1, p2, p3], status: MatchStatus.PLAYING });
    const target = makeTestMatch({ id: 'target', players: [p0, p4, p5, p6] });
    // Data-inconsistency edge case: p0 (busy) also appears in another queued match.
    // Every other candidate (pA, pFiller1, pFiller2) sits in that same match, so
    // pulling any of them out would leave p0 duplicated in it.
    const other = makeTestMatch({ id: 'other', players: [p0, pA, pFiller1, pFiller2] });

    const result = planAutoAdjust([target, other], [activeMatch], players);

    expect(result.swapCount).toBe(1);
    const targetAfter = result.queue.find((m) => m.id === 'target')!;
    const targetIdsAfter = [...targetAfter.team1.players, ...targetAfter.team2.players].map((p) => p.id);
    expect(targetIdsAfter).toContain(pB.id);
    expect(targetIdsAfter).not.toContain(p0.id);

    const otherAfter = result.queue.find((m) => m.id === 'other')!;
    expect(otherAfter).toEqual(other); // untouched: pB was never sourced from it

    assertNoDuplicatePlayers(result.queue);
  });
});
