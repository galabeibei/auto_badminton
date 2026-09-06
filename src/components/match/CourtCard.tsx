import React from 'react';
import { Flag, HeartHandshake, LayoutGrid, RotateCcw, Slash } from 'lucide-react';
import type { Match } from '../../domain';
import { Button } from '../ui/Button';
import { PlayerIcon } from '../player/PlayerIcon';

interface CourtCardProps {
  courtId: number;
  match?: Match;
  onWinTeam1: () => void;
  onWinTeam2: () => void;
  onDraw: () => void;
  onReturnToQueue: () => void;
  onNoScore: () => void;
}

export const CourtCard: React.FC<CourtCardProps> = ({
  courtId,
  match,
  onWinTeam1,
  onWinTeam2,
  onDraw,
  onReturnToQueue,
  onNoScore,
}) => {
  return (
    <div
      className={`rounded-xl border-2 transition-all overflow-hidden ${
        match ? 'bg-white border-blue-500 shadow-md' : 'bg-slate-50 border-dashed border-slate-300'
      }`}
    >
      <div className={`p-3 flex justify-between items-center ${match ? 'bg-blue-500 text-white' : 'text-slate-400 bg-slate-100'}`}>
        <span className="font-bold flex items-center gap-2">
          <Flag size={18} /> 場地 {courtId}
        </span>
        {match && <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono">S{match.sessionId + 1}</span>}
      </div>

      <div className="p-4 min-h-[160px] flex flex-col justify-center items-center">
        {match ? (
          <div className="w-full space-y-4">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 flex flex-col gap-2">
                {match.team1.players.map((p) => (
                  <PlayerIcon key={p.id} player={p} />
                ))}
                <Button onClick={onWinTeam1} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm mt-1">
                  勝
                </Button>
              </div>
              <div className="flex flex-col items-center gap-2 pt-8">
                <div className="text-slate-300 italic font-black text-xl">VS</div>
                <Button onClick={onDraw} variant="secondary" size="sm" className="text-xs px-2 h-8 text-slate-500" title="平手">
                  <HeartHandshake size={16} className="mr-1 inline" />
                  平手
                </Button>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                {match.team2.players.map((p) => (
                  <PlayerIcon key={p.id} player={p} />
                ))}
                <Button onClick={onWinTeam2} className="bg-red-500 hover:bg-red-600 text-white shadow-sm mt-1">
                  勝
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 mt-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200"
                  onClick={onReturnToQueue}
                  title="回到預備分組"
                >
                  <RotateCcw size={14} className="inline mr-1" /> 重排
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200"
                  onClick={onNoScore}
                >
                  <Slash size={14} className="inline mr-1" /> 不計分
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-400 gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-300">
              <LayoutGrid size={24} />
            </div>
            <span>等待安排...</span>
          </div>
        )}
      </div>
    </div>
  );
};
