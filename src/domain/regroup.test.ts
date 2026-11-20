import { describe, expect, it } from 'vitest';
import { dropSystemMatches } from './regroup';
import { makeTestMatch, makeTestPlayer } from './testHelpers';

const match = (id: string, isManual: boolean) =>
  makeTestMatch({
    id,
    isManual,
    players: [
      makeTestPlayer({ id: `${id}-a` }),
      makeTestPlayer({ id: `${id}-b` }),
      makeTestPlayer({ id: `${id}-c` }),
      makeTestPlayer({ id: `${id}-d` }),
    ],
  });

describe('dropSystemMatches', () => {
  it('removes system suggestions and keeps manual groupings', () => {
    const queue = [match('s1', false), match('m1', true), match('s2', false)];

    expect(dropSystemMatches(queue).map((m) => m.id)).toEqual(['m1']);
  });

  it('returns an empty queue when every match was system-suggested', () => {
    expect(dropSystemMatches([match('s1', false), match('s2', false)])).toEqual([]);
  });

  it('leaves a queue of only manual groupings untouched', () => {
    const queue = [match('m1', true), match('m2', true)];

    expect(dropSystemMatches(queue).map((m) => m.id)).toEqual(['m1', 'm2']);
  });
});
