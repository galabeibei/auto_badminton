import { describe, expect, it } from 'vitest';
import { applyWaitTimeOnStart } from './waitTime';
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
