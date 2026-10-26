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
    <div className="py-14 px-6 text-center rounded-2xl bg-white border border-border-neutral flex flex-col items-center justify-center max-w-md mx-auto my-6 shadow-card">
      <div className="w-14 h-14 rounded-2xl bg-surface-muted border border-border-neutral flex items-center justify-center text-brand-orange mb-4">
        <Icon className="w-7 h-7 text-brand-orange" />
      </div>

      <h3 className="text-lg font-display font-bold text-text-primary mb-1.5">
        {title}
      </h3>

      <p className="text-xs text-text-secondary leading-relaxed mb-6 max-w-sm">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{actionLabel}</span>
          </button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-primary font-medium text-xs border border-border-neutral transition-colors"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
