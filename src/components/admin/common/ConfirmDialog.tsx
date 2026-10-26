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
        className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog box */}
      <div className="relative w-full max-w-md bg-charcoal-900 border border-plum-800 rounded-2xl shadow-elevated p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isDestructive
                ? 'bg-brand-coral/20 border-brand-coral/50 text-brand-coral'
                : 'bg-brand-orange/20 border-brand-orange/50 text-brand-orange'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-display font-bold text-soft-white">
              {title}
            </h3>
            <p className="text-xs text-muted-grey mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-grey hover:text-soft-white hover:bg-charcoal-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-charcoal-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-grey hover:text-soft-white hover:bg-charcoal-800 border border-charcoal-700 transition-colors"
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
                ? 'bg-brand-coral hover:bg-brand-coralHover text-soft-white shadow-coral-glow'
                : 'bg-brand-orange hover:bg-brand-orangeHover text-charcoal-950 shadow-orange-glow'
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
