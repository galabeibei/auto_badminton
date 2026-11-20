import React, { useState } from 'react';
import { BarChart2, CheckSquare, Copy, History } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MessageModal } from '../components/ui/MessageModal';
import type { MessageType } from '../components/ui/MessageModal';
import { PlayerStatsTable } from '../components/stats/PlayerStatsTable';
import { MatchHistoryList } from '../components/stats/MatchHistoryList';
import { useAppState } from '../hooks/useAppState';
import { useCopy } from '../hooks/useCopy';

export const StatsScreen: React.FC = () => {
  const { state, dispatch } = useAppState();
  const copy = useCopy();
  const [messageData, setMessageData] = useState<{ title: string; content: React.ReactNode; type: MessageType } | null>(null);

  const sortedPlayers = [...state.players].sort((a, b) => b.mmr - a.mmr);

  const handleSimpleCopy = async () => {
    const text = sortedPlayers.map((p) => `${p.name}, ${p.gender}, ${Math.round(p.mmr)}`).join('\n');
    try {
      // Throws outright when the page isn't a secure context (a phone on
      // http://192.168.x.x, say) and rejects when the browser denies access -
      // either way the user must not be told it worked.
      await navigator.clipboard.writeText(text);
      setMessageData({
        title: '複製成功',
        content: '已複製選手資料！\n\n您可以將資料貼在任何地方，或在下一次比賽時於 Stage 3 使用「批量匯入」直接貼上恢復積分。',
        type: 'success',
      });
    } catch {
      setMessageData({
        title: '無法自動複製',
        content: (
          <>
            這個瀏覽器不允許自動複製（常見於非 HTTPS 連線）。請選取下方的資料手動複製：
            <textarea
              readOnly
              value={text}
              aria-label="選手資料"
              onFocus={(e) => e.currentTarget.select()}
              className="mt-3 w-full h-40 p-2 text-left text-xs font-mono bg-slate-50 text-slate-700 border border-slate-200 rounded"
            />
          </>
        ),
        type: 'warning',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100 space-y-8">
      <MessageModal isOpen={!!messageData} onClose={() => setMessageData(null)} title={messageData?.title || ''} type={messageData?.type}>
        {messageData?.content}
      </MessageModal>

      <div className="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="text-blue-500" /> {copy.stats.title}
          </h2>
          <p className="text-slate-500">{copy.stats.subtitle}</p>
        </div>
        <Button variant="outline" onClick={handleSimpleCopy}>
          <Copy size={16} className="mr-2 inline" /> {copy.stats.copy}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <PlayerStatsTable players={sortedPlayers} allPlayers={state.players} variant="final" />
      </div>

      <div className="pt-8 border-t">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <History className="text-slate-500" /> {copy.stats.history}
        </h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <MatchHistoryList history={state.history} />
        </div>
      </div>

      <div className="mt-8 flex justify-center border-t pt-8">
        <Button type="button" onClick={() => dispatch({ type: 'GAME_RESET' })} variant="danger" size="lg">
          <CheckSquare size={16} className="mr-2 inline" /> {copy.stats.done}
        </Button>
      </div>
    </div>
  );
};
