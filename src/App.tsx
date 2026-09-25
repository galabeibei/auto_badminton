import React from 'react';
import { History } from 'lucide-react';
import { AppStateProvider } from './state/AppStateProvider';
import { Stage } from './state/appState';
import { ThemeProvider } from './theme/ThemeProvider';
import { useAppState } from './hooks/useAppState';
import { useTheme } from './hooks/useTheme';
import { usePersistedAppState } from './hooks/usePersistedAppState';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { ThemeDecorations } from './components/theme/ThemeDecorations';
import { ThemePicker } from './components/theme/ThemePicker';
import { HomeScreen } from './screens/HomeScreen';
import { CourtsScreen } from './screens/CourtsScreen';
import { ModeScreen } from './screens/ModeScreen';
import { StrategyScreen } from './screens/StrategyScreen';
import { PlayerListScreen } from './screens/PlayerListScreen';
import { RunScreen } from './screens/RunScreen/RunScreen';
import { StatsScreen } from './screens/StatsScreen';
import { useCopy } from './hooks/useCopy';

const SCREEN_BY_STAGE: Record<Stage, React.ComponentType> = {
  [Stage.HOME]: HomeScreen,
  [Stage.COURTS]: CourtsScreen,
  [Stage.MODE]: ModeScreen,
  [Stage.STRATEGY]: StrategyScreen,
  [Stage.PLAYER_LIST]: PlayerListScreen,
  [Stage.RUN]: RunScreen,
  [Stage.STATS]: StatsScreen,
};

const AppShell: React.FC = () => {
  const { state } = useAppState();
  const { theme } = useTheme();
  const copy = useCopy();
  const { hasPendingRestore, restore, discard } = usePersistedAppState();

  const CurrentScreen = SCREEN_BY_STAGE[state.stage];

  return (
    // `isolate` gives ThemeDecorations' negative z-index a stacking context to sit in.
    <div className="theme-shell isolate min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <ThemeDecorations />
      <header className="theme-header bg-badminton-green text-white py-4 shadow-md mb-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">🏸</div>
          <h1 className="theme-title text-xl font-bold tracking-wide">羽中遨翔</h1>
          {theme.headerBadge && (
            <span className="hidden sm:inline-block ml-1 px-2 py-0.5 rounded-full border border-white/40 text-xs font-medium tracking-wider">
              {theme.headerBadge}
            </span>
          )}
          <ThemePicker />
        </div>
      </header>

      <main className="container mx-auto px-4">{CurrentScreen ? <CurrentScreen /> : <div>Unknown Stage</div>}</main>

      <ConfirmModal
        isOpen={hasPendingRestore}
        icon={<History className="text-blue-500" />}
        title={copy.app.restoreTitle}
        accentBorderClassName="border-blue-500"
        description={copy.app.restoreDescription}
        confirmLabel={copy.app.restoreConfirm}
        cancelLabel={copy.app.restoreCancel}
        onConfirm={restore}
        onCancel={discard}
      />
    </div>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  </ThemeProvider>
);

export default App;
