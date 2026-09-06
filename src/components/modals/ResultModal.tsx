import React from 'react';
import { CheckCircle, ChevronRight } from 'lucide-react';
import type { MatchResultChange } from '../../domain';
import type { MatchResultSummary } from '../../hooks/useRunLobbyActions';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface ResultModalProps {
  result: MatchResultSummary | null;
  onClose: () => void;
}

const TeamChangeList: React.FC<{ label: string; score: number; changes: MatchResultChange[] }> = ({
  label,
  score,
  changes,
}) => (
  <div className="bg-slate-50 p-4 rounded-xl">
    <div className="text-xs font-bold text-slate-400 mb-2 uppercase">
      {label} ({score})
    </div>
    {changes.map((c) => (
      <div key={c.playerId} className="flex justify-between items-center py-1">
        <span className="font-medium text-slate-700">{c.name}</span>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-400">{Math.round(c.oldMMR)}</span>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="font-bold text-slate-800">{Math.round(c.newMMR)}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              c.newMMR >= c.oldMMR ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {c.newMMR >= c.oldMMR ? '+' : ''}
            {Math.round(c.newMMR - c.oldMMR)}
          </span>
        </div>
      </div>
    ))}
  </div>
);

export const ResultModal: React.FC<ResultModalProps> = ({ result, onClose }) => {
  if (!result) return null;

  const team1Ids = new Set(result.match.team1.players.map((p) => p.id));
  const team1Changes = result.changes.filter((c) => team1Ids.has(c.playerId));
  const team2Changes = result.changes.filter((c) => !team1Ids.has(c.playerId));

  return (
    <Modal isOpen maxWidthClassName="max-w-lg" zIndex={110}>
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">比賽結束</h3>
          <p className="text-slate-500 text-sm">積分已更新</p>
        </div>
        <div className="space-y-4 mb-8">
          <TeamChangeList label="Team 1" score={result.score1} changes={team1Changes} />
          <TeamChangeList label="Team 2" score={result.score2} changes={team2Changes} />
        </div>
        <Button variant="secondary" className="w-full" onClick={onClose}>
          確認
        </Button>
      </div>
    </Modal>
  );
};
