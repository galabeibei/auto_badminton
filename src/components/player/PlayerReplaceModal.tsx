import React from 'react';
import { Flag, RotateCw, Sparkles, User, X } from 'lucide-react';
import { Gender } from '../../domain';
import type { Player } from '../../domain';
import { Modal } from '../ui/Modal';

interface PlayerReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The player currently occupying the slot (shown for context, excluded from the pick list). */
  currentPlayer: Player | null;
  players: Player[];
  /** The other 3 players already in this same match - picking one would duplicate them, so they're disabled. */
  disabledIds: Set<string>;
  activePlayerIds: Set<string>;
  manualQueuedIds: Set<string>;
  systemQueuedIds: Set<string>;
  onConfirm: (playerId: string) => void;
}

interface PlayerStatus {
  label: string;
  colorClassName: string;
  bgClassName: string;
  borderClassName: string;
  icon: React.ReactNode;
}

/**
 * Single-select roster picker for the "修改" (replace) action: pick any
 * player to drop into a specific slot of an existing queued match. Unlike
 * manual grouping, this always acts on exactly one slot and applies
 * immediately on click - there's nothing to "confirm" beyond the pick itself.
 */
export const PlayerReplaceModal: React.FC<PlayerReplaceModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  players,
  disabledIds,
  activePlayerIds,
  manualQueuedIds,
  systemQueuedIds,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const getStatus = (id: string): PlayerStatus | null => {
    if (activePlayerIds.has(id)) {
      return { label: '場上', colorClassName: 'text-blue-500', bgClassName: 'bg-blue-50', borderClassName: 'border-blue-200', icon: <Flag size={10} /> };
    }
    if (manualQueuedIds.has(id)) {
      return { label: '已排', colorClassName: 'text-purple-500', bgClassName: 'bg-purple-50', borderClassName: 'border-purple-200', icon: <RotateCw size={10} /> };
    }
    if (systemQueuedIds.has(id)) {
      return { label: '建議', colorClassName: 'text-emerald-500', bgClassName: 'bg-emerald-50', borderClassName: 'border-emerald-200', icon: <Sparkles size={10} /> };
    }
    return null;
  };

  const candidates = players
    .filter((p) => p.isActive && p.id !== currentPlayer?.id)
    .sort((a, b) => b.mmr - a.mmr);

  return (
    <Modal isOpen={isOpen} maxWidthClassName="max-w-4xl" zIndex={165}>
      <div className="max-h-[85vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-lg text-slate-800">選擇替換選手</h3>
            <p className="text-xs text-slate-500">
              {currentPlayer ? `將取代「${currentPlayer.name}」的位置` : '選擇要填入這個位置的選手'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="關閉">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {candidates.map((p) => {
              const isDisabled = disabledIds.has(p.id);
              const status = getStatus(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => !isDisabled && onConfirm(p.id)}
                  className={`relative flex items-center gap-2 p-2 rounded-lg border transition-all select-none ${
                    isDisabled
                      ? 'opacity-40 cursor-not-allowed border-slate-200 bg-white'
                      : `cursor-pointer hover:shadow-md hover:border-blue-300 border-slate-200 ${status ? status.bgClassName : 'bg-white'}`
                  }`}
                  title={isDisabled ? '已經在這場比賽中' : undefined}
                >
                  <div
                    className={`p-1.5 rounded-full ${p.gender === Gender.MALE ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}
                  >
                    <User size={12} />
                  </div>
                  <div className="flex flex-col overflow-hidden w-full">
                    <span className="font-bold text-sm truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-500 flex justify-between items-center">
                      <span>MMR: {Math.round(p.mmr)}</span>
                      {status && !isDisabled && (
                        <span className={`flex items-center gap-1 text-[9px] px-1 rounded border ${status.colorClassName} ${status.borderClassName} bg-white`}>
                          {status.icon} {status.label}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
