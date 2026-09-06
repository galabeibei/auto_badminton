import React from 'react';
import { Coffee, Users } from 'lucide-react';
import type { Player } from '../../domain';
import { formatDurationMinutes } from '../../lib/formatTime';

interface WaitingListProps {
  players: Player[];
}

/** Assist mode only: shows who's waiting and in what order, with elapsed time since their last match. */
export const WaitingList: React.FC<WaitingListProps> = ({ players }) => {
  return (
    <div className="space-y-3 pt-4 border-t border-slate-200">
      <h3 className="font-bold text-slate-600 flex items-center gap-2">
        <Coffee size={20} className="text-slate-400" /> 候位 ({players.length})
      </h3>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto">
        {players.length === 0 ? (
          <div className="text-slate-400 text-sm">全員皆在場上或已排程</div>
        ) : (
          <div className="flex gap-4 min-w-max">
            {players.map((p, idx) => (
              <div key={p.id} className="flex flex-col items-center gap-2 w-20 group relative">
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 z-10 border-2 border-white shadow-sm">
                  {idx + 1}
                </div>
                <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-500 shadow-sm group-hover:border-blue-300 transition-colors">
                  <Users size={20} />
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm text-slate-700 truncate w-20">{p.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {p.lastMatchEndTime > 0 ? `${formatDurationMinutes((Date.now() - p.lastMatchEndTime) / 60000)}前` : '尚未上場'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
