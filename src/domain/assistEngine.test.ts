import { describe, expect, it } from 'vitest';
import { suggestNextMatch } from './assistEngine';
import { getAvailablePlayersSorted } from './playerPool';
import { generateTestPlayers } from './playerImport';
import { makeTestPlayer } from './testHelpers';
import { MatchMode } from './types';

describe('suggestNextMatch', () => {
  it('suggests a full 4-player match when enough players are available', () => {
    const pool = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `P${i}`, mmr: 1000 }));

    const match = suggestNextMatch(pool, MatchMode.SIMILAR, [], [], 0);

    expect(match).not.toBeNull();
    const ids = [...match!.team1.players, ...match!.team2.players].map((p) => p.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it('returns null when fewer than 4 players are available', () => {
    const pool = [makeTestPlayer({ id: 'P1' }), makeTestPlayer({ id: 'P2' })];
    expect(suggestNextMatch(pool, MatchMode.SIMILAR, [], [], 0)).toBeNull();
  });

  it('always includes the player who has waited longest (the anchor)', () => {
    const players = generateTestPlayers(6, []);
    players[0].lastMatchEndTime = 0;
    players.slice(1).forEach((p) => (p.lastMatchEndTime = 5000));

    const sorted = getAvailablePlayersSorted(players, [], []);
    const suggestion = suggestNextMatch(sorted, MatchMode.SIMILAR, [], [], 0);

    expect(suggestion).not.toBeNull();
    const ids = [...suggestion!.team1.players, ...suggestion!.team2.players].map((p) => p.id);
    expect(ids).toContain(players[0].id);
  });

  it('keeps the anchor but excludes blacklisted candidates when refreshing', () => {
    // generateTestPlayers defaults everyone to lastMatchEndTime 0 and random mmr, so without
    // clearly separating player[0] from the rest, the mmr-based tiebreak could make any of
    // them "the anchor" and make this test flaky. Give the others a distinctly later time.
    const players = generateTestPlayers(5, []);
    players[0].lastMatchEndTime = 0;
    players.slice(1).forEach((p) => (p.lastMatchEndTime = 5000));
    const sorted = getAvailablePlayersSorted(players, [], []);

    const first = suggestNextMatch(sorted, MatchMode.SIMILAR, [], [], 0);
    expect(first).not.toBeNull();
    const otherIds = [...first!.team1.players, ...first!.team2.players]
      .map((p) => p.id)
      .filter((id) => id !== players[0].id);

    // Only 5 players exist: anchor + 4 candidates. Blacklisting all 3 "other"
    // players from the first suggestion leaves only 1 candidate - not enough
    // to form a match, so refreshing should fail rather than reuse them.
    const refreshed = suggestNextMatch(sorted, MatchMode.SIMILAR, [], [], 0, otherIds);
    expect(refreshed).toBeNull();
  });

  it('produces an alternative group when enough spare candidates exist', () => {
    const players = generateTestPlayers(9, []); // anchor + 8 candidates
    players[0].lastMatchEndTime = 0;
    players.slice(1).forEach((p) => (p.lastMatchEndTime = 5000));
    const sorted = getAvailablePlayersSorted(players, [], []);

    const first = suggestNextMatch(sorted, MatchMode.SIMILAR, [], [], 0);
    const otherIds = [...first!.team1.players, ...first!.team2.players]
      .map((p) => p.id)
      .filter((id) => id !== players[0].id);

    const refreshed = suggestNextMatch(sorted, MatchMode.SIMILAR, [], [], 0, otherIds);

    expect(refreshed).not.toBeNull();
    const refreshedIds = [...refreshed!.team1.players, ...refreshed!.team2.players].map((p) => p.id);
    expect(refreshedIds).toContain(players[0].id);
    otherIds.forEach((id) => expect(refreshedIds).not.toContain(id));
  });

  it('excludes players already sitting in the manual/system queue', () => {
    const players = generateTestPlayers(8, []);
    const sorted = getAvailablePlayersSorted(players, [], []);
    // Simulate players[0..3] already queued by simply not passing them in.
    const available = sorted.filter((p) => !players.slice(0, 4).some((q) => q.id === p.id));

    const match = suggestNextMatch(available, MatchMode.SIMILAR, [], [], 0);
    const ids = [...match!.team1.players, ...match!.team2.players].map((p) => p.id);
    players.slice(0, 4).forEach((p) => expect(ids).not.toContain(p.id));
  });
});
