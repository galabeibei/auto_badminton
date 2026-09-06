import React from 'react';
import { PlayCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAppState } from '../hooks/useAppState';
import { Stage } from '../state/appState';

export const HomeScreen: React.FC = () => {
  const { dispatch } = useAppState();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="bg-gradient-to-br from-badminton-green to-emerald-400 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl mb-8 transform hover:scale-105 transition-transform">
        <span className="text-6xl select-none">🏸</span>
      </div>

      <h1 className="text-5xl font-black text-slate-800 mb-4 tracking-tight">羽中遨翔</h1>

      <p className="text-xl text-slate-500 mb-12 max-w-lg leading-relaxed">
        羽球排點系統。自動平衡實力、記錄戰績，讓每一次揮拍都充滿樂趣！
      </p>

      <Button
        size="lg"
        className="text-xl px-12 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 flex items-center gap-3"
        onClick={() => dispatch({ type: 'STAGE_CHANGED', stage: Stage.COURTS })}
      >
        <PlayCircle size={28} />
        打球啦
      </Button>
    </div>
  );
};
