import { getMatchPlayers } from './matchPlayers';
import type { Match } from './types';

/** The fixed words around the player names; the UI supplies a per-theme version. */
export interface AnnouncementPhrasing {
  /** Spoken before the first player, e.g. "請". */
  intro: string;
  /** Spoken between the two teams, e.g. "與". */
  versus: string;
  /** Spoken after the last player, e.g. "上場". */
  outro: string;
}

/** The original announcer's phrasing: "請 A, B 與 C, D 上場". */
export const DEFAULT_ANNOUNCEMENT_PHRASING: AnnouncementPhrasing = {
  intro: '請',
  versus: '與',
  outro: '上場',
};

/**
 * Builds the spoken text segments for "<intro> <team1 players> <versus>
 * <team2 players> <outro>". With the default phrasing this matches the exact
 * phrasing/punctuation of the original announcer: "請 A, B 與 C, D 上場".
 */
export const buildMatchAnnouncementSegments = (
  match: Match,
  phrasing: AnnouncementPhrasing = DEFAULT_ANNOUNCEMENT_PHRASING,
): string[] => {
  const segments: string[] = [phrasing.intro];

  getMatchPlayers(match).forEach((p, idx) => {
    segments.push(p.name);
    if (idx === 1) segments.push(phrasing.versus);
    else if (idx < 3) segments.push(', ');
  });

  segments.push(phrasing.outro);
  return segments;
};
