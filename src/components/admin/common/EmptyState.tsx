import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { PackageOpen, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="py-14 px-6 text-center rounded-2xl bg-charcoal-900/50 border border-plum-800/60 flex flex-col items-center justify-center max-w-md mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-plum-950 border border-plum-800 flex items-center justify-center text-muted-grey mb-4 shadow-subtle">
        <Icon className="w-7 h-7 text-brand-orange/80" />
      </div>

      <h3 className="text-lg font-display font-bold text-soft-white mb-1.5">
        {title}
      </h3>

      <p className="text-xs text-muted-grey leading-relaxed mb-6 max-w-sm">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-charcoal-950 font-bold text-xs shadow-orange-glow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{actionLabel}</span>
          </button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-soft-white font-medium text-xs border border-charcoal-700 transition-colors"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
