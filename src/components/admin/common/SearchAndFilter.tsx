import React from 'react';
import { Search, X, Filter } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  selectedValue: string;
}

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onFilterChange?: (filterId: string, value: string) => void;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  totalResults?: number;
  resultLabel?: string;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  onFilterChange,
  onResetFilters,
  hasActiveFilters = false,
  totalResults,
  resultLabel = 'records',
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-charcoal-900 border border-plum-800 text-sm text-soft-white placeholder-muted-grey/60 focus:outline-none focus:border-brand-orange transition-colors"
          />
          <Search className="w-4 h-4 text-muted-grey absolute left-3 top-3" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-3 text-muted-grey hover:text-soft-white p-0.5"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <div key={filter.id} className="relative">
                <select
                  value={filter.selectedValue}
                  onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                  className="pl-3 pr-8 py-2.5 rounded-xl bg-charcoal-900 border border-plum-800 text-xs text-soft-white font-medium appearance-none focus:outline-none focus:border-brand-orange cursor-pointer transition-colors"
                >
                  <option value="">All {filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-charcoal-900 text-soft-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Filter className="w-3.5 h-3.5 text-muted-grey absolute right-2.5 top-3 pointer-events-none" />
              </div>
            ))}

            {hasActiveFilters && onResetFilters && (
              <button
                onClick={onResetFilters}
                className="px-3 py-2 rounded-xl text-xs text-brand-orange hover:bg-brand-orange/10 border border-brand-orange/30 font-medium transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {totalResults !== undefined && (
        <div className="flex items-center justify-between text-xs text-muted-grey px-1">
          <span>
            Found <strong className="text-soft-white">{totalResults}</strong> {resultLabel}
          </span>
          {hasActiveFilters && (
            <span className="text-brand-orange text-[11px] font-medium">
              Filtered view active
            </span>
          )}
        </div>
      )}
    </div>
  );
};
