import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import type { Ornament } from '../../theme/themes';

type DecorSlot = React.CSSProperties & { '--decor-rotate': string };

/** Fixed spots around the page edges, so ornaments peek out beside the content rather than over it. */
const SLOTS: readonly DecorSlot[] = [
  { top: '14%', left: '1.5%', fontSize: '2.75rem', '--decor-rotate': '-12deg' },
  {
    top: '22%',
    right: '2%',
    fontSize: '2.25rem',
    '--decor-rotate': '10deg',
    animationDelay: '-2s',
  },
  { top: '50%', left: '0.5%', fontSize: '2rem', '--decor-rotate': '8deg', animationDelay: '-4s' },
  {
    top: '58%',
    right: '1%',
    fontSize: '2.75rem',
    '--decor-rotate': '-8deg',
    animationDelay: '-1s',
  },
  {
    bottom: '8%',
    left: '3%',
    fontSize: '2.25rem',
    '--decor-rotate': '14deg',
    animationDelay: '-3s',
  },
  {
    bottom: '5%',
    right: '4%',
    fontSize: '2.5rem',
    '--decor-rotate': '-14deg',
    animationDelay: '-5s',
  },
  { top: '33%', left: '3%', fontSize: '2rem', '--decor-rotate': '-6deg', animationDelay: '-2.5s' },
  {
    top: '40%',
    right: '3.5%',
    fontSize: '2.25rem',
    '--decor-rotate': '12deg',
    animationDelay: '-4.5s',
  },
];

const renderOrnament = (ornament: Ornament) => {
  if (typeof ornament === 'string') return ornament;
  if ('brick' in ornament) {
    return <span className="theme-brick" style={{ ['--brick' as string]: ornament.brick }} />;
  }
  return (
    <span className="theme-tile" style={{ ['--tile-ink' as string]: ornament.ink }}>
      {ornament.tile}
    </span>
  );
};

/**
 * Purely decorative background ornaments for the active theme (none for the
 * classic theme). Rendered at a negative z-index, so the app shell must be an
 * isolated stacking context for them to sit between its background and content.
 */
export const ThemeDecorations: React.FC = () => {
  const { theme } = useTheme();
  if (theme.decorations.length === 0) return null;

  return (
    <div aria-hidden="true">
      {theme.decorations.slice(0, SLOTS.length).map((ornament, i) => (
        <span key={`${theme.id}-${i}`} className="theme-decor -z-10" style={SLOTS[i]}>
          {renderOrnament(ornament)}
        </span>
      ))}
    </div>
  );
};
