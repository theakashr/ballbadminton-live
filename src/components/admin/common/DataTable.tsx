import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  pageSize = 10,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching the current view criteria.',
  onRowClick,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      const comparison = valA < valB ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="rounded-2xl border border-border-neutral bg-white overflow-hidden shadow-card">
      {/* Mobile Card List (Phones) */}
      <div className="md:hidden divide-y divide-border-neutral">
        {paginatedData.map((item, idx) => {
          const globalIndex = (currentPage - 1) * pageSize + idx;
          const firstCol = columns[0];
          const otherCols = columns.slice(1);

          return (
            <div
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`p-4 space-y-2 transition-colors ${
                onRowClick ? 'cursor-pointer active:bg-surface-muted/60' : ''
              }`}
            >
              {/* Primary Header Row (Column 0) */}
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-sm text-text-primary min-w-0">
                  {firstCol.render ? firstCol.render(item, globalIndex) : String(item[firstCol.key] || '—')}
                </div>
              </div>

              {/* Other Columns as Attribute Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
                {otherCols.map((col) => (
                  <div key={col.key} className="space-y-0.5 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      {col.header}
                    </span>
                    <div className="text-text-primary font-medium truncate">
                      {col.render
                        ? col.render(item, globalIndex)
                        : (item[col.key] !== undefined && item[col.key] !== null)
                        ? String(item[col.key])
                        : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (Tablets & Desktops) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-neutral bg-surface-muted text-xs uppercase tracking-wider text-text-secondary font-semibold">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3.5 whitespace-nowrap ${col.headerClassName || ''}`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1.5 hover:text-text-primary transition-colors"
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-brand-orange" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-brand-orange" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-text-secondary/60" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-neutral">
            {paginatedData.map((item, idx) => {
              const globalIndex = (currentPage - 1) * pageSize + idx;
              return (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-surface-muted/60' : 'hover:bg-surface-muted/40'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 text-text-primary ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(item, globalIndex)
                        : (item[col.key] !== undefined && item[col.key] !== null)
                        ? String(item[col.key])
                        : '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border-neutral bg-surface-muted flex items-center justify-between text-xs text-text-secondary">
          <span>
            Showing <strong className="text-text-primary">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-text-primary">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </strong>{' '}
            of <strong className="text-text-primary">{sortedData.length}</strong> items
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border-neutral bg-white hover:bg-surface-muted disabled:opacity-40 disabled:pointer-events-none text-text-primary transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-text-primary font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-border-neutral bg-white hover:bg-surface-muted disabled:opacity-40 disabled:pointer-events-none text-text-primary transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
