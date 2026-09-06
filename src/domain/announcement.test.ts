import { describe, expect, it } from 'vitest';
import { buildMatchAnnouncementSegments } from './announcement';
import { makeTestMatch, makeTestPlayer } from './testHelpers';

describe('buildMatchAnnouncementSegments', () => {
  it('joins team1 with a comma, bridges teams with 與, and joins team2 with a comma', () => {
    const players = ['Alice', 'Bob', 'Carol', 'Dave'].map((name) => makeTestPlayer({ id: name, name }));
    const match = makeTestMatch({ id: 'm1', players: [players[0], players[1], players[2], players[3]] });

    expect(buildMatchAnnouncementSegments(match)).toEqual([
      '請',
      'Alice',
      ', ',
      'Bob',
      '與',
      'Carol',
      ', ',
      'Dave',
      '上場',
    ]);
  });
});
