import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useCopy } from '../../hooks/useCopy';

interface NoScoreConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const NoScoreConfirmModal: React.FC<NoScoreConfirmModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  const { dialogs } = useCopy();
  const [before, highlight, after] = dialogs.noScoreBody;

  return (
    <ConfirmModal
      isOpen={isOpen}
      icon={<AlertTriangle className="text-yellow-500" />}
      title={dialogs.noScoreTitle}
      accentBorderClassName="border-yellow-500"
      description={
        <>
          {before}
          <span className="font-bold text-slate-800">{highlight}</span>
          {after}
          <br />
          {dialogs.noScoreCourtCleared}
        </>
      }
      confirmLabel={dialogs.noScoreConfirm}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};
