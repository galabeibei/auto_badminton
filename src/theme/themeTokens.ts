import twColors from 'tailwindcss/colors';
import type { ThemeId } from './themes';

/**
 * Design tokens for every theme, turned into CSS custom properties at build
 * time by `tailwind.config.ts`.
 *
 * How theming works: every Tailwind colour family the app uses (`slate`,
 * `blue`, …) is configured as `rgb(var(--c-<family>-<shade>) / <alpha-value>)`
 * instead of a fixed hex, and each theme is a `[data-theme="<id>"]` block that
 * sets those variables (plus fonts, radii, shadows and a few decorative
 * backgrounds). So the existing `bg-blue-600` / `text-slate-500` classes all
 * over the components re-colour themselves with no per-component changes, and
 * because CSS variables inherit from the nearest ancestor, any element can
 * preview another theme just by carrying its own `data-theme` attribute.
 *
 * Only imported by `tailwind.config.ts` and tests - never by app code, so
 * `tailwindcss/colors` stays out of the shipped bundle.
 */

export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type Shade = (typeof SHADES)[number];
export type Palette = Record<Shade, string>;

/** Every Tailwind colour family referenced by the components. */
export const THEMED_COLOR_FAMILIES = [
  'slate',
  'blue',
  'red',
  'purple',
  'emerald',
  'yellow',
  'orange',
  'green',
  'pink',
  'indigo',
  // Semantic families for the player gender badges, so a theme whose primary
  // colour (`blue`) is pink can still tell male and female players apart.
  'male',
  'female',
] as const;
export type ColorFamily = (typeof THEMED_COLOR_FAMILIES)[number];

export const RADIUS_SIZES = ['lg', 'xl', '2xl'] as const;
export const SHADOW_SIZES = ['sm', 'DEFAULT', 'md', 'lg', 'xl', '2xl'] as const;

export interface ThemeTokens {
  colorScheme: 'light' | 'dark';
  /** Replacement palette per colour family; families not listed keep the classic palette (`CLASSIC_PALETTES`). */
  palettes: Partial<Record<ColorFamily, Palette>>;
  /** Colour behind `bg-white` (cards, modals, inputs). `text-white` is never themed. */
  surface: string;
  /** `badminton-green`: the header bar and home medallion colour. */
  brand: string;
  /** Modal backdrop colour (rendered at 60% opacity). */
  backdrop: string;
  font: string;
  radius: Record<(typeof RADIUS_SIZES)[number], string>;
  shadow: Record<(typeof SHADOW_SIZES)[number], string>;
  /** Extra `background` layers painted over the page colour (patterns, glows). */
  shellPattern: string;
  /** Extra `background` layers painted over the header's brand colour. */
  headerPattern: string;
  headerBorder: string;
  headerTitleColor: string;
  headerTitleShadow: string;
  /** Page-edge ornaments (see `ThemeDecorations`). */
  decorOpacity: string;
  decorAnimation: string;
}

const tw = (name: keyof typeof twColors) => twColors[name] as Palette;

/** `palette('#50 #100 … #950')`: the 11 shades, lightest first, as one space-separated string. */
const palette = (shades: string): Palette => {
  const hexes = shades.trim().split(/\s+/);
  if (hexes.length !== SHADES.length) {
    throw new Error(`A palette needs exactly ${SHADES.length} shades, got ${hexes.length}`);
  }
  return Object.fromEntries(SHADES.map((shade, i) => [shade, hexes[i]])) as Palette;
};

/**
 * Flips a light palette for a dark theme: pale tints (50-200, used as
 * backgrounds) become deep ones and dark shades (700-900, used as text on
 * those tints) become light. 500/600 stay mid-tone because they double as
 * button backgrounds under `text-white`.
 */
const DARK_SHADE_MAP: Record<Shade, Shade> = {
  50: 950,
  100: 900,
  200: 800,
  300: 700,
  400: 500,
  500: 500,
  600: 600,
  700: 400,
  800: 300,
  900: 200,
  950: 100,
};
const forDarkTheme = (source: Palette): Palette =>
  Object.fromEntries(SHADES.map((shade) => [shade, source[DARK_SHADE_MAP[shade]]])) as Palette;

