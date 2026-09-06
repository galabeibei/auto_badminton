import React from 'react';
import { Repeat, UserCog } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface PlayerActionSheetProps {
  isOpen: boolean;
  playerName: string;
  onModify: () => void;
  onSwap: () => void;
  onCancel: () => void;
}

/**
 * Long-press action menu for a player sitting in a queued match card:
 * "修改" replaces them with anyone from the full roster, "交換" starts the
 * existing select-then-pick-a-target swap with another lobby card.
 */
export const PlayerActionSheet: React.FC<PlayerActionSheetProps> = ({
  isOpen,
  playerName,
  onModify,
  onSwap,
  onCancel,
}) => {
  return (
    <Modal isOpen={isOpen} zIndex={160}>
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-1">{playerName}</h3>
        <p className="text-sm text-slate-500 mb-4">請選擇要進行的操作</p>
        <div className="flex flex-col gap-3">
          <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-3" onClick={onModify}>
            <UserCog size={18} /> 修改（換成名單中任一選手）
          </Button>
          <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-3" onClick={onSwap}>
            <Repeat size={18} /> 交換（與大廳中其他選手互換位置）
          </Button>
          <Button variant="secondary" className="w-full" onClick={onCancel}>
            取消
          </Button>
        </div>
      </div>
    </Modal>
  );
};
