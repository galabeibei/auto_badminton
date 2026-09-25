/**
 * The user-facing catalogue of selectable themes: ids, names and the bits of
 * decoration that differ per theme. The actual colours, fonts, radii and
 * shadows live in `themeTokens.ts`, which is consumed at build time by
 * `tailwind.config.ts` (so this file stays free of any Tailwind import and is
 * cheap to ship in the app bundle). The per-theme wording lives in `copy.ts`.
 */

// Classic first, then by the stroke count of each theme name (筆劃).
export const THEME_IDS = [
  'default',
  'lawsuit',
  'foodie',
  'detective',
  'greek',
  'tech',
  'insurance',
  'travel',
  'mahjong',
  'fairy',
  'slacker',
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME_ID: ThemeId = 'default';

export interface ThemeDefinition {
  id: ThemeId;
  /** Name shown in the theme picker, e.g. "童話風". */
  label: string;
  /** One-line description shown under the name in the theme picker. */
  description: string;
  /** Small tag shown next to the app title in the header (omitted for the classic theme). */
  headerBadge?: string;
  /** Emoji badge pinned to the corner of the home screen's 🏸 medallion. */
  heroBadge?: string;
  /** Background ornaments scattered around the page edges, max 8. */
  decorations: readonly Ornament[];
}

/**
 * A page-edge ornament: an emoji / short text, a CSS-drawn toy brick in the given colour,
 * or a CSS-drawn mahjong tile showing `tile` in the `ink` colour.
 */
export type Ornament = string | { brick: string } | { tile: string; ink: string };

export const THEMES: readonly ThemeDefinition[] = [
  {
    id: 'default',
    label: '經典預設',
    description: '原本的清爽綠色球場風格',
    decorations: [],
  },
  {
    id: 'lawsuit',
    label: '打官司風',
    description: '木紋法庭、金色天秤，每場比賽都是一場訴訟',
    headerBadge: '⚖️ 本院依法審理',
    heroBadge: '⚖️',
    decorations: ['⚖️', '📜', '🔨', '🏛️'],
  },
  {
    id: 'foodie',
    label: '吃吃喝喝風',
    description: '番茄紅格子桌巾，打球就像吃一頓大餐',
    headerBadge: '🍽️ 今日營業中',
    heroBadge: '🍜',
    decorations: ['🍜', '🍰', '🥤', '🍗', '🍙', '🍩'],
  },
  {
    id: 'detective',
    label: '名偵探風',
    description: '深藍西裝配紅領結，用推理找出最佳對決',
    headerBadge: '🔍 真相只有一個',
    heroBadge: '🔍',
    decorations: ['🔍', '🕵️', '🧩', '📁', '⌚', '👓'],
  },
  {
    id: 'greek',
    label: '希臘神話風',
    description: '大理石白、愛琴海藍與黃金，眾神見證的競技',
    headerBadge: '🏛️ 奧林帕斯',
    heroBadge: '⚡',
    decorations: ['🏛️', '⚡', '🏺', '🦉', '🔱', '🌿'],
  },
  {
    id: 'tech',
    label: '科技風',
    description: '深色介面配霓虹青光，用語像在操作控制台',
    headerBadge: 'SYS ONLINE_',
    heroBadge: '🤖',
    decorations: ['🤖', '💾', '🛰️', '⚙️', '🔋', '📡'],
  },
  {
    id: 'insurance',
    label: '保險業務風',
    description: '沉穩海軍藍配金色，用語專業又貼心',
    headerBadge: '專業・誠信・保障',
    heroBadge: '🛡️',
    decorations: [],
  },
  {
    id: 'travel',
    label: '旅遊風',
    description: '晴空藍與陽光黃，每一場都是一段航程',
    headerBadge: '✈️ Bon Voyage',
    heroBadge: '✈️',
    decorations: ['🧳', '🗺️', '🏝️', '📸', '🌍', '✈️'],
  },
  {
    id: 'mahjong',
    label: '麻將大師風',
    description: '綠絨牌桌、象牙白牌面，每一局都要胡得漂亮',
    headerBadge: '🀄 雀神駕到',
    heroBadge: '🀄',
    decorations: [
      { tile: '中', ink: '#b91c1c' },
      '🀄',
      { tile: '發', ink: '#15803d' },
      '🎲',
      { tile: '東', ink: '#1e293b' },
      '🧧',
      { tile: '萬', ink: '#b91c1c' },
      { tile: '北', ink: '#1e293b' },
    ],
  },
  {
    id: 'fairy',
    label: '夢幻童話風',
    description: '公主、魔法與積木城堡，粉紫金邊的繪本王國',
    headerBadge: '✨ 積木魔法王國',
    heroBadge: '👑',
    decorations: [
      '🏰',
      { brick: '#f472b6' },
      '👑',
      { brick: '#60a5fa' },
      '🦄',
      { brick: '#fbbf24' },
      '🔮',
      { brick: '#34d399' },
    ],
  },
  {
    id: 'slacker',
    label: '廢材風',
    description: '灰撲撲、懶洋洋，連用語都提不起勁',
    headerBadge: '💤 能躺就不坐',
    heroBadge: '🦥',
    decorations: ['🛋️', '💤', '🥱', '🍜', '📺', '🦥'],
  },
];

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);

export const getTheme = (id: ThemeId): ThemeDefinition =>
  THEMES.find((theme) => theme.id === id) ?? THEMES[0];