/** What each family looks like in the classic theme: Tailwind's own palettes. */
const CLASSIC_PALETTES: Record<ColorFamily, Palette> = {
  slate: tw('slate'),
  blue: tw('blue'),
  red: tw('red'),
  purple: tw('purple'),
  emerald: tw('emerald'),
  yellow: tw('yellow'),
  orange: tw('orange'),
  green: tw('green'),
  pink: tw('pink'),
  indigo: tw('indigo'),
  male: tw('blue'),
  female: tw('pink'),
};

const TAILWIND_DEFAULT_FONT =
  'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
const EMOJI_FONTS = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
/** Chinese serif (明體) stack for the classical-looking themes. */
const SERIF_FONT = `"Noto Serif TC", "Songti TC", "PMingLiU", "MingLiU", Georgia, serif, ${EMOJI_FONTS}`;

const CLASSIC: ThemeTokens = {
  colorScheme: 'light',
  palettes: {},
  surface: '#ffffff',
  brand: '#1a9f60',
  backdrop: twColors.slate[900],
  font: TAILWIND_DEFAULT_FONT,
  radius: { lg: '0.5rem', xl: '0.75rem', '2xl': '1rem' },
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
  shellPattern: 'none',
  headerPattern: 'none',
  headerBorder: '0 solid transparent',
  headerTitleColor: '#ffffff',
  headerTitleShadow: 'none',
  decorOpacity: '0',
  decorAnimation: 'none',
};

/**
 * Dreamy storybook (童話 + 魔法 + 公主) built from toy bricks: pastel pink/violet, gold trim,
 * a stud "baseplate" page, a row of coloured bricks along the header and chunky block-edge shadows.
 */
const FAIRY: ThemeTokens = {
  ...CLASSIC,
  palettes: {
    // Lavender-tinted neutrals instead of cool grey.
    slate: palette(
      '#fdf8ff #f7eefc #ecdcf5 #dcc2ea #b69ccc #8f78a8 #6f5a88 #58466d #433554 #2f243b #1d1526',
    ),
    blue: tw('pink'),
    red: tw('rose'),
    purple: tw('violet'),
    pink: tw('fuchsia'),
    indigo: tw('violet'),
    emerald: tw('teal'),
    yellow: tw('amber'),
    male: tw('sky'),
    female: tw('pink'),
  },
  surface: '#fffbfe',
  brand: '#ec4899',
  backdrop: '#4c1d95',
  font: `"jf-openhuninn-2.0", "Comic Sans MS", "Chalkboard SE", "Yuanti TC", "Microsoft JhengHei", ${TAILWIND_DEFAULT_FONT}`,
  radius: { lg: '0.75rem', xl: '1.25rem', '2xl': '1.75rem' },
  // A solid bottom edge makes buttons and cards look like chunky toy blocks; big panels get a gold trim.
  shadow: {
    sm: '0 2px 0 0 rgb(157 23 77 / 0.2)',
    DEFAULT: '0 3px 0 0 rgb(157 23 77 / 0.16)',
    md: '0 4px 0 0 rgb(168 85 247 / 0.22), 0 10px 18px -8px rgb(168 85 247 / 0.3)',
    lg: '0 5px 0 0 rgb(168 85 247 / 0.22), 0 14px 26px -10px rgb(168 85 247 / 0.32)',
    xl: '0 0 0 2px rgb(252 211 77 / 0.5), 0 6px 0 0 rgb(168 85 247 / 0.25), 0 18px 32px -10px rgb(168 85 247 / 0.35)',
    '2xl':
      '0 0 0 3px rgb(252 211 77 / 0.55), 0 8px 0 0 rgb(168 85 247 / 0.25), 0 28px 56px -12px rgb(168 85 247 / 0.4)',
  },
  shellPattern: [
    // Gold and pink sparkles.
    'radial-gradient(circle 1.5px at 30px 40px, rgb(234 179 8 / 0.6) 98%, transparent) 0 0 / 130px 130px',
    'radial-gradient(circle 1px at 95px 100px, rgb(236 72 153 / 0.55) 98%, transparent) 0 0 / 130px 130px',
    // Toy-brick baseplate studs.
    'radial-gradient(circle, rgb(244 114 182 / 0.16) 5px, rgb(236 72 153 / 0.08) 6px, transparent 6.5px) 0 0 / 30px 30px',
    // Pastel glows in the corners.
    'radial-gradient(circle at 10% 15%, rgb(251 207 232 / 0.7), transparent 28%)',
    'radial-gradient(circle at 90% 10%, rgb(221 214 254 / 0.75), transparent 30%)',
    'radial-gradient(circle at 85% 88%, rgb(204 251 241 / 0.7), transparent 30%)',
    'radial-gradient(circle at 12% 92%, rgb(254 243 199 / 0.8), transparent 28%)',
  ].join(', '),
  headerPattern: [
    // A row of coloured toy bricks along the bottom edge of the header.
    'repeating-linear-gradient(90deg, #f472b6 0 38px, rgb(0 0 0 / 0.18) 38px 40px, #fbbf24 40px 78px, rgb(0 0 0 / 0.18) 78px 80px, #60a5fa 80px 118px, rgb(0 0 0 / 0.18) 118px 120px, #34d399 120px 158px, rgb(0 0 0 / 0.18) 158px 160px, #a78bfa 160px 198px, rgb(0 0 0 / 0.18) 198px 200px) left bottom / 100% 8px no-repeat',
    'radial-gradient(rgb(255 255 255 / 0.3) 1.2px, transparent 1.8px) 0 0 / 18px 18px',
    'linear-gradient(90deg, #ec4899, #a855f7 55%, #6366f1)',
  ].join(', '),
  headerTitleShadow: '0 2px 6px rgb(131 24 67 / 0.45)',
  decorOpacity: '0.6',
  decorAnimation: 'theme-float 6s ease-in-out infinite',
};

