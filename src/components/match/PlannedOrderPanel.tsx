import React from 'react';
import { ChevronDown, ChevronUp, ListOrdered, X } from 'lucide-react';
import type { Match, QueueSlot } from '../../domain';
import { MatchCard } from './MatchCard';

interface PlannedOrderPanelProps {
  /** Already resolved to Match objects, in plan order (see `domain/plannedOrder.ts`). */
  plannedMatches: Match[];
  /** The plan's front-of-line match that could take a court right now, if any. */
  nextPlayableId: string | null;
  selection: QueueSlot | null;
  onPlayerClick: (matchId: string, teamId: 'team1' | 'team2', index: number) => void;
  onPlayerLongPress: (matchId: string, teamId: 'team1' | 'team2', index: number) => void;
  onGoToCourt: (match: Match) => void;
  onRemove: (matchId: string) => void;
  onMove: (matchId: string, direction: 'up' | 'down') => void;
}

const POSITION_LABELS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
const positionLabel = (index: number) => POSITION_LABELS[index] ?? `#${index + 1}`;

/**
 * "預排上場順序": an explicit, user-built queue-ahead-of-the-queue. Lets an
 * admin decide several courts' worth of "who's next" in advance (typically
 * while every court is still busy) instead of re-scanning the manual/system
 * sections from scratch each time a court frees up. Matches added here are
 * rendered *only* here (see AssistQueuePanel/AutoQueuePanel filtering them
 * out of their normal sections) so nothing appears twice on screen.
 */
export const PlannedOrderPanel: React.FC<PlannedOrderPanelProps> = ({
  plannedMatches,
  nextPlayableId,
  selection,
  onPlayerClick,
  onPlayerLongPress,
  onGoToCourt,
  onRemove,
  onMove,
}) => {
  if (plannedMatches.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-slate-700 flex items-center gap-2">
        <ListOrdered size={18} className="text-emerald-600" /> 預排上場順序
        <span className="text-xs text-slate-400 font-normal">（場地一空出就依此順序上場）</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plannedMatches.map((m, index) => (
          <MatchCard
            key={m.id}
            match={m}
            accent="blue"
            headerLabel={`${positionLabel(index)} ${m.modeLabel}`}
            isRecommended={nextPlayableId === m.id}
            recommendedButtonLabel="立即上場"
            headerAction={
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onMove(m.id, 'up')}
                  disabled={index === 0}
                  className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 p-1"
                  aria-label="上移"
                  title="上移"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={() => onMove(m.id, 'down')}
                  disabled={index === plannedMatches.length - 1}
                  className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 p-1"
                  aria-label="下移"
                  title="下移"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  onClick={() => onRemove(m.id)}
                  className="text-slate-400 hover:text-red-500 p-1"
                  aria-label="從預排順序移除"
                  title="從預排順序移除"
                >
                  <X size={16} />
                </button>
              </div>
            }
            selection={selection}
            onPlayerClick={(teamId, idx) => onPlayerClick(m.id, teamId, idx)}
            onPlayerLongPress={(teamId, idx) => onPlayerLongPress(m.id, teamId, idx)}
            onGoToCourt={() => onGoToCourt(m)}
          />
        ))}
      </div>
    </div>
  );
};
