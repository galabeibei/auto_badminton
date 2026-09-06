import React from 'react';
import { Pin } from 'lucide-react';

interface PlanToggleButtonProps {
  onClick: () => void;
}

/** "加入預排上場順序" - pins a queued match into the PlannedOrderPanel. */
export const PlanToggleButton: React.FC<PlanToggleButtonProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1 rounded transition-colors"
    aria-label="加入預排上場順序"
    title="加入預排上場順序"
  >
    <Pin size={14} />
  </button>
);