// Deep, trustworthy navy as the primary colour; gold for highlights.
const NAVY = palette(
  '#eef3fb #d9e3f5 #b3c7eb #7f9fd8 #4d77c0 #2a58a8 #1c4590 #163873 #122d5c #0e2247 #08152e',
);

const INSURANCE: ThemeTokens = {
  ...CLASSIC,
  palettes: {
    blue: NAVY,
    yellow: tw('amber'),
    emerald: tw('teal'),
    male: NAVY,
  },
  brand: '#0e2247',
  font: `"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", "Heiti TC", ${TAILWIND_DEFAULT_FONT}`,
  radius: { lg: '0.25rem', xl: '0.375rem', '2xl': '0.5rem' },
  shellPattern:
    'repeating-linear-gradient(90deg, rgb(14 34 71 / 0.035) 0 1px, transparent 1px 56px)',
  headerPattern: 'linear-gradient(180deg, #17386e, #0e2247)',
  headerBorder: '4px solid #c9a227',
  headerTitleShadow: 'none',
};

/** Dark control-panel look: navy-black surfaces, neon cyan accents, monospace type. */
const TECH: ThemeTokens = {
  ...CLASSIC,
  colorScheme: 'dark',
  palettes: {
    // Already dark-to-light: 50/100 are the panel backgrounds, 800/900 the readout text.
    slate: palette(
      '#05080f #0b1220 #152036 #22314f #3d5275 #647a9e #8fa3c4 #b4c4dd #d4dfee #eaf1fa #f5f9ff',
    ),
    blue: forDarkTheme(tw('cyan')),
    red: forDarkTheme(tw('rose')),
    purple: forDarkTheme(tw('violet')),
    emerald: forDarkTheme(tw('emerald')),
    green: forDarkTheme(tw('green')),
    yellow: forDarkTheme(tw('amber')),
    orange: forDarkTheme(tw('orange')),
    pink: forDarkTheme(tw('fuchsia')),
    indigo: forDarkTheme(tw('indigo')),
    male: forDarkTheme(tw('sky')),
    female: forDarkTheme(tw('pink')),
  },
  surface: '#0e1628',
  brand: '#0e7490',
  backdrop: '#000000',
  font: `"Cascadia Code", "JetBrains Mono", Consolas, "Microsoft JhengHei", "PingFang TC", monospace, ${EMOJI_FONTS}`,
  radius: { lg: '0.25rem', xl: '0.375rem', '2xl': '0.5rem' },
  shadow: {
    sm: '0 0 0 1px rgb(34 211 238 / 0.12)',
    DEFAULT: '0 0 0 1px rgb(34 211 238 / 0.15), 0 2px 6px rgb(0 0 0 / 0.5)',
    md: '0 0 0 1px rgb(34 211 238 / 0.22), 0 0 16px -4px rgb(34 211 238 / 0.35)',
    lg: '0 0 0 1px rgb(34 211 238 / 0.25), 0 0 24px -6px rgb(34 211 238 / 0.4)',
    xl: '0 0 0 1px rgb(34 211 238 / 0.3), 0 0 32px -6px rgb(34 211 238 / 0.45)',
    '2xl': '0 0 0 1px rgb(34 211 238 / 0.35), 0 0 48px -8px rgb(34 211 238 / 0.55)',
  },
  shellPattern: [
    'linear-gradient(rgb(34 211 238 / 0.06) 1px, transparent 1px) 0 0 / 32px 32px',
    'linear-gradient(90deg, rgb(34 211 238 / 0.06) 1px, transparent 1px) 0 0 / 32px 32px',
    'radial-gradient(ellipse at top, rgb(8 145 178 / 0.25), transparent 60%)',
  ].join(', '),
  headerPattern: 'linear-gradient(90deg, #020617, #0c4a6e 50%, #020617)',
  headerBorder: '1px solid rgb(34 211 238 / 0.6)',
  headerTitleColor: '#67e8f9',
  headerTitleShadow: '0 0 10px rgb(34 211 238 / 0.8)',
  decorOpacity: '0.35',
  decorAnimation: 'theme-float 6s ease-in-out infinite',
};

