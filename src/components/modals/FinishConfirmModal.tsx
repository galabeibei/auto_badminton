import React from 'react';
import { LogOut } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';

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
}) => (
  <ConfirmModal
    isOpen={isOpen}
    icon={<LogOut className="text-red-500" />}
    title="確定要結算戰績嗎？"
    accentBorderClassName="border-red-500"
    description={
      <>
        系統將<span className="font-bold text-red-600">停止產生新賽程</span>，並進入最終戰績頁面。
        {unfinishedCount > 0 && (
          <>
            <br />
            目前場上/佇列尚有 <span className="font-bold text-red-600">{unfinishedCount}</span>{' '}
            場未完成的比賽，這些場次不會計入最終戰績。
          </>
        )}
      </>
    }
    confirmLabel="確認結算"
    cancelLabel="繼續打球"
    confirmVariant="danger"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);
