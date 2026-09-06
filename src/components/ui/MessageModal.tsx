import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: MessageType;
}

const ICON_BY_TYPE: Record<MessageType, React.ReactNode> = {
  success: <CheckCircle className="text-green-500" size={32} />,
  error: <XCircle className="text-red-500" size={32} />,
  warning: <AlertCircle className="text-yellow-500" size={32} />,
  info: <Info className="text-blue-500" size={32} />,
};

const BORDER_CLASS_BY_TYPE: Record<MessageType, string> = {
  success: 'border-green-500',
  error: 'border-red-500',
  warning: 'border-yellow-500',
  info: 'border-blue-500',
};

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  type = 'info',
}) => {
  return (
    <Modal isOpen={isOpen} zIndex={200}>
      <div className={`p-6 border-t-4 rounded-2xl ${BORDER_CLASS_BY_TYPE[type]}`}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-slate-50 p-3 rounded-full">{ICON_BY_TYPE[type]}</div>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap w-full">
            {children}
          </div>
          <div className="w-full mt-2">
            <Button className="w-full" onClick={onClose} variant={type === 'error' ? 'danger' : 'primary'}>
              {type === 'error' ? '關閉' : '知道了'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
