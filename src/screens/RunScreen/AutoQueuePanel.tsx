import React, { useMemo } from 'react';
import { AlertCircle, Bot, Layers, Trash2, Zap } from 'lucide-react';
import { getNextPlayablePlannedMatchId } from '../../domain';
import type { Match } from '../../domain';
import { Button } from '../../components/ui/Button';
import { MatchCard } from '../../components/match/MatchCard';
import { PlanToggleButton } from '../../components/match/PlanToggleButton';
import { useAppState } from '../../hooks/useAppState';
import { useAutoQueueEngine } from '../../hooks/useAutoQueueEngine';
import type { QueuePanelProps } from './RunScreen';

/** Auto mode's queue area: manual groupings + session-grouped system suggestions, both highlighting the recommended match. */
export const AutoQueuePanel: React.FC<QueuePanelProps> = ({
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
  const { recommendedMatchId, autoAdjust } = useAutoQueueEngine({
    onStaleMatchesRemoved: () =>
      showMessage(
        '排程自動更新',
        '偵測到選手名單變更（有人休息或移除），系統已自動清除無效賽程。缺額將由系統依據等待順序自動遞補。',
        'warning',
      ),
  });

  // Matches pinned into the pre-arranged order panel are rendered only there.
  const manualQueue = state.queue.filter((m) => m.isManual && !plannedIds.has(m.id));
  const systemQueue = state.queue.filter((m) => !m.isManual && !plannedIds.has(m.id));
  const activePlayerCount = state.players.filter((p) => p.isActive).length;

  const nextPlayablePlannedId = getNextPlayablePlannedMatchId(
    state.plannedOrder,
    state.queue,
    state.activeMatches,
    state.courtCount,
  );

  const groupedBySession = useMemo(() => {
    const groups: Record<number, Match[]> = {};
    systemQueue.forEach((m) => {
      if (!groups[m.sessionId]) groups[m.sessionId] = [];
      groups[m.sessionId].push(m);
    });
    return groups;
  }, [systemQueue]);

  const sortedSessionIds = Object.keys(groupedBySession)
    .map(Number)
    .sort((a, b) => a - b);

  const handleAutoAdjust = () => {
    const swapCount = autoAdjust();
    if (swapCount > 0) {
      showMessage('微調完成', `已替換 ${swapCount} 名場上選手，請安排上場。`, 'success');
    } else {
      showMessage('無法微調', '找不到合適且無衝突的替補選手 (避免重複排點)。請等待場上比賽結束。', 'warning');
    }
  };

  // No need to nudge the admin toward auto-adjust if they've already got a
  // ready-to-go match waiting at the front of their own pre-arranged plan.
  const showAdjustBanner =
    !recommendedMatchId && !nextPlayablePlannedId && state.queue.length > 0 && state.activeMatches.length < state.courtCount;

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
                isRecommended={recommendedMatchId === m.id}
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

      <div className="space-y-6">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <div className="w-2 h-6 bg-blue-500 rounded-full" /> 系統建議對戰
          <span className="text-xs text-slate-400 font-normal ml-2">(自動模式: 預先排程)</span>
        </h3>

        {systemQueue.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400 flex flex-col items-center gap-2">
            {activePlayerCount < 4 ? (
              '候位人數不足 4 人，無法產生建議。'
            ) : (
              <>
                <Bot size={24} className="text-slate-300" />
                <span>計算最佳對戰組合中...</span>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {showAdjustBanner && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-yellow-800">
                  <AlertCircle className="shrink-0" />
                  <div>
                    <p className="font-bold text-sm">所有分組均有球員仍在場上</p>
                    <p className="text-xs text-yellow-700">您可以等待場上比賽結束，或讓系統微調分組以立即開始。</p>
                  </div>
                </div>
                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white border-none shadow-sm whitespace-nowrap" onClick={handleAutoAdjust}>
                  <Zap size={16} className="mr-1 inline" /> 系統自動微調
                </Button>
              </div>
            )}

            {sortedSessionIds.map((sessionId) => (
              <div key={sessionId} className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400 border-b border-slate-200 pb-2">
                  <Layers size={16} />
                  <span className="text-sm font-bold uppercase tracking-wider">Session {sessionId + 1}</span>
                  <span className="text-xs font-normal bg-slate-100 px-2 py-0.5 rounded-full">{groupedBySession[sessionId][0].modeLabel}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedBySession[sessionId].map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      accent="blue"
                      headerLabel={m.modeLabel}
                      headerAction={<PlanToggleButton onClick={() => onTogglePlanned(m.id)} />}
                      isRecommended={recommendedMatchId === m.id}
                      selection={selection}
                      onPlayerClick={(teamId, index) => onPlayerClick(m.id, teamId, index)}
                      onPlayerLongPress={(teamId, index) => onPlayerLongPress(m.id, teamId, index)}
                      onGoToCourt={() => onGoToCourt(m)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
