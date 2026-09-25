import { describe, expect, it } from 'vitest';
import { getCopy } from './copy';
import type { Copy } from './copy';
import { THEME_IDS } from './themes';

/** Every leaf of a copy object, rendered to text (functions are called with a sample value). */
const leaves = (copy: Copy): string[] =>
  Object.values(copy).flatMap((section) =>
    Object.values(section as Record<string, unknown>).flatMap((value) =>
      typeof value === 'function'
        ? [String(value(1))]
        : Array.isArray(value)
          ? value
          : [String(value)],
    ),
  );

describe('copy', () => {
  it('keeps the classic theme worded exactly as before', () => {
    const copy = getCopy('default');
    expect(copy.home.start).toBe('打球啦');
    expect(copy.courts.title).toBe('Step 1: 設定場地數量');
    expect(copy.lobby.title).toBe('🏆 比賽大廳');
    expect(copy.court.name(2)).toBe('場地 2');
    expect(copy.dialogs.finishTitle).toBe('確定要結算戰績嗎？');
  });

  it('falls back to the classic wording when no theme is given', () => {
    expect(getCopy()).toBe(getCopy('default'));
  });

  it('returns the same object on every call for a theme', () => {
    expect(getCopy('fairy')).toBe(getCopy('fairy'));
  });

  it('gives every theme a complete set of non-empty text', () => {
    for (const id of THEME_IDS) {
      for (const text of leaves(getCopy(id))) {
        expect(text.trim()).not.toBe('');
      }
    }
  });

  it('re-words the main text in every non-classic theme', () => {
    const classic = getCopy('default');
    for (const id of THEME_IDS.filter((themeId) => themeId !== 'default')) {
      const copy = getCopy(id);
      expect(copy.home.start).not.toBe(classic.home.start);
      expect(copy.home.tagline).not.toBe(classic.home.tagline);
      expect(copy.lobby.title).not.toBe(classic.lobby.title);
      expect(copy.court.name(1)).not.toBe(classic.court.name(1));
      expect(copy.stats.title).not.toBe(classic.stats.title);
    }
  });

  it('keeps the classic announcement phrasing and themes the others, naming the court', () => {
    const classic = getCopy('default').announcement;
    expect([classic.intro, classic.versus, classic.outro(2)]).toEqual(['請', '與', '上場']);

    const lawsuit = getCopy('lawsuit').announcement;
    expect(lawsuit.intro).toBe('傳喚當事人');
    expect(lawsuit.outro(3)).toContain('第 3 法庭');
    expect(lawsuit.outro(undefined)).not.toContain('undefined');
  });
});
