import { describe, expect, it } from 'vitest';
import { applyWaitTimeOnStart, revertWaitTimeOnRequeue } from './waitTime';
import { makeTestMatch, makeTestPlayer } from './testHelpers';

describe('applyWaitTimeOnStart', () => {
  it('measures wait time from lastMatchEndTime to now for players who have played before', () => {
    const p1 = makeTestPlayer({ id: 'P1', lastMatchEndTime: 1000 });
    const p2 = makeTestPlayer({ id: 'P2' });
    const p3 = makeTestPlayer({ id: 'P3' });
    const p4 = makeTestPlayer({ id: 'P4' });
    const match = makeTestMatch({ id: 'm1', players: [p1, p2, p3, p4] });

    const updated = applyWaitTimeOnStart([p1, p2, p3, p4], match, 5000, 500);
    const u1 = updated.find((p) => p.id === 'P1')!;

    expect(u1.totalWaitTime).toBe(4000); // 5000 - 1000
    expect(u1.maxWaitTime).toBe(4000);
  });

  it('falls back to sessionStartTime for a player who has never played (lastMatchEndTime = 0)', () => {
    const p1 = makeTestPlayer({ id: 'P1', lastMatchEndTime: 0 });
    const p2 = makeTestPlayer({ id: 'P2' });
    const p3 = makeTestPlayer({ id: 'P3' });
    const p4 = makeTestPlayer({ id: 'P4' });
    const match = makeTestMatch({ id: 'm1', players: [p1, p2, p3, p4] });

    const updated = applyWaitTimeOnStart([p1, p2, p3, p4], match, 5000, 2000);
    const u1 = updated.find((p) => p.id === 'P1')!;

    expect(u1.totalWaitTime).toBe(3000); // 5000 - 2000 (sessionStartTime)
  });

  it('accumulates totalWaitTime across multiple matches but keeps maxWaitTime as the single longest', () => {
    const p1 = makeTestPlayer({ id: 'P1', lastMatchEndTime: 0, totalWaitTime: 100, maxWaitTime: 100 });
    const p2 = makeTestPlayer({ id: 'P2' });
    const p3 = makeTestPlayer({ id: 'P3' });
    const p4 = makeTestPlayer({ id: 'P4' });
    const match = makeTestMatch({ id: 'm1', players: [p1, p2, p3, p4] });

    const updated = applyWaitTimeOnStart([p1, p2, p3, p4], match, 1000, 0);
    const u1 = updated.find((p) => p.id === 'P1')!;

    expect(u1.totalWaitTime).toBe(1100); // 100 + 1000
    expect(u1.maxWaitTime).toBe(1000); // new wait (1000) exceeds old max (100)
  });

  it('leaves players not in the match untouched', () => {
    const p1 = makeTestPlayer({ id: 'P1' });
    const p2 = makeTestPlayer({ id: 'P2' });
    const p3 = makeTestPlayer({ id: 'P3' });
    const p4 = makeTestPlayer({ id: 'P4' });
    const bystander = makeTestPlayer({ id: 'bystander', totalWaitTime: 42 });
    const match = makeTestMatch({ id: 'm1', players: [p1, p2, p3, p4] });

    const updated = applyWaitTimeOnStart([p1, p2, p3, p4, bystander], match, 9999, 0);

    expect(updated.find((p) => p.id === 'bystander')).toEqual(bystander);
  });
});

describe('revertWaitTimeOnRequeue', () => {
  const four = (first: ReturnType<typeof makeTestPlayer>) => [
    first,
    makeTestPlayer({ id: 'P2' }),
    makeTestPlayer({ id: 'P3' }),
    makeTestPlayer({ id: 'P4' }),
  ];

  it('hands back exactly what sending the match on had recorded', () => {
    const players = four(makeTestPlayer({ id: 'P1', lastMatchEndTime: 1000 }));
    const match = makeTestMatch({ id: 'm1', players });

    const started = applyWaitTimeOnStart(players, match, 5000, 500);
    const requeued = revertWaitTimeOnRequeue(started, { ...match, startTime: 5000 }, 500);

    expect(requeued.find((p) => p.id === 'P1')!.totalWaitTime).toBe(0);
  });

  it('leaves one waiting interval, not two, when the match is sent on again later', () => {
    const players = four(makeTestPlayer({ id: 'P1', lastMatchEndTime: 1000 }));
    const match = makeTestMatch({ id: 'm1', players });

    // Waited 1000 -> 4000, requeued at 4000, finally sent on at 6000.
    const started = applyWaitTimeOnStart(players, match, 4000, 0);
    const requeued = revertWaitTimeOnRequeue(started, { ...match, startTime: 4000 }, 0);
    const restarted = applyWaitTimeOnStart(requeued, match, 6000, 0);

    const p1 = restarted.find((p) => p.id === 'P1')!;
    expect(p1.totalWaitTime).toBe(5000); // 6000 - 1000, not 3000 + 5000
    expect(p1.maxWaitTime).toBe(5000);
  });

  it('falls back to sessionStartTime for a player who has never played', () => {
    const players = four(makeTestPlayer({ id: 'P1', lastMatchEndTime: 0 }));
    const match = makeTestMatch({ id: 'm1', players });

    const started = applyWaitTimeOnStart(players, match, 5000, 2000);
    const requeued = revertWaitTimeOnRequeue(started, { ...match, startTime: 5000 }, 2000);

    expect(requeued.find((p) => p.id === 'P1')!.totalWaitTime).toBe(0);
  });

  it('does nothing for a match that never reached a court', () => {
    const players = four(makeTestPlayer({ id: 'P1', totalWaitTime: 777 }));
    const match = makeTestMatch({ id: 'm1', players });

    expect(revertWaitTimeOnRequeue(players, match, 0)).toBe(players);
  });

  it('leaves players outside the match untouched', () => {
    const players = four(makeTestPlayer({ id: 'P1', lastMatchEndTime: 1000 }));
    const bystander = makeTestPlayer({ id: 'bystander', totalWaitTime: 42 });
    const match = makeTestMatch({ id: 'm1', players });

    const result = revertWaitTimeOnRequeue([...players, bystander], { ...match, startTime: 5000 }, 0);

    expect(result.find((p) => p.id === 'bystander')).toEqual(bystander);
  });
});
