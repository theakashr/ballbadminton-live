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
      className={`flex items-center gap-1 p-1 bg-charcoal-900 dark:bg-charcoal-900 border border-slate-200/80 dark:border-plum-800/80 rounded-2xl overflow-x-auto no-scrollbar ${className}`}
    >
      {options.map((option) => {
        const isActive = activeId === option.id;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(option.id)}
            className={`relative flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
              isActive
                ? 'bg-plum-800 text-soft-white shadow-sm font-bold border border-plum-700/80'
                : 'text-slate-500 dark:text-muted-grey hover:text-slate-900 dark:hover:text-soft-white'
            }`}
          >
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-brand-coral text-white'
                    : 'bg-charcoal-800 text-muted-grey'
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