/** Courtroom: parchment paper, mahogany wood, a gold double rule, serif type. */
const LAWSUIT: ThemeTokens = {
  ...CLASSIC,
  palettes: {
    slate: tw('stone'),
    blue: palette(
      '#fbf4ee #f3e3d3 #e6c6a8 #d4a078 #b8784c #9a5a32 #7f4526 #663620 #4f2a1b #3a1f15 #22110a',
    ),
    yellow: tw('amber'),
    emerald: tw('green'),
  },
  surface: '#fffdf8',
  brand: '#3a1f15',
  backdrop: '#1c1008',
  font: SERIF_FONT,
  radius: { lg: '0.25rem', xl: '0.375rem', '2xl': '0.5rem' },
  shellPattern:
    'repeating-linear-gradient(0deg, rgb(120 80 40 / 0.05) 0 1px, transparent 1px 28px)',
  headerPattern: 'linear-gradient(180deg, #5a3320, #3a1f15)',
  headerBorder: '4px double #c9a227',
  headerTitleColor: '#f5e6c8',
  decorOpacity: '0.3',
};

/** Marble white, Aegean blue and gold. */
const GREEK: ThemeTokens = {
  ...CLASSIC,
  palettes: {
    blue: palette(
      '#eef6ff #d6e9ff #aed2ff #78b1f5 #4a8ce0 #2a6cc4 #1d55a3 #174483 #133767 #0f2a4f #091a33',
    ),
    yellow: tw('amber'),
    emerald: tw('teal'),
    male: tw('sky'),
    female: tw('rose'),
  },
  surface: '#fffefb',
  brand: '#1d55a3',
  font: `"Cinzel", ${SERIF_FONT}`,
  radius: { lg: '0.375rem', xl: '0.5rem', '2xl': '0.75rem' },
  shadow: {
    ...CLASSIC.shadow,
    md: '0 4px 10px -2px rgb(29 85 163 / 0.15)',
    lg: '0 10px 20px -6px rgb(29 85 163 / 0.2)',
    '2xl': '0 0 0 2px rgb(212 175 55 / 0.5), 0 25px 50px -12px rgb(29 85 163 / 0.3)',
  },
  shellPattern: [
    'radial-gradient(ellipse at 20% 0%, rgb(212 175 55 / 0.14), transparent 50%)',
    'linear-gradient(115deg, transparent 40%, rgb(148 163 184 / 0.1) 45%, transparent 50%)',
    'linear-gradient(35deg, transparent 60%, rgb(148 163 184 / 0.08) 63%, transparent 66%)',
  ].join(', '),
  headerPattern: 'linear-gradient(180deg, #1d55a3, #133767)',
  headerBorder: '4px solid #d4af37',
  headerTitleColor: '#fdf6d8',
  decorOpacity: '0.45',
  decorAnimation: 'theme-float 8s ease-in-out infinite',
};

