import React, { useState } from 'react';
import { BarChart2, Bot, HelpingHand, History, PlusCircle, UserCog, Volume2, VolumeX } from 'lucide-react';
import { getAvailablePlayersSorted, getMatchPlayerIds, getNextPlayablePlannedMatchId, getPlannedMatches, SystemStrategy } from '../../domain';
import type { Match, MatchOutcome, QueueSlot } from '../../domain';
import { Button } from '../../components/ui/Button';
import { MessageModal } from '../../components/ui/MessageModal';
import type { MessageType } from '../../components/ui/MessageModal';
import { CourtGrid } from '../../components/match/CourtGrid';
import { PlannedOrderPanel } from '../../components/match/PlannedOrderPanel';
import { PlayerSelectModal } from '../../components/player/PlayerSelectModal';
import { PlayerReplaceModal } from '../../components/player/PlayerReplaceModal';
import { PlayerActionSheet } from '../../components/modals/PlayerActionSheet';
import { StatsModal } from '../../components/modals/StatsModal';
import { HistoryModal } from '../../components/modals/HistoryModal';
import { ResultModal } from '../../components/modals/ResultModal';
import { NoScoreConfirmModal } from '../../components/modals/NoScoreConfirmModal';
import { FinishConfirmModal } from '../../components/modals/FinishConfirmModal';
import { useAppState } from '../../hooks/useAppState';
import { useRunLobbyActions } from '../../hooks/useRunLobbyActions';
import type { MatchResultSummary } from '../../hooks/useRunLobbyActions';
import { Stage } from '../../state/appState';
import { AssistQueuePanel } from './AssistQueuePanel';
import { AutoQueuePanel } from './AutoQueuePanel';

export interface QueuePanelProps {
  selection: QueueSlot | null;
  onPlayerClick: (matchId: string, teamId: 'team1' | 'team2', index: number) => void;
  onPlayerLongPress: (matchId: string, teamId: 'team1' | 'team2', index: number) => void;
  onGoToCourt: (match: Match) => void;
  onDeleteManualMatch: (matchId: string) => void;
  /** Ids currently pinned into the pre-arranged order panel - these are excluded from the panel's own sections. */
  plannedIds: Set<string>;
  onTogglePlanned: (matchId: string) => void;
  showMessage: (title: string, content: React.ReactNode, type?: MessageType) => void;
}

