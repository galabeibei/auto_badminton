import React from 'react';
import { BarChart2, X } from 'lucide-react';
import type { Player } from '../../domain';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { PlayerStatsTable } from '../stats/PlayerStatsTable';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, players }) => {
  const sortedPlayers = [...players].sort((a, b) => b.mmr - a.mmr);

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
          <PlayerStatsTable players={sortedPlayers} allPlayers={players} variant="lobby" />
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>關閉</Button>
        </div>
      </div>
    </Modal>
  );
};
