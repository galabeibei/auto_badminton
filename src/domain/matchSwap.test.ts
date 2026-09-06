import { describe, expect, it } from 'vitest';
import { replacePlayerInMatch, swapPlayersInQueue } from './matchSwap';
import { makeTestMatch, makeTestPlayer } from './testHelpers';

describe('swapPlayersInQueue', () => {
  it('swaps two players between different matches', () => {
    const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]] });
    const m2 = makeTestMatch({ id: 'm2', players: [players[4], players[5], players[6], players[7]] });

    const result = swapPlayersInQueue(
      [m1, m2],
      { matchId: 'm1', teamId: 'team1', index: 0 },
      { matchId: 'm2', teamId: 'team1', index: 0 },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const newM1 = result.queue.find((m) => m.id === 'm1')!;
    const newM2 = result.queue.find((m) => m.id === 'm2')!;
    expect(newM1.team1.players[0].id).toBe('p4');
    expect(newM2.team1.players[0].id).toBe('p0');
    // Everything else stays put.
    expect(newM1.team1.players[1].id).toBe('p1');
  });

  it('swaps two players within the same match', () => {
    const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]] });

    const result = swapPlayersInQueue(
      [m1],
      { matchId: 'm1', teamId: 'team1', index: 0 },
      { matchId: 'm1', teamId: 'team2', index: 1 },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const updated = result.queue[0];
    expect(updated.team1.players[0].id).toBe('p3');
    expect(updated.team2.players[1].id).toBe('p0');
  });

  it('rejects a swap that would duplicate a player in either match', () => {
    const players = Array.from({ length: 5 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]] });
    const m2 = makeTestMatch({ id: 'm2', players: [players[0], players[4], players[2], players[3]] });

    const result = swapPlayersInQueue(
      [m1, m2],
      { matchId: 'm1', teamId: 'team1', index: 1 }, // p1
      { matchId: 'm2', teamId: 'team1', index: 0 }, // p0, already in m1
    );

    expect(result).toEqual({ ok: false, reason: 'DUPLICATE' });
  });

  it('rejects a cross-session swap when allowCrossSession is false (Auto mode)', () => {
    const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]], sessionId: 0 });
    const m2 = makeTestMatch({ id: 'm2', players: [players[4], players[5], players[6], players[7]], sessionId: 1 });

    const result = swapPlayersInQueue(
      [m1, m2],
      { matchId: 'm1', teamId: 'team1', index: 0 },
      { matchId: 'm2', teamId: 'team1', index: 0 },
      { allowCrossSession: false },
    );

    expect(result).toEqual({ ok: false, reason: 'CROSS_SESSION' });
  });

  it('allows a same-session swap even when allowCrossSession is false', () => {
    const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]], sessionId: 0 });
    const m2 = makeTestMatch({ id: 'm2', players: [players[4], players[5], players[6], players[7]], sessionId: 0 });

    const result = swapPlayersInQueue(
      [m1, m2],
      { matchId: 'm1', teamId: 'team1', index: 0 },
      { matchId: 'm2', teamId: 'team1', index: 0 },
      { allowCrossSession: false },
    );

    expect(result.ok).toBe(true);
  });

  it('returns NOT_FOUND when a referenced match id does not exist in the queue', () => {
    const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]] });

    const result = swapPlayersInQueue(
      [m1],
      { matchId: 'm1', teamId: 'team1', index: 0 },
      { matchId: 'missing', teamId: 'team1', index: 0 },
    );

    expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });
});

describe('replacePlayerInMatch', () => {
  it('replaces the player at the given slot with any roster player, regardless of where they are', () => {
    const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const stranger = makeTestPlayer({ id: 'stranger' });
    const m1 = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]] });

    const result = replacePlayerInMatch([m1], { matchId: 'm1', teamId: 'team1', index: 0 }, stranger);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const updated = result.queue[0];
    expect(updated.team1.players[0].id).toBe('stranger');
    // Everyone else stays exactly where they were.
    expect(updated.team1.players[1].id).toBe('p1');
    expect(updated.team2.players.map((p) => p.id)).toEqual(['p2', 'p3']);
  });

  it('does not touch any other match in the queue', () => {
    const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const stranger = makeTestPlayer({ id: 'stranger' });
    const m1 = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]] });
    const m2 = makeTestMatch({ id: 'm2', players: [players[4], players[5], players[6], players[7]] });

    const result = replacePlayerInMatch([m1, m2], { matchId: 'm1', teamId: 'team1', index: 0 }, stranger);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.queue.find((m) => m.id === 'm2')).toEqual(m2);
  });

  it('rejects replacing with someone already in one of the other 3 slots of this match', () => {
    const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]] });

    const result = replacePlayerInMatch([m1], { matchId: 'm1', teamId: 'team1', index: 0 }, players[2]);

    expect(result).toEqual({ ok: false, reason: 'DUPLICATE' });
  });

  it('allows "replacing" a player with themselves (a no-op)', () => {
    const players = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const m1 = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]] });

    const result = replacePlayerInMatch([m1], { matchId: 'm1', teamId: 'team1', index: 0 }, players[0]);

    expect(result.ok).toBe(true);
  });

  it('returns NOT_FOUND when the match id does not exist in the queue', () => {
    const stranger = makeTestPlayer({ id: 'stranger' });
    const result = replacePlayerInMatch([], { matchId: 'missing', teamId: 'team1', index: 0 }, stranger);
    expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });
});