/** Couldn't-be-bothered: washed-out greys, flat shadows, a coffee ring on the page. */
const SLACKER: ThemeTokens = {
  ...CLASSIC,
  palettes: {
    slate: tw('stone'),
    blue: palette(
      '#f2f4f7 #e3e7ee #c9d0dc #a7b2c4 #8392a9 #67778f #525f75 #434d5f #373f4d #2b313c #1a1e25',
    ),
    emerald: tw('stone'),
    purple: palette(
      '#f6f3f7 #ebe5ee #d6cbdb #b9a8c0 #9b87a3 #7f6b88 #67566f #54475b #433a49 #322b36 #1f1a22',
    ),
  },
  surface: '#fbfaf7',
  brand: '#78716c',
  shadow: {
    sm: 'none',
    DEFAULT: '0 1px 0 rgb(0 0 0 / 0.06)',
    md: '0 1px 0 rgb(0 0 0 / 0.08)',
    lg: '0 2px 0 rgb(0 0 0 / 0.08)',
    xl: '0 2px 0 rgb(0 0 0 / 0.1)',
    '2xl': '0 3px 0 rgb(0 0 0 / 0.12)',
  },
  shellPattern: [
    'radial-gradient(circle at 88% 22%, transparent 42px, rgb(120 85 50 / 0.3) 44px, rgb(120 85 50 / 0.12) 49px, transparent 52px)',
    'radial-gradient(circle at 8% 85%, rgb(120 85 50 / 0.07), transparent 10%)',
  ].join(', '),
  headerPattern: 'linear-gradient(180deg, #8a847d, #78716c)',
  decorOpacity: '0.5',
  decorAnimation: 'theme-float 12s ease-in-out infinite',
};

/** Diner: tomato-red gingham tablecloth header, warm cream page, rounded everything. */
const FOODIE: ThemeTokens = {
  ...CLASSIC,
  palettes: {
    slate: palette(
      '#fffaf3 #fdf0de #f5dfc2 #e8c59f #c9a07a #a17c5a #7f5f44 #634a36 #4b392b #33271e #1f1711',
    ),
    blue: tw('orange'),
    orange: tw('amber'),
    emerald: tw('lime'),
    purple: tw('fuchsia'),
    male: tw('sky'),
    female: tw('pink'),
  },
  surface: '#fffdf8',
  brand: '#dc2626',
  font: `"jf-openhuninn-2.0", "Arial Rounded MT Bold", "Microsoft JhengHei", ${TAILWIND_DEFAULT_FONT}`,
  radius: { lg: '0.75rem', xl: '1.25rem', '2xl': '1.5rem' },
  shadow: {
    ...CLASSIC.shadow,
    md: '0 6px 14px -4px rgb(234 88 12 / 0.2)',
    lg: '0 12px 24px -8px rgb(234 88 12 / 0.25)',
    xl: '0 18px 30px -10px rgb(234 88 12 / 0.28)',
  },
  shellPattern: 'radial-gradient(rgb(234 88 12 / 0.12) 2px, transparent 2.5px) 0 0 / 28px 28px',
  headerPattern: [
    'repeating-linear-gradient(0deg, rgb(255 255 255 / 0.28) 0 12px, transparent 12px 24px)',
    'repeating-linear-gradient(90deg, rgb(255 255 255 / 0.28) 0 12px, transparent 12px 24px)',
  ].join(', '),
  headerTitleShadow: '0 2px 4px rgb(127 29 29 / 0.5)',
  decorOpacity: '0.6',
  decorAnimation: 'theme-float 6s ease-in-out infinite',
};

