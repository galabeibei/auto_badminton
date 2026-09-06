import { getMatchPlayers } from './matchPlayers';
import type { Match } from './types';

/**
 * Builds the spoken text segments for "please <team1 players> and <team2
 * players> to the court", matching the exact phrasing/punctuation of the
 * original announcer: "請 A, B 與 C, D 上場".
 */
export const buildMatchAnnouncementSegments = (match: Match): string[] => {
  const segments: string[] = ['請'];

  getMatchPlayers(match).forEach((p, idx) => {
    segments.push(p.name);
    if (idx === 1) segments.push('與');
    else if (idx < 3) segments.push(', ');
  });

  segments.push('上場');
  return segments;
};
