import { describe, expect, it } from 'vitest';
import { rotationKey } from './tiebreak';

describe('rotationKey', () => {
  it('is stable for the same player and seed', () => {
    expect(rotationKey('player-a', 3)).toBe(rotationKey('player-a', 3));
  });

  it('separates different players', () => {
    expect(rotationKey('player-a', 0)).not.toBe(rotationKey('player-b', 0));
  });

  it('re-shuffles the order when the seed changes, so nobody is last in line every session', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `player-${i}`);
    const orderFor = (seed: number) => [...ids].sort((a, b) => rotationKey(a, seed) - rotationKey(b, seed));

    const seeds = [0, 1, 2, 3, 4];
    const orders = seeds.map((seed) => orderFor(seed).join(','));

    expect(new Set(orders).size).toBe(seeds.length);
    // Nobody should be stuck at the back of the queue for every single session.
    const lastOf = (order: string[]) => order[order.length - 1];
    const alwaysLast = ids.filter((id) => seeds.every((seed) => lastOf(orderFor(seed)) === id));
    expect(alwaysLast).toEqual([]);
  });
});