/** Sky blue, sunshine and sea; the header ends in a dashed boarding-pass tear line. */
const TRAVEL: ThemeTokens = {
  ...CLASSIC,
  palettes: {
    blue: tw('sky'),
    yellow: tw('amber'),
    emerald: tw('teal'),
  },
  brand: '#0284c7',
  radius: { lg: '0.75rem', xl: '1rem', '2xl': '1.25rem' },
  shellPattern: [
    'radial-gradient(circle at 92% 8%, rgb(253 224 71 / 0.45), transparent 16%)',
    'radial-gradient(rgb(2 132 199 / 0.12) 1.2px, transparent 1.6px) 0 0 / 18px 18px',
    'linear-gradient(180deg, rgb(224 242 254 / 0.9), transparent 45%)',
  ].join(', '),
  headerPattern: 'linear-gradient(90deg, #0369a1, #0ea5e9 70%, #22d3ee)',
  headerBorder: '3px dashed rgb(255 255 255 / 0.7)',
  decorOpacity: '0.55',
  decorAnimation: 'theme-float 6s ease-in-out infinite',
};

/** Detective agency: navy suit, red bow-tie stripe, typewriter case files. */
const DETECTIVE: ThemeTokens = {
  ...CLASSIC,
  palettes: {
    slate: tw('zinc'),
    blue: palette(
      '#eef2fb #d9e1f6 #b1c2ea #7e98d6 #4f6fbf #2e4f9f #213d85 #1b316b #172957 #121f42 #0b1429',
    ),
    yellow: tw('amber'),
  },
  brand: '#1b316b',
  font: `"Courier New", "Microsoft JhengHei", "PingFang TC", monospace, ${EMOJI_FONTS}`,
  radius: { lg: '0.25rem', xl: '0.375rem', '2xl': '0.5rem' },
  shellPattern: [
    'radial-gradient(circle at 82% 18%, rgb(255 255 255 / 0.7), transparent 24%)',
    'repeating-linear-gradient(45deg, rgb(30 41 59 / 0.035) 0 2px, transparent 2px 12px)',
  ].join(', '),
  headerPattern: 'linear-gradient(180deg, #213d85, #121f42)',
  headerBorder: '4px solid #dc2626',
  decorOpacity: '0.35',
  decorAnimation: 'theme-float 9s ease-in-out infinite',
};

/** The green back of a mahjong tile, used as the block edge under cards and buttons. */
const TILE_BACK = '#1f7a4d';

/**
 * Mahjong parlour: a green-felt header with gold trim, ivory "tile" cards whose
 * solid green bottom edge looks like the back of a mahjong tile, Kai-style type.
 */
const MAHJONG: ThemeTokens = {
  ...CLASSIC,
  palettes: {
    slate: tw('stone'),
    blue: palette(
      '#effaf4 #d6f2e2 #ade3c6 #78cda3 #45b27d #23955f #177a4c #13613e #104d33 #0c3a27 #062316',
    ),
    yellow: tw('amber'),
    emerald: tw('teal'),
    female: tw('rose'),
  },
  surface: '#fffdf5',
  brand: '#0f5132',
  backdrop: '#052e1c',
  font: `"DFKai-SB", "BiauKai", "Kaiti TC", "STKaiti", ${SERIF_FONT}`,
  radius: { lg: '0.5rem', xl: '0.625rem', '2xl': '0.75rem' },
  shadow: {
    sm: `0 2px 0 0 ${TILE_BACK}`,
    DEFAULT: `0 3px 0 0 ${TILE_BACK}`,
    md: `0 4px 0 0 ${TILE_BACK}, 0 8px 14px -6px rgb(6 35 22 / 0.35)`,
    lg: `0 5px 0 0 ${TILE_BACK}, 0 12px 20px -8px rgb(6 35 22 / 0.35)`,
    xl: `0 6px 0 0 ${TILE_BACK}, 0 16px 28px -10px rgb(6 35 22 / 0.4)`,
    '2xl': `0 0 0 2px rgb(212 160 23 / 0.5), 0 8px 0 0 ${TILE_BACK}, 0 24px 48px -12px rgb(6 35 22 / 0.5)`,
  },
  shellPattern: [
    // Bamboo-mat slats with a green-felt glow creeping in from the edges.
    'radial-gradient(ellipse at center, transparent 60%, rgb(15 81 50 / 0.14) 100%)',
    'repeating-linear-gradient(90deg, rgb(120 90 40 / 0.05) 0 2px, transparent 2px 22px)',
  ].join(', '),
  headerPattern: [
    'radial-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1.5px) 0 0 / 4px 4px',
    'linear-gradient(180deg, #146c43, #0f5132)',
  ].join(', '),
  headerBorder: '4px solid #d4a017',
  headerTitleColor: '#fde68a',
  headerTitleShadow: '0 1px 0 #7f1d1d',
  decorOpacity: '0.7',
  decorAnimation: 'theme-float 7s ease-in-out infinite',
};

