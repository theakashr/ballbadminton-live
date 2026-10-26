import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-charcoal-900 border border-brand-coral/40 max-w-lg mx-auto my-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-xl bg-brand-coral/20 border border-brand-coral flex items-center justify-center text-brand-coral mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div>
        <h4 className="text-base font-display font-bold text-soft-white">{title}</h4>
        <p className="text-xs text-muted-grey mt-1 leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-soft-white text-xs font-semibold border border-charcoal-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-brand-orange" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
