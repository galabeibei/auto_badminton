import { describe, expect, it } from 'vitest';
import { countPairGroupings, pairKey, rebalanceSessionGroups } from './sessionGrouping';
import { makeTestMatch, makeTestPlayer } from './testHelpers';
import { MatchMode } from './types';
import type { Player } from './types';

/** A ladder of `count` players, 50 points apart, named by their rating. */
const ladder = (count: number, top = 1800): Player[] =>
  Array.from({ length: count }, (_, i) => {
    const mmr = top - i * 50;
    return makeTestPlayer({ id: `p${mmr}`, name: `p${mmr}`, mmr });
  });

const chunk = (players: Player[]): Player[][] => {
  const groups: Player[][] = [];
  for (let i = 0; i < players.length; i += 4) groups.push(players.slice(i, i + 4));
  return groups;
};

const idsOf = (group: Player[]) => group.map((p) => p.id).sort();

/** Records that everyone in `group` has partnered everyone else `times` times. */
const withSharedHistory = (group: Player[], times: number): Player[] =>
  group.map((p) => ({
    ...p,
    partners: Object.fromEntries(group.filter((o) => o.id !== p.id).map((o) => [o.id, times])),
  }));

describe('countPairGroupings', () => {
  it('counts every pair that shares a match', () => {
    const players = ladder(4);
    const counts = countPairGroupings([makeTestMatch({ id: 'm1', players })]);

    expect(counts.size).toBe(6); // C(4,2)
    expect(counts.get(pairKey(players[0].id, players[3].id))).toBe(1);
  });

  it('adds up across matches', () => {
    const players = ladder(4);
    const match = makeTestMatch({ id: 'm1', players });
    const counts = countPairGroupings([match, { ...match, id: 'm2' }]);

    expect(counts.get(pairKey(players[0].id, players[1].id))).toBe(2);
  });
});

describe('rebalanceSessionGroups', () => {
  it('leaves rating-ordered groups alone when nobody has played yet', () => {
    const groups = chunk(ladder(8));

    const result = rebalanceSessionGroups(groups, MatchMode.SIMILAR);

    expect(result.map(idsOf)).toEqual(groups.map(idsOf));
  });

  it('breaks up a quartet that has already played together', () => {
    const players = ladder(8);
    const groups = chunk(players);
    // The top four have partnered each other twice already; the bottom four haven't.
    const withHistory = [withSharedHistory(groups[0], 2), groups[1]];

    const result = rebalanceSessionGroups(withHistory, MatchMode.SIMILAR);

    expect(result.map(idsOf)).not.toEqual(withHistory.map(idsOf));
    // Everyone still plays exactly once - a swap moves players, it never drops them.
    expect(result.flat().map((p) => p.id).sort()).toEqual(players.map((p) => p.id).sort());
  });

  it('will not wreck Similar mode to chase variety', () => {
    // Two bands 1000 points apart: mixing them would make a mockery of 相近,
    // however often these four have played together.
    const strong = [2000, 1980, 1960, 1940].map((mmr) => makeTestPlayer({ id: `s${mmr}`, mmr }));
    const weak = [1000, 980, 960, 940].map((mmr) => makeTestPlayer({ id: `w${mmr}`, mmr }));

    const result = rebalanceSessionGroups(
      [withSharedHistory(strong, 3), withSharedHistory(weak, 3)],
      MatchMode.SIMILAR,
    );

    expect(result.map(idsOf)).toEqual([idsOf(strong), idsOf(weak)]);
  });

  it('keeps every Balanced-mode group at the same total strength', () => {
    const players = ladder(8);
    // Fold-style groups: both total 5*1800 - 50*(0+1+6+7) = equal.
    const folded = [
      [players[0], players[1], players[7], players[6]],
      [players[2], players[3], players[5], players[4]],
    ];
    const totals = (groups: Player[][]) => groups.map((g) => g.reduce((sum, p) => sum + p.mmr, 0));

    const result = rebalanceSessionGroups(folded.map((g) => withSharedHistory(g, 2)), MatchMode.BALANCED);

    expect(totals(result)).toEqual(totals(folded));
  });

  it('separates players already queued together when the swap costs the session nothing', () => {
    // Two groups of identical shape, so swapping the two 1700s between them
    // leaves both untouched ratings-wise - the only thing left to decide is
    // who is already booked to play with whom.
    const mirrored = (side: string) =>
      [1800, 1700, 1700, 1600].map((mmr, i) => makeTestPlayer({ id: side + i + "-" + mmr, mmr }));
    const left = mirrored('L');
    const right = mirrored('R');

    const pending = countPairGroupings([
      makeTestMatch({ id: 'queued', players: [left[0], left[1], right[2], right[3]] }),
    ]);

    const result = rebalanceSessionGroups([left, right], MatchMode.SIMILAR, pending);

    const stillTogether = result.some(
      (group) => group.some((p) => p.id === left[0].id) && group.some((p) => p.id === left[1].id),
    );
    expect(stillTogether).toBe(false);
    expect(result.flat().map((p) => p.mmr).sort()).toEqual([...left, ...right].map((p) => p.mmr).sort());
  });

  it('returns a single group untouched (nothing to swap with)', () => {
    const groups = chunk(ladder(4));
    expect(rebalanceSessionGroups(groups, MatchMode.SIMILAR)).toBe(groups);
  });
});
