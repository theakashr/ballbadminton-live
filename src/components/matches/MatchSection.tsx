import React from 'react';
import type { Match } from '../../types';
import { MatchRow } from './MatchRow';
import { SectionHeading } from '../common/SectionHeading';
import { Inbox } from 'lucide-react';

interface MatchSectionProps {
  id: string;
  kicker: string;
  title: string;
  description: string;
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  viewAllLabel?: string;
  onViewAll?: () => void;
  isExpanded?: boolean;
  emptyMessage?: string;
  theme?: 'dark' | 'light';
}

export const MatchSection: React.FC<MatchSectionProps> = ({
  id,
  kicker,
  title,
  description,
  matches,
  onSelectMatch,
  viewAllLabel = 'View All',
  onViewAll,
  isExpanded = false,
  emptyMessage = 'No matches currently scheduled in this category.',
  theme = 'light',
}) => {
  return (
    <section id={id} className="py-8">
      <SectionHeading
        kicker={kicker}
        title={title}
        description={description}
        theme={theme}
        action={
          onViewAll ? (
            <button
              onClick={onViewAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange bg-white hover:bg-surface-muted text-text-primary border border-border-neutral shadow-sm"
            >
              <span>{isExpanded ? 'Show Less' : `${viewAllLabel} (${matches.length})`}</span>
            </button>
          ) : undefined
        }
      />

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl text-center bg-white border border-border-neutral shadow-card">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-surface-muted border border-border-neutral text-text-secondary">
            <Inbox className="w-6 h-6 stroke-1" />
          </div>
          <h4 className="text-base font-bold mb-1 text-text-primary">
            No Active Matches Found
          </h4>
          <p className="text-xs max-w-sm text-text-secondary">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {matches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              onSelect={onSelectMatch}
              theme={theme}
            />
          ))}
        </div>
      )}
    </section>
  );
};