export const THEME_TOKENS: Record<ThemeId, ThemeTokens> = {
  default: CLASSIC,
  fairy: FAIRY,
  insurance: INSURANCE,
  tech: TECH,
  lawsuit: LAWSUIT,
  greek: GREEK,
  slacker: SLACKER,
  foodie: FOODIE,
  travel: TRAVEL,
  detective: DETECTIVE,
  mahjong: MAHJONG,
};

/** `#1a9f60` / `#fff` -> `26 159 96`, the channel format `rgb(var(--x) / <alpha-value>)` needs. */
export const hexToRgbChannels = (hex: string): string => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    throw new Error(`Not a hex colour: ${hex}`);
  }
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join('') : match[1];
  return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16)).join(' ');
};

export const colorVar = (family: ColorFamily | 'surface' | 'brand' | 'backdrop', shade?: Shade) =>
  shade === undefined ? `--c-${family}` : `--c-${family}-${shade}`;

const toCssDeclarations = (tokens: ThemeTokens): Record<string, string> => {
  const declarations: Record<string, string> = { 'color-scheme': tokens.colorScheme };

  for (const family of THEMED_COLOR_FAMILIES) {
    const source = tokens.palettes[family] ?? CLASSIC_PALETTES[family];
    for (const shade of SHADES) {
      declarations[colorVar(family, shade)] = hexToRgbChannels(source[shade]);
    }
  }
  declarations[colorVar('surface')] = hexToRgbChannels(tokens.surface);
  declarations[colorVar('brand')] = hexToRgbChannels(tokens.brand);
  declarations[colorVar('backdrop')] = hexToRgbChannels(tokens.backdrop);

  declarations['--font-theme'] = tokens.font;
  for (const size of RADIUS_SIZES) declarations[`--radius-${size}`] = tokens.radius[size];
  for (const size of SHADOW_SIZES) declarations[`--shadow-${size}`] = tokens.shadow[size];

  declarations['--shell-pattern'] = tokens.shellPattern;
  declarations['--header-pattern'] = tokens.headerPattern;
  declarations['--header-border'] = tokens.headerBorder;
  declarations['--header-title-color'] = tokens.headerTitleColor;
  declarations['--header-title-shadow'] = tokens.headerTitleShadow;
  declarations['--decor-opacity'] = tokens.decorOpacity;
  declarations['--decor-animation'] = tokens.decorAnimation;

  return declarations;
};

/**
 * CSS rule objects (Tailwind `addBase` format) declaring every theme's
 * variables. The classic theme is also the `:root` fallback, so the page is
 * fully styled even before a `data-theme` attribute is set.
 */
export const buildThemeStyles = (): Record<string, Record<string, string>> =>
  Object.fromEntries(
    (Object.keys(THEME_TOKENS) as ThemeId[]).map((id) => [
      id === 'default' ? `:root, [data-theme="${id}"]` : `[data-theme="${id}"]`,
      toCssDeclarations(THEME_TOKENS[id]),
    ]),
  );
