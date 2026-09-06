import { describe, expect, it } from 'vitest';
import { calculateNewMMR } from './elo';
import { makeTestPlayer } from './testHelpers';

describe('calculateNewMMR', () => {
  it('gives the winner and loser symmetric changes when MMR is equal', () => {
    const t1 = [makeTestPlayer({ id: 'A', mmr: 1200 })];
    const t2 = [makeTestPlayer({ id: 'B', mmr: 1200 })];

    const { team1New, team2New } = calculateNewMMR(t1, t2, 21, 10);

    expect(team1New[0]).toBeGreaterThan(1200);
    expect(team2New[0]).toBeLessThan(1200);
    expect(team1New[0] - 1200).toBe(1200 - team2New[0]);
  });

  it('gives every player on a team the same delta regardless of individual MMR', () => {
    const t1 = [makeTestPlayer({ id: 'A', mmr: 1000 }), makeTestPlayer({ id: 'B', mmr: 1400 })];
    const t2 = [makeTestPlayer({ id: 'C', mmr: 1200 }), makeTestPlayer({ id: 'D', mmr: 1200 })];

    const { team1New } = calculateNewMMR(t1, t2, 21, 15);

    expect(team1New[0] - 1000).toBe(team1New[1] - 1400);
  });

  it('treats an equal score as a draw (expected-value delta only)', () => {
    const t1 = [makeTestPlayer({ id: 'A', mmr: 1200 })];
    const t2 = [makeTestPlayer({ id: 'B', mmr: 1200 })];

    const { team1New, team2New } = calculateNewMMR(t1, t2, 0, 0);

    expect(team1New[0]).toBe(1200);
    expect(team2New[0]).toBe(1200);
  });

  it('gives the underdog a bigger reward for an equal-score draw than the favourite', () => {
    const strong = [makeTestPlayer({ id: 'A', mmr: 1600 })];
    const weak = [makeTestPlayer({ id: 'B', mmr: 1200 })];

    const { team1New, team2New } = calculateNewMMR(strong, weak, 0, 0);

    expect(team1New[0]).toBeLessThan(1600);
    expect(team2New[0]).toBeGreaterThan(1200);
  });
});
