import { describe, expect, it } from 'vitest';
import {
  SHADES,
  THEMED_COLOR_FAMILIES,
  THEME_TOKENS,
  buildThemeStyles,
  hexToRgbChannels,
} from './themeTokens';
import { THEME_IDS } from './themes';

describe('themeTokens', () => {
  it('converts hex colours to rgb channel triples', () => {
    expect(hexToRgbChannels('#1a9f60')).toBe('26 159 96');
    expect(hexToRgbChannels('#fff')).toBe('255 255 255');
    expect(() => hexToRgbChannels('red')).toThrow();
  });

  it('defines tokens for every selectable theme', () => {
    expect(Object.keys(THEME_TOKENS).sort()).toEqual([...THEME_IDS].sort());
  });

  it('emits one rule per theme, with the classic theme doubling as the :root fallback', () => {
    const styles = buildThemeStyles();
    expect(Object.keys(styles)).toHaveLength(THEME_IDS.length);
    expect(styles[':root, [data-theme="default"]']).toBeDefined();
    for (const id of THEME_IDS.filter((id) => id !== 'default')) {
      expect(styles[`[data-theme="${id}"]`]).toBeDefined();
    }
  });

  it('gives every theme a complete, well-formed colour scale for every family the app uses', () => {
    for (const declarations of Object.values(buildThemeStyles())) {
      for (const family of THEMED_COLOR_FAMILIES) {
        for (const shade of SHADES) {
          expect(declarations[`--c-${family}-${shade}`]).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
        }
      }
      for (const token of ['surface', 'brand', 'backdrop']) {
        expect(declarations[`--c-${token}`]).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
      }
    }
  });

  it('keeps male and female player badges distinguishable in every theme', () => {
    for (const declarations of Object.values(buildThemeStyles())) {
      expect(declarations['--c-male-600']).not.toBe(declarations['--c-female-600']);
      expect(declarations['--c-male-100']).not.toBe(declarations['--c-female-100']);
    }
  });

  it('keeps the classic theme identical to the original hard-coded colours', () => {
    const classic = buildThemeStyles()[':root, [data-theme="default"]'];
    expect(classic['--c-brand']).toBe(hexToRgbChannels('#1a9f60'));
    expect(classic['--c-surface']).toBe('255 255 255');
    expect(classic['--c-blue-600']).toBe(hexToRgbChannels('#2563eb'));
    expect(classic['--c-slate-50']).toBe(hexToRgbChannels('#f8fafc'));
  });
});
