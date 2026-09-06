import React from 'react';
import { User } from 'lucide-react';
import { Gender } from '../../domain';
import type { Player } from '../../domain';
import { useLongPress } from '../../hooks/useLongPress';

interface PlayerIconProps {
  player: Player;
  isSelected?: boolean;
  onClick?: () => void;
  /** Press-and-hold (works for mouse and touch) - opens the modify/swap action menu. */
  onLongPress?: () => void;
}

export const PlayerIcon: React.FC<PlayerIconProps> = ({ player, isSelected, onClick, onLongPress }) => {
  const longPress = useLongPress({
    onClick: () => onClick?.(),
    onLongPress: () => onLongPress?.(),
  });

  return (
    <div
      {...longPress}
      className={`flex items-center gap-2 bg-white border rounded-md p-2 shadow-sm text-sm select-none cursor-pointer transition-all w-full ${
        isSelected
          ? 'ring-2 ring-yellow-400 bg-yellow-50 border-yellow-400 scale-105 z-10'
          : 'hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div
        className={`p-1 rounded-full shrink-0 ${
          player.gender === Gender.MALE ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
        }`}
      >
        <User size={14} />
      </div>
      <div className="flex flex-col leading-tight overflow-hidden">
        <span className="font-semibold text-slate-800 truncate">{player.name}</span>
        <span className="text-xs text-slate-500 truncate">MMR: {Math.round(player.mmr)}</span>
      </div>
    </div>
  );
};
