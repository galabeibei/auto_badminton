import React from 'react';
import { Shuffle } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useCopy } from '../../hooks/useCopy';

interface RegroupConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asked in the lobby once a player's rating was hand-corrected mid-game: the
 * queued suggestions were planned from the old ratings, so re-planning them is
 * offered rather than done silently - the admin may already have told people
 * what they're playing next.
 */
export const RegroupConfirmModal: React.FC<RegroupConfirmModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  const { dialogs } = useCopy();
  const [before, highlight, after] = dialogs.regroupBody;

  return (
    <ConfirmModal
      isOpen={isOpen}
      icon={<Shuffle className="text-blue-500" />}
      title={dialogs.regroupTitle}
      accentBorderClassName="border-blue-500"
      description={
        <>
          {before}
          <span className="font-bold text-blue-600">{highlight}</span>
          {after}
        </>
      }
      confirmLabel={dialogs.regroupConfirm}
      cancelLabel={dialogs.regroupCancel}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};
