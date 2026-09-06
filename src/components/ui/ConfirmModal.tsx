import React from 'react';
import { Button } from './Button';
import type { ButtonVariant } from './Button';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  icon: React.ReactNode;
  /** Tailwind class for the modal's left accent border, e.g. "border-yellow-500". */
  accentBorderClassName: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Generic two-button confirmation dialog. Replaces both the original app's
 * `window.confirm()` call (not testable, and inconsistent with every other
 * dialog in the app) and its several copy-pasted "confirm before doing X"
 * modals (no-score, finish game, full reset).
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  icon,
  accentBorderClassName,
  confirmLabel,
  cancelLabel = '取消',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal isOpen={isOpen} zIndex={130}>
      <div className={`p-6 border-l-4 rounded-2xl ${accentBorderClassName}`}>
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <div className="text-sm text-slate-600 leading-relaxed">{description}</div>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" className="flex-1" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={confirmVariant} className="flex-1" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
