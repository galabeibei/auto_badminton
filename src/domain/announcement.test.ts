import { describe, expect, it } from 'vitest';
import { buildMatchAnnouncementSegments } from './announcement';
import { makeTestMatch, makeTestPlayer } from './testHelpers';

const players = ['Alice', 'Bob', 'Carol', 'Dave'].map((name) => makeTestPlayer({ id: name, name }));
const match = makeTestMatch({
  id: 'm1',
  players: [players[0], players[1], players[2], players[3]],
});

describe('buildMatchAnnouncementSegments', () => {
  it('joins team1 with a comma, bridges teams with 與, and joins team2 with a comma', () => {
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

  it('uses custom phrasing around the same player order', () => {
    expect(
      buildMatchAnnouncementSegments(match, {
        intro: '傳喚當事人',
        versus: '對',
        outro: '請至第 1 法庭',
      }),
    ).toEqual(['傳喚當事人', 'Alice', ', ', 'Bob', '對', 'Carol', ', ', 'Dave', '請至第 1 法庭']);
  });
});
