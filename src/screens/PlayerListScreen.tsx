import React, { useState } from 'react';
import {
  AlertTriangle,
  FileText,
  Link as LinkIcon,
  PauseCircle,
  PlayCircle,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { Gender, convertGoogleSheetUrlToCsv, createPlayer, generateTestPlayers, parsePlayerCSV } from '../domain';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ScrollPicker } from '../components/ui/ScrollPicker';
import { MessageModal } from '../components/ui/MessageModal';
import type { MessageType } from '../components/ui/MessageModal';
import { useAppState } from '../hooks/useAppState';
import { Stage } from '../state/appState';

type ImportMode = 'text' | 'file' | 'url';

export const PlayerListScreen: React.FC = () => {
  const { state, dispatch } = useAppState();
  const { players, courtCount, hasGameStarted } = state;

  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<Gender>(Gender.MALE);
  const [newMMR, setNewMMR] = useState('1200');

  const [showImport, setShowImport] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('text');
  const [csvText, setCsvText] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const [testCount, setTestCount] = useState(courtCount * 7);

  const [messageData, setMessageData] = useState<{ title: string; content: string; type: MessageType } | null>(null);
  const showMessage = (title: string, content: string, type: MessageType = 'info') =>
    setMessageData({ title, content, type });

  const addPlayer = () => {
    if (!newName.trim()) {
      showMessage('輸入錯誤', '請輸入選手姓名', 'warning');
      return;
    }
    const mmrVal = parseInt(newMMR, 10);
    if (isNaN(mmrVal) || mmrVal < 0 || mmrVal > 5000) {
      showMessage('輸入錯誤', '請輸入合理的積分 (0 - 5000)', 'warning');
      return;
    }

    const player = createPlayer({ name: newName.trim(), gender: newGender, mmr: mmrVal });
    dispatch({ type: 'PLAYERS_ADDED', players: [player] });
    setNewName('');
  };

  const removePlayer = (id: string) => dispatch({ type: 'PLAYER_REMOVED', playerId: id });
  const toggleActive = (id: string) => dispatch({ type: 'PLAYER_ACTIVE_TOGGLED', playerId: id });

  const generateTestPlayersHandler = () => {
    dispatch({ type: 'PLAYERS_ADDED', players: generateTestPlayers(testCount, players) });
  };

  const processCSV = (content: string) => {
    const { players: newPlayers, errors } = parsePlayerCSV(content);

    if (newPlayers.length > 0) {
      dispatch({ type: 'PLAYERS_ADDED', players: newPlayers });
      if (errors.length > 0) {
        setImportErrors(errors);
      } else {
        setCsvText('');
        setSheetUrl('');
        setShowImport(false);
        setImportErrors([]);
        showMessage('匯入成功', `成功匯入 ${newPlayers.length} 位選手！`, 'success');
      }
    } else {
      setImportErrors(errors.length > 0 ? errors : ['未找到有效的選手資料']);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) processCSV(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleUrlImport = async () => {
    setImportErrors([]);
    setIsFetching(true);

    const csvUrl = convertGoogleSheetUrlToCsv(sheetUrl);
    if (!csvUrl) {
      setImportErrors(['無法辨識此 Google Spreadsheet 連結。請確保連結包含 "/edit" 或為發布連結。']);
      setIsFetching(false);
      return;
    }

    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const text = await response.text();
      processCSV(text);
    } catch {
      setImportErrors(['下載資料失敗。請確保您的 Google Sheet 權限設定為「任何知道連結的使用者」皆可檢視。']);
    } finally {
      setIsFetching(false);
    }
  };

  const activeCount = players.filter((p) => p.isActive).length;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100">
      <MessageModal isOpen={!!messageData} onClose={() => setMessageData(null)} title={messageData?.title || ''} type={messageData?.type}>
        {messageData?.content}
      </MessageModal>

      <div className="flex items-center gap-3 mb-6 border-b pb-4">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
          <Users size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Step 3: 選手名單</h2>
          <p className="text-slate-500 text-sm">輸入參與比賽的選手資料 (最少 4 人)</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="flex-1">
          <Input label="姓名" placeholder="姓名" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPlayer()} />
        </div>
        <div className="w-32">
          <label className="text-sm font-medium text-slate-700 mb-1 block">性別</label>
          <select
            className="w-full bg-white text-slate-900 border border-slate-300 rounded-md px-3 py-2 h-[42px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newGender}
            onChange={(e) => setNewGender(e.target.value as Gender)}
          >
            <option value={Gender.MALE}>男</option>
            <option value={Gender.FEMALE}>女</option>
          </select>
        </div>
        <div className="w-32">
          <Input
            label="積分"
            type="number"
            placeholder="1200"
            value={newMMR}
            onChange={(e) => setNewMMR(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            min={0}
            max={5000}
          />
        </div>
        <div className="pb-[1px]">
          <Button onClick={addPlayer}>新增</Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-slate-600 font-medium flex gap-4">
          <span>總人數: {players.length}</span>
          <span className="text-green-600">上場: {activeCount}</span>
          <span className="text-slate-400">休息: {players.length - activeCount}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-purple-50 rounded-md border border-purple-100 overflow-hidden">
            <ScrollPicker min={4} max={Math.max(100, courtCount * 10)} value={testCount} onChange={setTestCount} height={40} />
            <button
              type="button"
              onClick={generateTestPlayersHandler}
              className="text-purple-600 text-sm hover:bg-purple-100 transition-colors font-medium px-3 py-1.5 border-l border-purple-200 flex items-center gap-1"
            >
              <Sparkles size={14} /> 產生測試選手
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowImport(!showImport)}
            className="text-blue-600 text-sm hover:underline flex items-center gap-1 font-medium bg-blue-50 px-3 py-2 rounded-lg"
          >
            <Upload size={14} /> 批量匯入
          </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-slate-50 p-6 rounded-xl mb-6 border-2 border-slate-200">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Upload size={18} /> 批量匯入選手
          </h3>

          <div className="flex gap-2 mb-4 border-b border-slate-200 pb-1">
            {(
              [
                { mode: 'text' as const, label: '文字貼上', icon: FileText },
                { mode: 'file' as const, label: '上傳 CSV', icon: Upload },
                { mode: 'url' as const, label: 'Google Sheet', icon: LinkIcon },
              ]
            ).map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  importMode === mode ? 'bg-white text-blue-600 border-x border-t border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setImportMode(mode)}
              >
                <Icon size={14} className="inline mr-1" /> {label}
              </button>
            ))}
          </div>

          <div className="bg-white p-4 rounded-b-lg rounded-tr-lg border border-slate-200 min-h-[160px]">
            {importMode === 'text' && (
              <>
                <p className="text-xs text-slate-500 mb-2">請貼上格式為「名稱, 性別(選填), 積分(選填)」的文字，每行一位。</p>
                <textarea
                  className="w-full h-32 p-3 text-sm border rounded-md mb-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 text-slate-900 font-mono"
                  placeholder={`範例：\n王小明, 男, 1200\n李小美, 女, 1150\n張三`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => processCSV(csvText)}>
                    解析並匯入
                  </Button>
                </div>
              </>
            )}

            {importMode === 'file' && (
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors relative">
                <Upload size={32} className="text-slate-400 mb-2" />
                <p className="text-sm text-slate-500 font-medium">點擊選擇 .csv 檔案</p>
                <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
              </div>
            )}

            {importMode === 'url' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">請貼上 Google Spreadsheet 連結。請確保該試算表權限已開啟「知道連結的使用者」皆可檢視。</p>
                  <Input placeholder="https://docs.google.com/spreadsheets/d/..." value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleUrlImport} disabled={isFetching}>
                    {isFetching ? '下載中...' : '下載並匯入'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {importErrors.length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 max-h-[150px] overflow-y-auto">
              <h4 className="text-red-700 font-bold text-sm flex items-center gap-1 mb-2">
                <AlertTriangle size={14} /> 匯入報告
              </h4>
              <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                {importErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowImport(false);
                setImportErrors([]);
              }}
            >
              關閉視窗
            </Button>
          </div>
        </div>
      )}

      <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden max-h-[400px] overflow-y-auto mb-8">
        {players.length === 0 ? (
          <div className="p-8 text-center text-slate-400">尚無選手資料</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 font-medium border-b">
              <tr>
                <th className="p-3 w-1/4">名稱</th>
                <th className="p-3 w-16">性別</th>
                <th className="p-3 w-20">積分</th>
                <th className="p-3 w-32 text-center">狀態</th>
                <th className="p-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {players.map((p) => (
                <tr key={p.id} className={`hover:bg-white transition-colors ${!p.isActive ? 'bg-slate-100 opacity-60' : ''}`}>
                  <td className="p-3 font-medium text-slate-800">{p.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${p.gender === Gender.MALE ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {p.gender}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">{p.mmr}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleActive(p.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                        p.isActive ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : 'bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      {p.isActive ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                      {p.isActive ? '準備上場' : '休息中'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button type="button" onClick={() => removePlayer(p.id)} className="text-slate-400 hover:text-red-500 transition-colors" aria-label={`移除 ${p.name}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={() => dispatch({ type: 'STAGE_CHANGED', stage: Stage.STRATEGY })}
          disabled={hasGameStarted}
          title={hasGameStarted ? '比賽進行中，若需更改設定請先結束比賽' : undefined}
        >
          回上一步
        </Button>
        <Button size="lg" disabled={activeCount < 4} onClick={() => dispatch({ type: 'GAME_STARTED', now: Date.now() })}>
          {hasGameStarted ? '完成編輯 (回大廳)' : '下一步 (開始打球)'}
        </Button>
      </div>
    </div>
  );
};
