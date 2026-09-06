import { describe, expect, it } from 'vitest';
import { applyMatchResult, processNoScoreMatch } from './matchResult';
import { makeTestMatch, makeTestPlayer } from './testHelpers';
import { MatchStatus } from './types';

describe('applyMatchResult', () => {
  const setup = () => {
    const p1 = makeTestPlayer({ id: 'P1' });
    const p2 = makeTestPlayer({ id: 'P2' });
    const p3 = makeTestPlayer({ id: 'P3' });
    const p4 = makeTestPlayer({ id: 'P4' });
    const allPlayers = [p1, p2, p3, p4];
    const match = makeTestMatch({ id: 'm1', players: [p1, p2, p3, p4], status: MatchStatus.PLAYING });
    return { p1, p2, p3, p4, allPlayers, match };
  };

  it('records partner history for teammates but not opponents', () => {
    const { allPlayers, match } = setup();
    const { updatedPlayers } = applyMatchResult(allPlayers, match, 21, 19);

    const u1 = updatedPlayers.find((p) => p.id === 'P1')!;
    const u2 = updatedPlayers.find((p) => p.id === 'P2')!;
    const u3 = updatedPlayers.find((p) => p.id === 'P3')!;

    expect(u1.partners['P2']).toBe(1);
    expect(u2.partners['P1']).toBe(1);
    expect(u1.partners['P3']).toBeUndefined();

    expect(u1.opponents['P3']).toBe(1);
    expect(u1.opponents['P4']).toBe(1);
    expect(u3.opponents['P1']).toBe(1);
  });

  it('updates wins/losses/points/mmr/duration/lastMatchEndTime for a decisive result', () => {
    const { allPlayers, match } = setup();
    const now = 123456;

    const { updatedPlayers, changes } = applyMatchResult(allPlayers, match, 21, 15, 12, now);

    const u1 = updatedPlayers.find((p) => p.id === 'P1')!;
    const u3 = updatedPlayers.find((p) => p.id === 'P3')!;

    expect(u1.wins).toBe(1);
    expect(u1.losses).toBe(0);
    expect(u1.totalPoints).toBe(21);
    expect(u1.matchesPlayed).toBe(1);
    expect(u1.totalMinutes).toBe(12);
    expect(u1.lastMatchEndTime).toBe(now);
    expect(u1.mmr).toBeGreaterThan(1000);

    expect(u3.wins).toBe(0);
    expect(u3.losses).toBe(1);
    expect(u3.totalPoints).toBe(15);
    expect(u3.mmr).toBeLessThan(1000);

    expect(changes).toHaveLength(4);
  });

  it('gives nobody a win or loss on a draw', () => {
    const { allPlayers, match } = setup();
    const { updatedPlayers } = applyMatchResult(allPlayers, match, 10, 10);

    updatedPlayers.forEach((p) => {
      expect(p.wins).toBe(0);
      expect(p.losses).toBe(0);
    });
  });

  it('reads the latest player data instead of trusting the match snapshot', () => {
    const { p1, p2, p3, p4, allPlayers } = setup();
    // The match object holds a stale snapshot of P1 (mmr 1000)...
    const staleMatch = makeTestMatch({ id: 'm1', players: [p1, p2, p3, p4] });
    // ...but P1's real mmr has since changed to 2000.
    const freshPlayers = allPlayers.map((p) => (p.id === 'P1' ? { ...p, mmr: 2000 } : p));

    const { changes } = applyMatchResult(freshPlayers, staleMatch, 21, 10);

    expect(changes.find((c) => c.playerId === 'P1')?.oldMMR).toBe(2000);
  });
});

describe('processNoScoreMatch', () => {
  it('increments match count, partners and opponents, but leaves MMR untouched', () => {
    const p1 = makeTestPlayer({ id: 'P1', mmr: 1000 });
    const p2 = makeTestPlayer({ id: 'P2', mmr: 1000 });
    const p3 = makeTestPlayer({ id: 'P3', mmr: 1000 });
    const p4 = makeTestPlayer({ id: 'P4', mmr: 1000 });
    const allPlayers = [p1, p2, p3, p4];
    const match = makeTestMatch({ id: 'm1', players: [p1, p2, p3, p4], status: MatchStatus.PLAYING });

    const updated = processNoScoreMatch(allPlayers, match, 15, 555);

    const u1 = updated.find((p) => p.id === 'P1')!;
    const u3 = updated.find((p) => p.id === 'P3')!;

    expect(u1.matchesPlayed).toBe(1);
    expect(u1.mmr).toBe(1000);
    expect(u1.wins).toBe(0);
    expect(u1.losses).toBe(0);
    expect(u1.partners['P2']).toBe(1);
    expect(u1.opponents['P3']).toBe(1);
    expect(u1.totalMinutes).toBe(15);
    expect(u1.lastMatchEndTime).toBe(555);
    expect(u3.matchesPlayed).toBe(1);
  });

  it('leaves players not in the match untouched', () => {
    const p1 = makeTestPlayer({ id: 'P1' });
    const p2 = makeTestPlayer({ id: 'P2' });
    const p3 = makeTestPlayer({ id: 'P3' });
    const p4 = makeTestPlayer({ id: 'P4' });
    const bystander = makeTestPlayer({ id: 'bystander' });
    const match = makeTestMatch({ id: 'm1', players: [p1, p2, p3, p4] });

    const updated = processNoScoreMatch([p1, p2, p3, p4, bystander], match);

    expect(updated.find((p) => p.id === 'bystander')).toEqual(bystander);
  });
});
