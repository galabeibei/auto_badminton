import React from 'react';
import type { Player } from '../../domain';
import { formatDurationMinutes } from '../../lib/formatTime';
import { formatRelationStats } from '../../lib/formatRelationStats';

interface PlayerStatsTableProps {
  /** Already sorted by the caller (both original screens sort by MMR descending). */
  players: Player[];
  allPlayers: Player[];
  /** "lobby" (mid-game stats modal: adds a 上場中/休息 status column) or
   * "final" (end-of-game screen: adds rank + net MMR change + total points). */
  variant: 'lobby' | 'final';
}

const winRate = (p: Player) => (p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0);

export const PlayerStatsTable: React.FC<PlayerStatsTableProps> = ({ players, allPlayers, variant }) => {
  const isFinal = variant === 'final';

  return (
    <table className="w-full text-left text-sm whitespace-nowrap">
      <thead className="bg-slate-100 text-slate-600 font-medium border-b sticky top-0 z-10">
        <tr>
          {isFinal && <th className="p-3 bg-slate-100">排名</th>}
          <th className="p-3 bg-slate-100">姓名</th>
          <th className="p-3 bg-slate-100">{isFinal ? '最終積分' : '積分'}</th>
          {!isFinal && <th className="p-3 bg-slate-100">狀態</th>}
          {isFinal && <th className="p-3 bg-slate-100">勝 / 負</th>}
          {!isFinal && <th className="p-3 bg-slate-100">場次</th>}
          {isFinal && <th className="p-3 bg-slate-100">勝率</th>}
          {isFinal && <th className="p-3 bg-slate-100">總得分</th>}
          {isFinal && <th className="p-3 bg-slate-100">場次</th>}
          <th className="p-3 bg-slate-100">總時數</th>
          <th className="p-3 bg-slate-100">總等待</th>
          <th className="p-3 bg-slate-100">最長等待</th>
          {!isFinal && <th className="p-3 bg-slate-100">勝/負</th>}
          {!isFinal && <th className="p-3 bg-slate-100">勝率</th>}
          <th className="p-3 bg-slate-100 min-w-[200px]">同隊次數</th>
          <th className="p-3 bg-slate-100 min-w-[200px]">對戰次數</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {players.map((p, index) => (
          <tr key={p.id} className="hover:bg-slate-50">
            {isFinal && <td className="p-3 font-mono text-slate-500">#{index + 1}</td>}
            <td className="p-3 font-bold text-slate-800">{p.name}</td>
            <td className="p-3">
              {isFinal ? (
                <>
                  <span className={`font-mono font-bold ${p.mmr >= p.initialMmr ? 'text-green-600' : 'text-red-500'}`}>
                    {Math.round(p.mmr)}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">
                    ({p.mmr - p.initialMmr >= 0 ? '+' : ''}
                    {Math.round(p.mmr - p.initialMmr)})
                  </span>
                </>
              ) : (
                <span className="font-mono text-blue-600">{Math.round(p.mmr)}</span>
              )}
            </td>
            {!isFinal && (
              <td className="p-3">
                {p.isActive ? (
                  <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full">上場中</span>
                ) : (
                  <span className="text-slate-400 text-xs bg-slate-100 px-2 py-0.5 rounded-full">休息</span>
                )}
              </td>
            )}
            {isFinal && (
              <td className="p-3">
                <span className="text-green-600 font-bold">{p.wins}</span> / <span className="text-red-500 font-bold">{p.losses}</span>
              </td>
            )}
            {!isFinal && <td className="p-3 font-bold text-slate-600">{p.matchesPlayed}</td>}
            {isFinal && <td className="p-3">{winRate(p)}%</td>}
            {isFinal && <td className="p-3">{p.totalPoints}</td>}
            {isFinal && <td className="p-3">{p.matchesPlayed}</td>}
            <td className="p-3 font-mono text-slate-600">{formatDurationMinutes(p.totalMinutes)}</td>
            <td className="p-3 font-mono text-slate-500">{formatDurationMinutes(p.totalWaitTime / 60000)}</td>
            <td className="p-3 font-mono text-slate-500">{formatDurationMinutes(p.maxWaitTime / 60000)}</td>
            {!isFinal && (
              <td className="p-3">
                <span className="text-green-600">{p.wins}</span> / <span className="text-red-500">{p.losses}</span>
              </td>
            )}
            {!isFinal && <td className="p-3">{winRate(p)}%</td>}
            <td className="p-3 text-xs text-slate-500 leading-relaxed">{formatRelationStats(p.partners, allPlayers)}</td>
            <td className="p-3 text-xs text-slate-500 leading-relaxed">{formatRelationStats(p.opponents, allPlayers)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
