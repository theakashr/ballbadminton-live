import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Radio, 
  RefreshCw, 
  Trophy, 
  Filter,
  ArrowRight
} from 'lucide-react';
import { useRealtimeLiveMatches } from '../hooks/useRealtimeLiveMatches';
import { MobileMatchCard } from '../components/mobile/MobileMatchCard';
import { nativeHaptics } from '../lib/nativeBridge';
import type { Match } from '../types';

export const LiveMatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { liveMatches, status, lastUpdated, refresh, isLoading } = useRealtimeLiveMatches();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    "Men's Open 5s",
    "Women's Open 5s",
    'Junior Boys (U-19)',
    'Inter-Collegiate Fives',
    'Doubles Open',
  ];

  const filteredMatches = selectedCategory === 'All'
    ? liveMatches
    : liveMatches.filter((m) => m.category === selectedCategory);

  const handleRefresh = async () => {
    nativeHaptics.impact('light');
    await refresh();
  };

  const handleMatchSelect = (match: Match) => {
    nativeHaptics.selection();
    navigate(`/matches/${match.id}`);
  };

  return (
    <div className="pt-4 md:pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Top Banner & Realtime Status */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-neutral">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-live opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-status-live" />
            </span>
            <span className="text-xs uppercase tracking-widest font-extrabold text-status-live">
              Live Courtside Broadcast
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-black text-text-primary tracking-tight">
            Live Matches
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-text-secondary">
            Official 29-point set scoreboards and service hand rotations streaming live from BBFI courts.
          </p>
        </div>

        {/* Realtime Status Indicator & Manual Refresh */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            status === 'connected'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-status-success'
              : status === 'connecting'
              ? 'bg-amber-500/10 border-amber-500/25 text-status-warning'
              : 'bg-surface-muted border-border-neutral text-text-secondary'
          }`}>
            <Radio className={`w-3.5 h-3.5 ${status === 'connected' ? 'animate-pulse text-status-success' : ''}`} />
            <span>
              {status === 'connected' ? 'Supabase Realtime Live' : status === 'connecting' ? 'Connecting Stream...' : 'Live Stream Ready'}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Refresh live matches"
            className="p-2 rounded-xl bg-white border border-border-neutral text-text-secondary hover:text-brand-orange active:scale-95 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-orange' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        <Filter className="w-4 h-4 text-brand-orange shrink-0 hidden sm:block" />
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                nativeHaptics.selection();
                setSelectedCategory(cat);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                isSelected
                  ? 'bg-brand-orange text-white font-bold shadow-sm'
                  : 'bg-white text-text-secondary hover:text-text-primary border border-border-neutral'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Live Matches Listing */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredMatches.map((match) => (
            <MobileMatchCard
              key={match.id}
              match={match}
              onOpenDetails={handleMatchSelect}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 px-6 text-center rounded-2xl bg-white border border-border-neutral shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-brand-soft border border-brand-orange/30 text-brand-orange mx-auto flex items-center justify-center mb-4">
            <Radio className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h3 className="font-display font-extrabold text-xl text-text-primary">
            No Matches Currently Live
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
            All court sessions for this category are either scheduled for upcoming rounds or have completed their 29-point sets.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/tournaments')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-card active:scale-95 transition-transform"
            >
              <Trophy className="w-4 h-4 stroke-[2.2]" />
              <span>Browse Tournaments</span>
            </button>
            <button
              onClick={() => navigate('/results')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-muted text-text-primary font-semibold text-xs border border-border-neutral active:scale-95 transition-transform"
            >
              <span>View Recent Results</span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-orange" />
            </button>
          </div>
        </div>
      )}

      {/* Stream Meta Footer */}
      {lastUpdated && (
        <div className="mt-8 text-center text-[11px] text-text-secondary">
          Last synchronized with court scorer desk at {lastUpdated.toLocaleTimeString()}
        </div>
      )}

    </div>
  );
};
