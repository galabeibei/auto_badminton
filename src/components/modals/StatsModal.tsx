import React from 'react';
import { BarChart2, X } from 'lucide-react';
import type { Match, Player } from '../../domain';
import { getMatchPlayerIds } from '../../domain';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { PlayerStatsTable } from '../stats/PlayerStatsTable';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  activeMatches: Match[];
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, players, activeMatches }) => {
  const activePlayerIds = getMatchPlayerIds(activeMatches);

  // Fewest matches played first; among ties, players currently waiting off
  // court (rather than mid-game on a court) surface first since they're the
  // ones the organizer needs to place next.
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed;
    const aWaiting = !activePlayerIds.has(a.id);
    const bWaiting = !activePlayerIds.has(b.id);
    if (aWaiting !== bWaiting) return aWaiting ? -1 : 1;
    return b.mmr - a.mmr;
  });

  return (
    <Modal isOpen={isOpen} maxWidthClassName="max-w-7xl">
      <div className="p-6 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 /> 選手狀態統計
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="關閉">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <PlayerStatsTable players={sortedPlayers} allPlayers={players} variant="lobby" activePlayerIds={activePlayerIds} />
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>關閉</Button>
        </div>
      </div>
    </Modal>
  );
};
