import React from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { getAvailablePlayersSorted } from '../../domain';
import type { Match } from '../../domain';
import { MatchCard } from '../../components/match/MatchCard';
import { PlanToggleButton } from '../../components/match/PlanToggleButton';
import { WaitingList } from '../../components/match/WaitingList';
import { useAppState } from '../../hooks/useAppState';
import { useAssistQueueEngine } from '../../hooks/useAssistQueueEngine';
import type { QueuePanelProps } from './RunScreen';

/** Assist mode's queue area: manual groupings (plain), a single system suggestion with "换一组", and the waiting list. */
export const AssistQueuePanel: React.FC<QueuePanelProps> = ({
  selection,
  onPlayerClick,
  onPlayerLongPress,
  onGoToCourt,
  onDeleteManualMatch,
  plannedIds,
  onTogglePlanned,
  showMessage,
}) => {
  const { state } = useAppState();
  const { refreshSuggestion } = useAssistQueueEngine();

  // Matches pinned into the pre-arranged order panel are rendered only there.
  const manualQueue = state.queue.filter((m) => m.isManual && !plannedIds.has(m.id));
  const systemQueue = state.queue.filter((m) => !m.isManual && !plannedIds.has(m.id));
  const availablePlayers = getAvailablePlayersSorted(state.players, state.activeMatches, state.queue);

  const handleRefresh = (match: Match) => {
    if (!refreshSuggestion(match)) {
      showMessage('無法刷新', '目前候位人數不足以產生其他組合。', 'warning');
    }
  };

  return (
    <>
      {manualQueue.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <div className="w-2 h-6 bg-purple-500 rounded-full" /> 預備分組 (優先上場)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {manualQueue.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                accent="purple"
                plainLabel
                headerLabel="Manual Match"
                headerAction={
                  <div className="flex items-center gap-1">
                    <PlanToggleButton onClick={() => onTogglePlanned(m.id)} />
                    <button onClick={() => onDeleteManualMatch(m.id)} className="text-slate-400 hover:text-red-500 p-1" aria-label="刪除此分組">
                      <Trash2 size={16} />
                    </button>
                  </div>
                }
                selection={selection}
                onPlayerClick={(teamId, index) => onPlayerClick(m.id, teamId, index)}
                onPlayerLongPress={(teamId, index) => onPlayerLongPress(m.id, teamId, index)}
                onGoToCourt={() => onGoToCourt(m)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <div className="w-2 h-6 bg-orange-500 rounded-full" /> 系統建議對戰
        </h3>

        {systemQueue.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            {availablePlayers.length < 4 ? '候位人數不足 4 人，無法產生建議。' : '計算最佳對戰組合中...'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemQueue.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                accent="orange"
                headerLabel={m.modeLabel}
                headerAction={
                  <div className="flex items-center gap-1">
                    <PlanToggleButton onClick={() => onTogglePlanned(m.id)} />
                    <button
                      onClick={() => handleRefresh(m)}
                      className="text-slate-400 hover:text-orange-600 flex items-center gap-1 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                      title="保留第一順位(錨點)，更換其他對手"
                    >
                      <RefreshCw size={14} /> 換一組
                    </button>
                  </div>
                }
                selection={selection}
                onPlayerClick={(teamId, index) => onPlayerClick(m.id, teamId, index)}
                onPlayerLongPress={(teamId, index) => onPlayerLongPress(m.id, teamId, index)}
                onGoToCourt={() => onGoToCourt(m)}
              />
            ))}
          </div>
        )}
      </div>

      <WaitingList players={availablePlayers} />
    </>
  );
};
