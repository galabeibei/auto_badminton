import { MMR_MAX, MMR_MIN } from './constants';

/** The hint shown whenever a typed rating is rejected. */
export const MMR_RANGE_HINT = `請輸入合理的積分 (${MMR_MIN} - ${MMR_MAX})`;

/**
 * Parses a rating a human typed, returning null when it isn't a sensible one.
 *
 * Shared by "add player" and the roster list's inline rating edit so both
 * accept exactly the same values. Deliberately stricter than `parseInt`:
 * "1200abc" is a typo, not a rating, so it's rejected rather than silently
 * read as 1200.
 */
export const parseMmrInput = (text: string): number | null => {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  const value = Number.parseInt(trimmed, 10);
  return value < MMR_MIN || value > MMR_MAX ? null : value;
};
