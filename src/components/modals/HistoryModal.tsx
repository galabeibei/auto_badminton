import React from 'react';
import { History, X } from 'lucide-react';
import type { Match } from '../../domain';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { MatchHistoryList } from '../stats/MatchHistoryList';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: Match[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history }) => {
  return (
    <Modal isOpen={isOpen} maxWidthClassName="max-w-4xl">
      <div className="p-6 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <History /> 比賽歷史紀錄
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="關閉">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg p-4">
          <MatchHistoryList history={history} />
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>關閉</Button>
        </div>
      </div>
    </Modal>
  );
};
