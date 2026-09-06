import React from 'react';
import { Scale, Settings, Shuffle, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MatchMode } from '../domain';
import { Button } from '../components/ui/Button';
import { useAppState } from '../hooks/useAppState';
import { Stage } from '../state/appState';

interface ModeCardProps {
  isSelected: boolean;
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

const ModeCard: React.FC<ModeCardProps> = ({ isSelected, title, description, icon: Icon, onClick }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer p-6 rounded-xl border-2 transition-all flex flex-col gap-3 relative ${
      isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
    }`}
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
      <Icon size={20} />
    </div>
    <div>
      <h3 className={`font-bold text-lg ${isSelected ? 'text-blue-800' : 'text-slate-800'}`}>{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
    {isSelected && <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />}
  </div>
);

export const ModeScreen: React.FC = () => {
  const { state, dispatch } = useAppState();
  const setMode = (mode: MatchMode) => dispatch({ type: 'MODE_CHANGED', mode });

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Step 2-1: 選擇對戰模式</h2>
          <p className="text-slate-500 text-sm">選擇系統自動分組的邏輯</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <ModeCard
          isSelected={state.mode === MatchMode.SIMILAR}
          title="A. 相近模式"
          description="選擇積分相近的選手對戰，打造勢均力敵的比賽。"
          icon={Users}
          onClick={() => setMode(MatchMode.SIMILAR)}
        />
        <ModeCard
          isSelected={state.mode === MatchMode.BALANCED}
          title="B. 平衡模式"
          description="高分帶低分，確保兩隊總積分接近。"
          icon={Scale}
          onClick={() => setMode(MatchMode.BALANCED)}
        />
        <ModeCard
          isSelected={state.mode === MatchMode.MIXED}
          title="C. 混合模式"
          description="相近與平衡交替進行，依目前場次數自動平衡兩者比例。"
          icon={Shuffle}
          onClick={() => setMode(MatchMode.MIXED)}
        />
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => dispatch({ type: 'STAGE_CHANGED', stage: Stage.COURTS })}>
          回上一步
        </Button>
        <Button size="lg" onClick={() => dispatch({ type: 'STAGE_CHANGED', stage: Stage.STRATEGY })}>
          下一步 (選擇策略)
        </Button>
      </div>
    </div>
  );
};
