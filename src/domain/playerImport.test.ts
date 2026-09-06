import { describe, expect, it } from 'vitest';
import { convertGoogleSheetUrlToCsv, generateTestPlayers, parsePlayerCSV } from './playerImport';
import { Gender } from './types';

describe('parsePlayerCSV', () => {
  it('parses valid rows with name, gender and mmr', () => {
    const result = parsePlayerCSV('Alice, Female, 1200\nBob, Male, 1300');

    expect(result.errors).toHaveLength(0);
    expect(result.players).toHaveLength(2);
    expect(result.players[0].name).toBe('Alice');
    expect(result.players[0].gender).toBe(Gender.FEMALE);
    expect(result.players[0].mmr).toBe(1200);
    expect(result.players[1].gender).toBe(Gender.MALE);
  });

  it('defaults gender to Male and mmr to 1200 when omitted', () => {
    const result = parsePlayerCSV('Charlie');
    expect(result.players[0].gender).toBe(Gender.MALE);
    expect(result.players[0].mmr).toBe(1200);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts full-width commas as separators', () => {
    const result = parsePlayerCSV('王小明，男，1200');
    expect(result.players).toHaveLength(1);
    expect(result.players[0].name).toBe('王小明');
    expect(result.players[0].mmr).toBe(1200);
  });

  it('recognises common female markers regardless of case', () => {
    ['女', 'F', 'woman', 'Girl'].forEach((marker) => {
      const result = parsePlayerCSV(`Someone, ${marker}`);
      expect(result.players[0].gender).toBe(Gender.FEMALE);
    });
  });

  it('skips blank lines without producing an error', () => {
    const result = parsePlayerCSV('Alice\n\n\nBob');
    expect(result.players).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it('fails just the line with a missing name, but keeps the rest', () => {
    const result = parsePlayerCSV('Alice, F, 1200\n,,\nBob, M, 1300');
    expect(result.players.map((p) => p.name)).toEqual(['Alice', 'Bob']);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('keeps a valid name even when only its mmr is malformed, alongside other valid rows', () => {
    // A missing-name line fails outright, but a bad mmr on an otherwise valid
    // name still produces a player (defaulted to 1200) - so this mixed input
    // yields 2 players (Alice, Bob), not 1. The original app's own test suite
    // asserted 1 here and never actually passed; this pins down the real,
    // intended "partial success" behaviour described in docs/SPEC.md section 4.2.
    const result = parsePlayerCSV('Alice, F, 1200\n,,\nBob, M, NaN');
    expect(result.players.map((p) => p.name)).toEqual(['Alice', 'Bob']);
    expect(result.players[1].mmr).toBe(1200);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('still creates the player (with default mmr) when mmr is not a number, but reports it', () => {
    const result = parsePlayerCSV('Bob, M, NaN');
    expect(result.players).toHaveLength(1);
    expect(result.players[0].mmr).toBe(1200);
    expect(result.errors.length).toBe(1);
  });
});

describe('convertGoogleSheetUrlToCsv', () => {
  it('builds a CSV export URL with gid=0 when no gid is present', () => {
    const url = convertGoogleSheetUrlToCsv(
      'https://docs.google.com/spreadsheets/d/abc123XYZ/edit#gid=0',
    );
    expect(url).toBe(
      'https://docs.google.com/spreadsheets/d/abc123XYZ/export?format=csv&gid=0',
    );
  });

  it('preserves a non-zero gid', () => {
    const url = convertGoogleSheetUrlToCsv(
      'https://docs.google.com/spreadsheets/d/abc123XYZ/edit#gid=456',
    );
    expect(url).toBe(
      'https://docs.google.com/spreadsheets/d/abc123XYZ/export?format=csv&gid=456',
    );
  });

  it('returns null for a URL that does not look like a spreadsheet link', () => {
    expect(convertGoogleSheetUrlToCsv('https://example.com/not-a-sheet')).toBeNull();
  });
});

describe('generateTestPlayers', () => {
  it('generates the requested count with mmr in [1000, 1799]', () => {
    const players = generateTestPlayers(20, []);
    expect(players).toHaveLength(20);
    players.forEach((p) => {
      expect(p.mmr).toBeGreaterThanOrEqual(1000);
      expect(p.mmr).toBeLessThan(1800);
    });
  });

  it('continues name numbering from the existing roster size', () => {
    const existing = generateTestPlayers(3, []);
    const more = generateTestPlayers(2, existing);
    expect(more.map((p) => p.name)).toEqual(['P4', 'P5']);
  });

  it('produces players ready to play (active, zeroed stats)', () => {
    const [p] = generateTestPlayers(1, []);
    expect(p.isActive).toBe(true);
    expect(p.matchesPlayed).toBe(0);
    expect(p.partners).toEqual({});
  });
});
