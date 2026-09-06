import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';

interface NoScoreConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const NoScoreConfirmModal: React.FC<NoScoreConfirmModalProps> = ({ isOpen, onConfirm, onCancel }) => (
  <ConfirmModal
    isOpen={isOpen}
    icon={<AlertTriangle className="text-yellow-500" />}
    title="確認不計分下場？"
    accentBorderClassName="border-yellow-500"
    description={
      <>
        這將只會增加場上選手的<span className="font-bold text-slate-800">「場次」</span>，不會變動積分、勝敗或總得分。
        <br />
        該場地將會清空。
      </>
    }
    confirmLabel="確認下場"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);
