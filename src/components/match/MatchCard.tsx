import React from 'react';
import { Sparkles } from 'lucide-react';
import type { Match, QueueSlot } from '../../domain';
import { Button } from '../ui/Button';
import { PlayerIcon } from '../player/PlayerIcon';

export type MatchCardAccent = 'purple' | 'orange' | 'blue';

interface AccentClasses {
  cardBorder: string;
  labelText: string;
  labelBg: string;
  button: string;
}

const ACCENT_CLASSES: Record<MatchCardAccent, AccentClasses> = {
  purple: {
    cardBorder: 'border-purple-200',
    labelText: 'text-purple-600',
    labelBg: 'bg-purple-50',
    button: 'bg-purple-600 hover:bg-purple-700',
  },
  orange: {
    cardBorder: 'border-orange-200',
    labelText: 'text-orange-600',
    labelBg: 'bg-orange-50',
    button: 'bg-orange-600 hover:bg-orange-700',
  },
  blue: {
    cardBorder: 'border-blue-200 hover:border-blue-300',
    labelText: 'text-blue-600',
    labelBg: 'bg-blue-50',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
};

const RECOMMENDED_CLASSES: AccentClasses = {
  cardBorder: 'border-emerald-500 ring-2 ring-emerald-500 shadow-lg scale-[1.02] z-10',
  labelText: 'text-emerald-700',
  labelBg: 'bg-emerald-50',
  button: 'bg-emerald-600 hover:bg-emerald-700',
};

interface MatchCardProps {
  match: Match;
  accent: MatchCardAccent;
  /** Text/content shown top-left, e.g. "Manual Match" or the mode label. */
  headerLabel: React.ReactNode;
  /** Optional control shown top-right (delete button, "換一組" refresh button, ...). */
  headerAction?: React.ReactNode;
  /** Auto mode only: highlights this card as the one to send to a court next. */
  isRecommended?: boolean;
  recommendedButtonLabel?: string;
  /** Manual groupings show their header as plain uppercase text instead of a coloured pill. */
  plainLabel?: boolean;
  selection: QueueSlot | null;
  onPlayerClick: (teamId: 'team1' | 'team2', index: number) => void;
  /** Press-and-hold on a player - opens the modify/swap action menu for that slot. */
  onPlayerLongPress: (teamId: 'team1' | 'team2', index: number) => void;
  onGoToCourt: () => void;
}

/**
 * A single queued match: two teams of PlayerIcons plus a "go to court"
 * action. Shared by manual groupings, Assist's single suggestion, and Auto's
 * session-grouped suggestions - only the accent colour, header content and
 * "recommended" highlight differ between them.
 */
export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  accent,
  headerLabel,
  headerAction,
  isRecommended = false,
  recommendedButtonLabel = '立即上場',
  plainLabel = false,
  selection,
  onPlayerClick,
  onPlayerLongPress,
  onGoToCourt,
}) => {
  const classes = isRecommended ? RECOMMENDED_CLASSES : ACCENT_CLASSES[accent];

  return (
    <div
      className={`relative bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3 transition-all duration-300 ${classes.cardBorder}`}
    >
      {isRecommended && (
        <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1 animate-bounce">
          <Sparkles size={12} /> 推薦上場
        </div>
      )}

      <div className="flex justify-between items-center text-xs">
        {plainLabel ? (
          <span className={`font-bold uppercase tracking-wider ${classes.labelText}`}>{headerLabel}</span>
        ) : (
          <span className={`font-bold px-2 py-0.5 rounded ${classes.labelText} ${classes.labelBg}`}>{headerLabel}</span>
        )}
        {headerAction}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex flex-col gap-1">
          {match.team1.players.map((p, idx) => (
            <PlayerIcon
              key={p.id}
              player={p}
              isSelected={selection?.matchId === match.id && selection?.teamId === 'team1' && selection?.index === idx}
              onClick={() => onPlayerClick('team1', idx)}
              onLongPress={() => onPlayerLongPress('team1', idx)}
            />
          ))}
        </div>
        <div className="font-black text-slate-200">VS</div>
        <div className="flex-1 flex flex-col gap-1">
          {match.team2.players.map((p, idx) => (
            <PlayerIcon
              key={p.id}
              player={p}
              isSelected={selection?.matchId === match.id && selection?.teamId === 'team2' && selection?.index === idx}
              onClick={() => onPlayerClick('team2', idx)}
              onLongPress={() => onPlayerLongPress('team2', idx)}
            />
          ))}
        </div>
      </div>

      <Button onClick={onGoToCourt} className={`w-full text-white ${classes.button}`}>
        {isRecommended ? recommendedButtonLabel : '上場'}
      </Button>
    </div>
  );
};
