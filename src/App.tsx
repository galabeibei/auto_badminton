import React from 'react';
import { History } from 'lucide-react';
import { AppStateProvider } from './state/AppStateProvider';
import { Stage } from './state/appState';
import { useAppState } from './hooks/useAppState';
import { usePersistedAppState } from './hooks/usePersistedAppState';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { HomeScreen } from './screens/HomeScreen';
import { CourtsScreen } from './screens/CourtsScreen';
import { ModeScreen } from './screens/ModeScreen';
import { StrategyScreen } from './screens/StrategyScreen';
import { PlayerListScreen } from './screens/PlayerListScreen';
import { RunScreen } from './screens/RunScreen/RunScreen';
import { StatsScreen } from './screens/StatsScreen';

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
  const { hasPendingRestore, restore, discard } = usePersistedAppState();

  const CurrentScreen = SCREEN_BY_STAGE[state.stage];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <header className="bg-badminton-green text-white py-4 shadow-md mb-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">🏸</div>
          <h1 className="text-xl font-bold tracking-wide">羽中遨翔</h1>
        </div>
      </header>

      <main className="container mx-auto px-4">{CurrentScreen ? <CurrentScreen /> : <div>Unknown Stage</div>}</main>

      <ConfirmModal
        isOpen={hasPendingRestore}
        icon={<History className="text-blue-500" />}
        title="回復上次的比賽紀錄？"
        accentBorderClassName="border-blue-500"
        description="偵測到瀏覽器中有尚未完成的比賽資料，是否要繼續上次的進度？"
        confirmLabel="回復進度"
        cancelLabel="不用，重新開始"
        onConfirm={restore}
        onCancel={discard}
      />
    </div>
  );
};

const App: React.FC = () => (
  <AppStateProvider>
    <AppShell />
  </AppStateProvider>
);

export default App;
