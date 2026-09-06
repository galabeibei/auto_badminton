import { describe, expect, it } from 'vitest';
import { resolveMatchMode } from './modeResolver';
import { makeTestMatch, makeTestPlayer } from './testHelpers';
import { MatchMode } from './types';

const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
const matchWithMode = (id: string, mode: MatchMode) =>
  makeTestMatch({ id, players: [players[0], players[1], players[2], players[3]], mode });

describe('resolveMatchMode', () => {
  it('passes concrete modes through unchanged', () => {
    expect(resolveMatchMode(MatchMode.SIMILAR, [])).toBe(MatchMode.SIMILAR);
    expect(resolveMatchMode(MatchMode.BALANCED, [])).toBe(MatchMode.BALANCED);
  });

  it('defaults MIXED to SIMILAR when there is no history', () => {
    expect(resolveMatchMode(MatchMode.MIXED, [])).toBe(MatchMode.SIMILAR);
  });

  it('picks whichever concrete mode has been played less so far', () => {
    const recent = [
      matchWithMode('m1', MatchMode.SIMILAR),
      matchWithMode('m2', MatchMode.SIMILAR),
      matchWithMode('m3', MatchMode.BALANCED),
    ];

    expect(resolveMatchMode(MatchMode.MIXED, recent)).toBe(MatchMode.BALANCED);
  });

  it('favours SIMILAR on a tie', () => {
    const recent = [matchWithMode('m1', MatchMode.SIMILAR), matchWithMode('m2', MatchMode.BALANCED)];
    expect(resolveMatchMode(MatchMode.MIXED, recent)).toBe(MatchMode.SIMILAR);
  });

  it('ignores manual matches mode (MIXED) when counting', () => {
    const recent = [
      matchWithMode('m1', MatchMode.MIXED),
      matchWithMode('m2', MatchMode.BALANCED),
    ];
    // Neither counts as SIMILAR, so SIMILAR (0) <= BALANCED (1) => SIMILAR wins.
    expect(resolveMatchMode(MatchMode.MIXED, recent)).toBe(MatchMode.SIMILAR);
  });
});
