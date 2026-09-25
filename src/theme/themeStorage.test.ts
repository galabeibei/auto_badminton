import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyThemeToDocument, loadThemeId, saveThemeId } from './themeStorage';
import { DEFAULT_THEME_ID, THEMES, getTheme, isThemeId } from './themes';

describe('themeStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to the classic theme when nothing is saved', () => {
    expect(loadThemeId()).toBe(DEFAULT_THEME_ID);
  });

  it('round-trips a saved theme', () => {
    saveThemeId('insurance');
    expect(loadThemeId()).toBe('insurance');
  });

  it('ignores an unknown saved value', () => {
    window.localStorage.setItem('badminton-matchmaker:theme', 'vaporwave');
    expect(loadThemeId()).toBe(DEFAULT_THEME_ID);
  });

  it('moves a saved choice of a merged theme to the theme that replaced it', () => {
    for (const merged of ['wizard', 'princess']) {
      window.localStorage.setItem('badminton-matchmaker:theme', merged);
      expect(loadThemeId()).toBe('fairy');
    }
  });

  it('never throws when localStorage itself throws', () => {
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => saveThemeId('fairy')).not.toThrow();
    expect(loadThemeId()).toBe(DEFAULT_THEME_ID);
  });

  it('applies the theme as a data attribute on <html>', () => {
    applyThemeToDocument('fairy');
    expect(document.documentElement.dataset.theme).toBe('fairy');
  });
});

describe('themes', () => {
  it('lists the classic theme first, then the others by stroke count of their names', () => {
    expect(THEMES.map((t) => t.label)).toEqual([
      '經典預設',
      '打官司風',
      '吃吃喝喝風',
      '名偵探風',
      '希臘神話風',
      '科技風',
      '保險業務風',
      '旅遊風',
      '麻將大師風',
      '夢幻童話風',
      '廢材風',
    ]);
  });

  it('validates ids and resolves definitions', () => {
    expect(isThemeId('insurance')).toBe(true);
    expect(isThemeId('nope')).toBe(false);
    expect(isThemeId(null)).toBe(false);
    expect(getTheme('fairy').label).toBe('夢幻童話風');
  });
});
