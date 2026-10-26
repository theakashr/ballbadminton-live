import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading tournament data...', 
  rows = 4 
}) => {
  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-center gap-3 py-6 text-brand-orange">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm font-semibold text-soft-white">{message}</span>
      </div>

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-charcoal-900/60 border border-plum-800/40 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
};
