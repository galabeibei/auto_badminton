import { describe, expect, it } from 'vitest';
import { createPlayer } from './playerFactory';
import { Gender } from './types';

describe('createPlayer', () => {
  it('defaults gender to Male and mmr to 1200', () => {
    const p = createPlayer({ name: 'Alice' });
    expect(p.gender).toBe(Gender.MALE);
    expect(p.mmr).toBe(1200);
    expect(p.initialMmr).toBe(1200);
  });

  it('starts every stat field at zero and marks the player active', () => {
    const p = createPlayer({ name: 'Bob', gender: Gender.FEMALE, mmr: 1500 });
    expect(p.matchesPlayed).toBe(0);
    expect(p.wins).toBe(0);
    expect(p.losses).toBe(0);
    expect(p.totalPoints).toBe(0);
    expect(p.totalMinutes).toBe(0);
    expect(p.totalWaitTime).toBe(0);
    expect(p.maxWaitTime).toBe(0);
    expect(p.lastMatchEndTime).toBe(0);
    expect(p.partners).toEqual({});
    expect(p.opponents).toEqual({});
    expect(p.isActive).toBe(true);
  });

  it('assigns a unique id to each player', () => {
    const a = createPlayer({ name: 'A' });
    const b = createPlayer({ name: 'B' });
    expect(a.id).not.toBe(b.id);
  });
});
