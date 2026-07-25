import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, title, onClose, children, footer, maxWidth = 'max-w-md' }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end md:items-start md:pt-[10vh] justify-center p-0 md:p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${maxWidth} rounded-t-xl md:rounded-xl max-h-[90vh] md:max-h-[80vh] flex flex-col bg-bg-panel border border-border-subtle`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 md:px-6 md:py-5 border-b border-border-subtle md:border-b">
          <p className="m-0 text-[18px] font-semibold text-text-primary">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="flex md:hidden items-center justify-center w-7 h-7 rounded-full bg-bg-panel-hover text-text-secondary"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 md:px-6 md:py-5 space-y-4 scroll-themed">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-3 px-5 py-4 md:px-6 border-t border-border-subtle">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
