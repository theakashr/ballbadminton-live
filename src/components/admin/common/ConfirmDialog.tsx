import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog box */}
      <div className="relative w-full max-w-md bg-white border border-border-neutral rounded-2xl shadow-card-hover p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isDestructive
                ? 'bg-rose-50 border-status-live/30 text-status-live'
                : 'bg-brand-soft border-brand-orange/30 text-brand-orange'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-display font-bold text-text-primary">
              {title}
            </h3>
            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-border-neutral flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-border-neutral transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isDestructive
                ? 'bg-status-live hover:bg-rose-700 text-white shadow-card'
                : 'bg-brand-orange hover:bg-brand-orangeHover text-white shadow-card'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
