import React, { useState } from 'react';
import { Check, Palette, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useTheme } from '../../hooks/useTheme';
import { getCopy } from '../../theme/copy';
import { THEMES } from '../../theme/themes';
import type { ThemeDefinition } from '../../theme/themes';

/**
 * A self-contained miniature of the app chrome. It carries its own
 * `data-theme`, so the CSS variables inside it resolve to *that* theme's
 * values - the preview is rendered by the real theme styles rather than by a
 * separately maintained list of swatch colours. It also samples the theme's
 * own wording, since the themes differ in tone as well as colour.
 */
const ThemePreview: React.FC<{ theme: ThemeDefinition }> = ({ theme }) => {
  const copy = getCopy(theme.id);

  return (
    <div
      data-theme={theme.id}
      className="theme-shell bg-slate-50 font-sans rounded-xl overflow-hidden"
    >
      <div className="theme-header bg-badminton-green px-3 py-2 flex items-center gap-2">
        <span className="text-sm select-none">🏸</span>
        <span className="theme-title font-bold text-sm truncate">{theme.label}</span>
      </div>
      <div className="p-3">
        <div className="bg-white rounded-xl shadow-md p-3 border border-slate-100">
          <p className="text-xs text-slate-500 leading-snug min-h-[2.5em]">{theme.description}</p>
          {/* A sample of the theme's wording next to its colours. */}
          <p className="text-xs font-bold text-slate-700 mt-2 truncate">{copy.lobby.title}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white text-xs font-bold">
              {copy.home.start}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-red-500 text-white text-xs font-bold">
              {copy.lobby.finish}
            </span>
            <span className="ml-auto text-lg leading-none select-none shrink-0">
              {theme.heroBadge ?? '🏸'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Header button that opens the theme gallery; picking a theme applies it immediately. */
export const ThemePicker: React.FC = () => {
  const { theme: activeTheme, setThemeId } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 px-3 py-1.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/70"
        aria-label={`主題選擇（目前：${activeTheme.label}）`}
      >
        <Palette size={16} />
        <span className="hidden sm:inline">主題：{activeTheme.label}</span>
      </button>

      <Modal isOpen={isOpen} maxWidthClassName="max-w-3xl" zIndex={140}>
        <div className="p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Palette className="text-blue-600" size={20} />
              主題選擇
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="關閉"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">點選即可立即套用，選擇會記在這台裝置上。</p>

          <div
            role="radiogroup"
            aria-label="主題"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {THEMES.map((theme) => {
              const isActive = theme.id === activeTheme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-label={theme.label}
                  onClick={() => {
                    // Picking a theme applies it and takes the user straight back to the page.
                    setThemeId(theme.id);
                    setIsOpen(false);
                  }}
                  className={`relative text-left rounded-2xl p-1 border-2 transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <ThemePreview theme={theme} />
                  {isActive && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
};
