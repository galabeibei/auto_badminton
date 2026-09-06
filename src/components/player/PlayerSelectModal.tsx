import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Flag, RotateCw, Sparkles, User, X } from 'lucide-react';
import { Gender } from '../../domain';
import type { Player } from '../../domain';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  /** Players currently on a court. */
  activePlayerIds: Set<string>;
  /** Players already sitting in the manual queue. */
  manualQueuedIds: Set<string>;
  /** Players already sitting in a system suggestion. */
  systemQueuedIds: Set<string>;
  onConfirm: (selectedIds: string[]) => void;
}

interface PlayerStatus {
  label: string;
  colorClassName: string;
  bgClassName: string;
  borderClassName: string;
  icon: React.ReactNode;
}

export const PlayerSelectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  players,
  activePlayerIds,
  manualQueuedIds,
  systemQueuedIds,
  onConfirm,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((pid) => pid !== id));
    } else if (selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
  };

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

  // Free players first, then by "how busy" they are, then by MMR.
  const busyScore = (id: string) => {
    if (activePlayerIds.has(id)) return 3;
    if (manualQueuedIds.has(id)) return 2;
    if (systemQueuedIds.has(id)) return 1;
    return 0;
  };
  const sortedActivePlayers = [...players.filter((p) => p.isActive)].sort((a, b) => {
    const scoreDiff = busyScore(a.id) - busyScore(b.id);
    return scoreDiff !== 0 ? scoreDiff : b.mmr - a.mmr;
  });

  const handleConfirm = () => {
    if (selectedIds.length !== 4) return;
    onConfirm(selectedIds);
    setSelectedIds([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} maxWidthClassName="max-w-4xl" zIndex={150}>
      <div className="max-h-[85vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-lg text-slate-800">手動建立分組</h3>
            <p className="text-xs text-slate-500">可強制選擇任何上場或排程中的選手</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="關閉">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {selectedIds.length > 0 && selectedIds.length < 4 && (
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm flex items-center gap-2 border border-yellow-200 shadow-sm sticky top-0 z-10">
              <AlertCircle size={16} /> 請再選擇 {4 - selectedIds.length} 位選手
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {sortedActivePlayers.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const status = getStatus(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggleSelection(p.id)}
                  className={`relative flex items-center gap-2 p-2 rounded-lg border transition-all select-none cursor-pointer hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500' : 'border-slate-200'
                  } ${status ? status.bgClassName : 'bg-white'}`}
                >
                  <div
                    className={`p-1.5 rounded-full ${
                      p.gender === Gender.MALE ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                    }`}
                  >
                    <User size={12} />
                  </div>
                  <div className="flex flex-col overflow-hidden w-full">
                    <span className="font-bold text-sm truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-500 flex justify-between items-center">
                      <span>MMR: {Math.round(p.mmr)}</span>
                      {status && (
                        <span
                          className={`flex items-center gap-1 text-[9px] px-1 rounded border ${status.colorClassName} ${status.borderClassName} bg-white`}
                        >
                          {status.icon} {status.label}
                        </span>
                      )}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 text-blue-500">
                      <CheckCircle size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t bg-white rounded-b-2xl flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="text-sm text-slate-600">
            已選: <span className="font-bold text-blue-600 text-lg">{selectedIds.length}</span> / 4
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button disabled={selectedIds.length !== 4} onClick={handleConfirm}>
              建立分組
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
