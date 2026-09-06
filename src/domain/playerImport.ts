import { createPlayer } from './playerFactory';
import { Gender } from './types';
import type { Player } from './types';

export interface ParsePlayerCsvResult {
  players: Player[];
  errors: string[];
}

const FEMALE_MARKERS = ['女', 'f', 'woman', 'girl'];

/**
 * Parses "name, gender(optional), mmr(optional)" lines (one player per line,
 * comma or full-width comma separated) into Player records.
 *
 * - A missing/empty name fails the whole line (no player produced).
 * - An unrecognised gender token defaults to Male rather than failing.
 * - A non-numeric mmr still produces a player (defaulted to 1200) but is
 *   reported as an error, so partial imports still add everyone they can.
 */
export const parsePlayerCSV = (content: string): ParsePlayerCsvResult => {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const players: Player[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const parts = line.split(/,|，/).map((s) => s.trim());
    const name = parts[0];
    if (!name) {
      errors.push(`第 ${index + 1} 行無效：沒有名字`);
      return;
    }

    let gender = Gender.MALE;
    if (parts.length > 1) {
      const g = parts[1].toLowerCase();
      if (FEMALE_MARKERS.some((marker) => g.includes(marker))) {
        gender = Gender.FEMALE;
      }
    }

    let mmr = 1200;
    if (parts.length > 2) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        mmr = parsed;
      } else {
        errors.push(`第 ${index + 1} 行 (${name}) 積分格式錯誤，使用預設值 1200`);
      }
    }

    players.push(createPlayer({ name, gender, mmr }));
  });

  return { players, errors };
};

/**
 * Converts a Google Sheets URL (edit link or share link) into a CSV export
 * URL, or returns null if the link doesn't look like a spreadsheet link.
 */
export const convertGoogleSheetUrlToCsv = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match?.[1]) return null;

  const id = match[1];
  const gidMatch = url.match(/[#&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
};

/**
 * Generates `count` randomised players (for demoing/testing the matchmaker
 * without having to type in a real roster). Names continue numbering from
 * however many players already exist.
 */
export const generateTestPlayers = (count: number, currentPlayers: Player[]): Player[] => {
  const startIdx = currentPlayers.length;
  const newPlayers: Player[] = [];

  for (let i = 0; i < count; i++) {
    newPlayers.push(
      createPlayer({
        name: `P${startIdx + i + 1}`,
        mmr: 1000 + Math.floor(Math.random() * 800),
        gender: Math.random() > 0.4 ? Gender.MALE : Gender.FEMALE,
      }),
    );
  }

  return newPlayers;
};
