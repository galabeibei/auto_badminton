import React from 'react';
import { Clock } from 'lucide-react';
import type { Match } from '../../domain';
import { formatDurationMinutes } from '../../lib/formatTime';

interface MatchHistoryListProps {
  history: Match[];
}

/** Newest-first list of finished matches, shared by the Run screen's History modal and the final Stats screen. */
export const MatchHistoryList: React.FC<MatchHistoryListProps> = ({ history }) => {
  if (history.length === 0) {
    return <div className="text-center text-slate-400 py-12">尚無比賽紀錄</div>;
  }

  const reversed = [...history].reverse();

  return (
    <div className="space-y-3">
      {reversed.map((match, idx) => (
        <div
          key={match.id}
          className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 w-8">#{history.length - idx}</span>
            <div className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">S{match.sessionId + 1}</div>
            <div className="text-[10px] font-bold text-blue-500 whitespace-nowrap px-2 py-0.5 bg-blue-50 rounded-full">
              {match.modeLabel.split(' ')[1] || match.modeLabel}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-4 w-full max-w-2xl">
            <div className="flex flex-wrap gap-1 justify-end">
              {match.team1.players.map((p) => (
                <span key={p.id} className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {p.name}
                </span>
              ))}
            </div>
            <div className="font-mono font-bold text-slate-800 text-lg flex flex-col items-center min-w-[80px]">
              {match.team1.score !== undefined ? (
                <span>
                  {match.team1.score} : {match.team2.score}
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-sans">無紀錄</span>
              )}
              {match.startTime && match.endTime && (
                <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Clock size={10} />
                  {formatDurationMinutes((match.endTime - match.startTime) / 60000)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 justify-start">
              {match.team2.players.map((p) => (
                <span key={p.id} className="text-sm font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded">
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400 md:w-16 text-right shrink-0">場地 {match.courtId ?? '-'}</div>
        </div>
      ))}
    </div>
  );
};
