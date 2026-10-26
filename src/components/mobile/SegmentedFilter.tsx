import React from 'react';
import { nativeHaptics } from '../../lib/nativeBridge';

export interface FilterOption {
  id: string;
  label: string;
  badge?: number | string;
}

interface SegmentedFilterProps {
  options: FilterOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const SegmentedFilter: React.FC<SegmentedFilterProps> = ({
  options,
  activeId,
  onChange,
  className = '',
}) => {
  const handleSelect = (id: string) => {
    if (id !== activeId) {
      nativeHaptics.selection();
      onChange(id);
    }
  };

  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 p-1 bg-surface-muted border border-border-neutral rounded-xl overflow-x-auto no-scrollbar ${className}`}
    >
      {options.map((option) => {
        const isActive = activeId === option.id;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(option.id)}
            className={`relative flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
              isActive
                ? 'bg-white text-text-primary shadow-sm font-bold border border-border-neutral'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-brand-soft text-brand-orange'
                    : 'bg-border-neutral text-text-secondary'
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
