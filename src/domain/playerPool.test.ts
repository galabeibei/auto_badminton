import { describe, expect, it } from 'vitest';
import { getAvailablePlayersSorted } from './playerPool';
import { makeTestMatch, makeTestPlayer } from './testHelpers';
import { MatchStatus } from './types';

describe('getAvailablePlayersSorted', () => {
  it('prioritises players by wait time, then matches played', () => {
    const p1 = makeTestPlayer({ id: 'P1', matchesPlayed: 1, lastMatchEndTime: 0 });
    const p2 = makeTestPlayer({ id: 'P2', matchesPlayed: 1, lastMatchEndTime: 1000 });

    const sorted = getAvailablePlayersSorted([p2, p1], [], []);

    expect(sorted.map((p) => p.id)).toEqual(['P1', 'P2']);
  });

  it('breaks a wait-time tie using fewer matches played', () => {
    const p1 = makeTestPlayer({ id: 'P1', lastMatchEndTime: 500, matchesPlayed: 3 });
    const p2 = makeTestPlayer({ id: 'P2', lastMatchEndTime: 500, matchesPlayed: 1 });

    const sorted = getAvailablePlayersSorted([p1, p2], [], []);

    expect(sorted.map((p) => p.id)).toEqual(['P2', 'P1']);
  });

  it('excludes players who are resting', () => {
    const active = makeTestPlayer({ id: 'active', isActive: true });
    const resting = makeTestPlayer({ id: 'resting', isActive: false });

    const sorted = getAvailablePlayersSorted([active, resting], [], []);

    expect(sorted.map((p) => p.id)).toEqual(['active']);
  });

  it('excludes players currently on a court', () => {
    const players = Array.from({ length: 5 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const activeMatch = makeTestMatch({
      id: 'm1',
      players: [players[0], players[1], players[2], players[3]],
      status: MatchStatus.PLAYING,
    });

    const sorted = getAvailablePlayersSorted(players, [activeMatch], []);

    expect(sorted.map((p) => p.id)).toEqual(['p4']);
  });

  it('excludes players already sitting in any queued match (manual or system)', () => {
    const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const queuedMatch = makeTestMatch({
      id: 'manual',
      players: [players[0], players[1], players[2], players[3]],
    });

    const sorted = getAvailablePlayersSorted(players, [], [queuedMatch]);

    const ids = sorted.map((p) => p.id);
    expect(ids).not.toContain('p0');
    expect(ids).toContain('p4');
    expect(ids).toHaveLength(4);
  });
});