export const RunScreen: React.FC = () => {
  const { state, dispatch } = useAppState();
  const lobby = useRunLobbyActions();

  const [selection, setSelection] = useState<QueueSlot | null>(null);
  const [actionSheetTarget, setActionSheetTarget] = useState<QueueSlot | null>(null);
  const [replaceModalTarget, setReplaceModalTarget] = useState<QueueSlot | null>(null);
  const [resultModal, setResultModal] = useState<MatchResultSummary | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [noScoreModal, setNoScoreModal] = useState<Match | null>(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [messageData, setMessageData] = useState<{ title: string; content: React.ReactNode; type: MessageType } | null>(null);

  const showMessage = (title: string, content: React.ReactNode, type: MessageType = 'info') =>
    setMessageData({ title, content, type });

  const isAssist = state.strategy === SystemStrategy.ASSIST;
  const manualQueue = state.queue.filter((m) => m.isManual);
  const systemQueue = state.queue.filter((m) => !m.isManual);

  const activePlayerIds = getMatchPlayerIds(state.activeMatches);
  const manualQueuedIds = getMatchPlayerIds(manualQueue);
  const systemQueuedIds = getMatchPlayerIds(systemQueue);

  const handlePlayerClick = (matchId: string, teamId: 'team1' | 'team2', index: number) => {
    const slot: QueueSlot = { matchId, teamId, index };
    if (!selection) {
      setSelection(slot);
      return;
    }
    if (selection.matchId === matchId && selection.teamId === teamId && selection.index === index) {
      setSelection(null);
      return;
    }

    const result = lobby.trySwapPlayers(selection, slot, { allowCrossSession: isAssist });
    if (!result.ok) {
      if (result.reason === 'CROSS_SESSION') {
        showMessage('無法交換', '自動模式下，為確保輪次公平性，無法跨 Session 交換選手。', 'warning');
      } else {
        showMessage('無法交換', '這會導致同一場比賽出現重複選手！', 'error');
      }
    }
    setSelection(null);
  };

  const handlePlayerLongPress = (matchId: string, teamId: 'team1' | 'team2', index: number) => {
    setActionSheetTarget({ matchId, teamId, index });
  };

  const handleActionSheetSwap = () => {
    if (!actionSheetTarget) return;
    const { matchId, teamId, index } = actionSheetTarget;
    setActionSheetTarget(null);
    // Reuses the exact same select/complete-swap logic a plain click uses.
    handlePlayerClick(matchId, teamId, index);
  };

  const handleActionSheetModify = () => {
    setReplaceModalTarget(actionSheetTarget);
    setActionSheetTarget(null);
  };

  const findPlayerAtSlot = (slot: QueueSlot) => {
    const match = state.queue.find((m) => m.id === slot.matchId);
    return match?.[slot.teamId].players[slot.index] ?? null;
  };

  const handleReplaceConfirm = (replacementId: string) => {
    if (!replaceModalTarget) return;
    const result = lobby.replacePlayer(replaceModalTarget, replacementId);
    if (!result.ok) {
      showMessage('無法替換', '這會導致同一場比賽出現重複選手！', 'error');
    }
    setReplaceModalTarget(null);
  };

  const handleGoToCourt = (match: Match) => {
    const result = lobby.goToCourt(match);
    if (!result.ok) {
      if (result.reason === 'NO_COURT') {
        showMessage('目前無空場', '請等待有場地空出後再安排上場。', 'warning');
      } else {
        const names = result.conflictingPlayerIds
          .map((id) => state.players.find((p) => p.id === id)?.name ?? '未知')
          .join(', ');
        showMessage('無法上場', `衝突選手: ${names}`, 'error');
      }
    }
  };

  const handleMatchOver = (match: Match, outcome: MatchOutcome) => {
    setResultModal(lobby.matchOver(match, outcome));
  };

  const handleConfirmNoScore = () => {
    if (!noScoreModal) return;
    lobby.confirmNoScore(noScoreModal);
    setNoScoreModal(null);
  };

  const handleManualGroupConfirm = (selectedIds: string[]) => {
    lobby.addManualMatch(selectedIds);
    showMessage('手動分組成功', '已建立分組，請在手動分組區查看。', 'success');
  };

  const unfinishedCount = state.activeMatches.length + state.queue.length;

  const plannedIds = new Set(state.plannedOrder);
  const plannedMatches = getPlannedMatches(state.plannedOrder, state.queue);
  const nextPlayablePlannedId = getNextPlayablePlannedMatchId(
    state.plannedOrder,
    state.queue,
    state.activeMatches,
    state.courtCount,
  );

  const panelProps: QueuePanelProps = {
    selection,
    onPlayerClick: handlePlayerClick,
    onPlayerLongPress: handlePlayerLongPress,
    onGoToCourt: handleGoToCourt,
    onDeleteManualMatch: lobby.deleteManualMatch,
    plannedIds,
    onTogglePlanned: lobby.togglePlanned,
    showMessage,
  };

  const actionSheetPlayer = actionSheetTarget ? findPlayerAtSlot(actionSheetTarget) : null;
  const replaceTargetPlayer = replaceModalTarget ? findPlayerAtSlot(replaceModalTarget) : null;
  const replaceTargetMatch = replaceModalTarget
    ? state.queue.find((m) => m.id === replaceModalTarget.matchId)
    : undefined;
  const replaceDisabledIds = new Set(replaceTargetMatch ? getMatchPlayerIds([replaceTargetMatch]) : []);
  if (replaceTargetPlayer) replaceDisabledIds.delete(replaceTargetPlayer.id);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <MessageModal isOpen={!!messageData} onClose={() => setMessageData(null)} title={messageData?.title || ''} type={messageData?.type}>
        {messageData?.content}
      </MessageModal>
      <PlayerSelectModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        players={state.players}
        activePlayerIds={activePlayerIds}
        manualQueuedIds={manualQueuedIds}
        systemQueuedIds={systemQueuedIds}
        onConfirm={handleManualGroupConfirm}
      />
      <PlayerActionSheet
        isOpen={!!actionSheetTarget}
        playerName={actionSheetPlayer?.name ?? ''}
        onModify={handleActionSheetModify}
        onSwap={handleActionSheetSwap}
        onCancel={() => setActionSheetTarget(null)}
      />
      <PlayerReplaceModal
        isOpen={!!replaceModalTarget}
        onClose={() => setReplaceModalTarget(null)}
        currentPlayer={replaceTargetPlayer}
        players={state.players}
        disabledIds={replaceDisabledIds}
        activePlayerIds={activePlayerIds}
        manualQueuedIds={manualQueuedIds}
        systemQueuedIds={systemQueuedIds}
        onConfirm={handleReplaceConfirm}
      />
      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} players={state.players} />
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} history={state.history} />
      <NoScoreConfirmModal isOpen={!!noScoreModal} onConfirm={handleConfirmNoScore} onCancel={() => setNoScoreModal(null)} />
      <FinishConfirmModal
        isOpen={showFinishModal}
        unfinishedCount={unfinishedCount}
        onConfirm={() => dispatch({ type: 'GAME_FINISHED' })}
        onCancel={() => setShowFinishModal(false)}
      />
      <ResultModal result={resultModal} onClose={() => setResultModal(null)} />

      <div
        className={`flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4 border-l-8 ${
          isAssist ? 'border-l-orange-500' : 'border-l-blue-500'
        }`}
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">🏆 比賽大廳</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            {isAssist ? (
              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                <HelpingHand size={12} /> 輔助模式
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                <Bot size={12} /> 自動模式
              </span>
            )}
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>場地: {state.courtCount}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>進行中: {state.activeMatches.length}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            {isAssist ? (
              <span>候位: {getAvailablePlayersSorted(state.players, state.activeMatches, state.queue).length}</span>
            ) : (
              <span>總人數: {state.players.length}</span>
            )}
          </div>
        </div>
        <div className="flex gap-3 flex-wrap justify-center items-center">
          <Button variant="outline" onClick={() => dispatch({ type: 'STAGE_CHANGED', stage: Stage.PLAYER_LIST })} className="flex items-center gap-2">
            <UserCog size={18} /> 調整名單
          </Button>
          <Button onClick={() => setShowManualModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md flex items-center gap-2">
            <PlusCircle size={18} /> 手動分組
          </Button>
          <div className="w-[1px] h-8 bg-slate-200 mx-1 hidden md:block" />
          <Button
            variant="outline"
            onClick={lobby.toggleSound}
            className={`flex items-center gap-2 ${lobby.isSoundEnabled ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-slate-400'}`}
          >
            {lobby.isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </Button>
          <Button variant="secondary" onClick={() => setShowHistory(true)}>
            <History size={16} />
          </Button>
          <Button variant="secondary" onClick={() => setShowStats(true)}>
            <BarChart2 size={16} />
          </Button>
          <Button variant="danger" onClick={() => setShowFinishModal(true)}>
            結算
          </Button>
        </div>
      </div>

      <CourtGrid
        courtCount={state.courtCount}
        activeMatches={state.activeMatches}
        onWinTeam1={(m) => handleMatchOver(m, 'team1')}
        onWinTeam2={(m) => handleMatchOver(m, 'team2')}
        onDraw={(m) => handleMatchOver(m, 'draw')}
        onReturnToQueue={lobby.returnToQueue}
        onNoScore={setNoScoreModal}
      />

      <PlannedOrderPanel
        plannedMatches={plannedMatches}
        nextPlayableId={nextPlayablePlannedId}
        selection={selection}
        onPlayerClick={handlePlayerClick}
        onPlayerLongPress={handlePlayerLongPress}
        onGoToCourt={handleGoToCourt}
        onRemove={lobby.togglePlanned}
        onMove={lobby.movePlanned}
      />

      {isAssist ? <AssistQueuePanel {...panelProps} /> : <AutoQueuePanel {...panelProps} />}
    </div>
  );
};
