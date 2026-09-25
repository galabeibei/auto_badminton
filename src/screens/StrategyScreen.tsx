import React from 'react';
import { ArrowRight, Bot, BrainCircuit, HelpingHand } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SystemStrategy } from '../domain';
import { Button } from '../components/ui/Button';
import { useAppState } from '../hooks/useAppState';
import { Stage } from '../state/appState';
import { useCopy } from '../hooks/useCopy';

/**
 * Every class string below is written out in full (rather than built with a
 * template literal like `border-${color}-500`) so Tailwind's content scanner
 * can find them at build time - a dynamically interpolated class name is
 * invisible to a real production build and would silently render unstyled.
 */
interface StrategyColorClasses {
  selectedCard: string;
  selectedIcon: string;
  selectedTitle: string;
  selectedSubtitle: string;
  selectedBadge: string;
}

const STRATEGY_COLORS: Record<'orange' | 'blue', StrategyColorClasses> = {
  orange: {
    selectedCard: 'border-orange-500 bg-orange-50 ring-2 ring-orange-200',
    selectedIcon: 'bg-orange-500 text-white',
    selectedTitle: 'text-orange-800',
    selectedSubtitle: 'text-orange-600',
    selectedBadge: 'text-orange-500',
  },
  blue: {
    selectedCard: 'border-blue-500 bg-blue-50 ring-2 ring-blue-200',
    selectedIcon: 'bg-blue-500 text-white',
    selectedTitle: 'text-blue-800',
    selectedSubtitle: 'text-blue-600',
    selectedBadge: 'text-blue-500',
  },
};

const CheckBadge: React.FC = () => (
  <div className="bg-white rounded-full p-1 shadow-sm">
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </div>
);

interface StrategyCardProps {
  isSelected: boolean;
  colors: StrategyColorClasses;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ isSelected, colors, title, subtitle, description, icon: Icon, onClick }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer p-6 rounded-xl border-2 transition-all flex flex-col gap-4 relative group ${
      isSelected ? colors.selectedCard : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
    }`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSelected ? colors.selectedIcon : 'bg-slate-200 text-slate-500'}`}>
        <Icon size={28} />
      </div>
      <div>
        <h3 className={`font-bold text-xl ${isSelected ? colors.selectedTitle : 'text-slate-800'}`}>{title}</h3>
        <p className={`text-sm font-medium ${isSelected ? colors.selectedSubtitle : 'text-slate-500'}`}>{subtitle}</p>
      </div>
    </div>

    <div className="text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-4">{description}</div>

    {isSelected && (
      <div className={`absolute top-4 right-4 ${colors.selectedBadge}`}>
        <CheckBadge />
      </div>
    )}
  </div>
);

export const StrategyScreen: React.FC = () => {
  const { state, dispatch } = useAppState();
  const copy = useCopy();
  const setStrategy = (strategy: SystemStrategy) => dispatch({ type: 'STRATEGY_CHANGED', strategy });

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
          <BrainCircuit size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{copy.strategy.title}</h2>
          <p className="text-slate-500 text-sm">{copy.strategy.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StrategyCard
          isSelected={state.strategy === SystemStrategy.ASSIST}
          colors={STRATEGY_COLORS.orange}
          title={copy.strategy.assistTitle}
          subtitle={copy.strategy.assistSubtitle}
          icon={HelpingHand}
          description={copy.strategy.assistDescription}
          onClick={() => setStrategy(SystemStrategy.ASSIST)}
        />
        <StrategyCard
          isSelected={state.strategy === SystemStrategy.AUTO}
          colors={STRATEGY_COLORS.blue}
          title={copy.strategy.autoTitle}
          subtitle={copy.strategy.autoSubtitle}
          icon={Bot}
          description={copy.strategy.autoDescription}
          onClick={() => setStrategy(SystemStrategy.AUTO)}
        />
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => dispatch({ type: 'STAGE_CHANGED', stage: Stage.MODE })}>
          {copy.steps.back}
        </Button>
        <Button size="lg" onClick={() => dispatch({ type: 'STAGE_CHANGED', stage: Stage.PLAYER_LIST })} className="flex items-center gap-2">
          {copy.strategy.next} <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
};
