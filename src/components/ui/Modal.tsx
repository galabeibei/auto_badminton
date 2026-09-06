import React from 'react';

interface ModalProps {
  isOpen: boolean;
  /** Tailwind max-width class for the modal panel, e.g. "max-w-sm" (default), "max-w-4xl". */
  maxWidthClassName?: string;
  /** Stacking order when multiple modals could theoretically be open at once. */
  zIndex?: number;
  children: React.ReactNode;
}

/**
 * Shared modal chrome (backdrop + centred panel). The original app repeated
 * this wrapper markup verbatim in every modal across both Run screens; every
 * modal in this app is now built on top of this single component instead.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  maxWidthClassName = 'max-w-sm',
  zIndex = 100,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex }}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthClassName}`}>{children}</div>
    </div>
  );
};
