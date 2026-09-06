import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ScrollPicker } from '../components/ui/ScrollPicker';
import { useAppState } from '../hooks/useAppState';
import { Stage } from '../state/appState';

export const CourtsScreen: React.FC = () => {
  const { state, dispatch } = useAppState();

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-xl shadow-lg border border-slate-100 text-center">
      <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
        <MapPin size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Step 1: 設定場地數量</h2>
      <p className="text-slate-500 mb-8">請選擇今天的羽球場地數量</p>

      <div className="flex justify-center mb-12">
        <ScrollPicker
          min={1}
          max={50}
          value={state.courtCount}
          onChange={(count) => dispatch({ type: 'COURT_COUNT_CHANGED', count })}
          height={200}
        />
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="secondary" onClick={() => dispatch({ type: 'STAGE_CHANGED', stage: Stage.HOME })}>
          回首頁
        </Button>
        <Button size="lg" onClick={() => dispatch({ type: 'STAGE_CHANGED', stage: Stage.MODE })}>
          下一步 (選擇模式)
        </Button>
      </div>
    </div>
  );
};
