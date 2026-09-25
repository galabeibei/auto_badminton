import React from 'react';
import { LogOut } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useCopy } from '../../hooks/useCopy';

interface FinishConfirmModalProps {
  isOpen: boolean;
  /** How many matches are still on a court or queued and would be left out of the final stats. */
  unfinishedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const FinishConfirmModal: React.FC<FinishConfirmModalProps> = ({
  isOpen,
  unfinishedCount,
  onConfirm,
  onCancel,
}) => {
  const { dialogs } = useCopy();
  const [before, highlight, after] = dialogs.finishBody;
  const [unfinishedBefore, unfinishedAfter] = dialogs.finishUnfinished;

  return (
    <ConfirmModal
      isOpen={isOpen}
      icon={<LogOut className="text-red-500" />}
      title={dialogs.finishTitle}
      accentBorderClassName="border-red-500"
      description={
        <>
          {before}
          <span className="font-bold text-red-600">{highlight}</span>
          {after}
          {unfinishedCount > 0 && (
            <>
              <br />
              {unfinishedBefore}
              <span className="font-bold text-red-600">{unfinishedCount}</span>
              {unfinishedAfter}
            </>
          )}
        </>
      }
      confirmLabel={dialogs.finishConfirm}
      cancelLabel={dialogs.finishCancel}
      confirmVariant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};
