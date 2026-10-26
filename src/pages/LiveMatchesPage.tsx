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
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-plum-900/60">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-coral opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-coral" />
            </span>
            <span className="text-xs uppercase tracking-widest font-extrabold text-brand-coral">
              Live Courtside Broadcast
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-soft-white tracking-tight">
            Live Matches
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-muted-grey">
            Official 29-point set scoreboards and service hand rotations streaming live from BBFI courts.
          </p>
        </div>

        {/* Realtime Status Indicator & Manual Refresh */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            status === 'connected'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : status === 'connecting'
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-charcoal-900 border-slate-300 dark:border-plum-800 text-slate-700 dark:text-muted-grey'
          }`}>
            <Radio className={`w-3.5 h-3.5 ${status === 'connected' ? 'animate-pulse text-emerald-500' : ''}`} />
            <span>
              {status === 'connected' ? 'Supabase Realtime Live' : status === 'connecting' ? 'Connecting Stream...' : 'Live Stream Ready'}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Refresh live matches"
            className="p-2 rounded-xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-plum-800 text-slate-600 dark:text-muted-grey hover:text-brand-orange dark:hover:text-brand-orange active:scale-95 transition-all shadow-sm"
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
                  ? 'bg-brand-orange text-charcoal-950 font-bold shadow-sm'
                  : 'bg-white dark:bg-charcoal-900 text-slate-600 dark:text-muted-grey hover:text-slate-900 dark:hover:text-soft-white border border-slate-200 dark:border-charcoal-800'
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
        <div className="py-16 px-6 text-center rounded-3xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-plum-800/80 shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-brand-orange/15 border border-brand-orange/30 text-brand-orange mx-auto flex items-center justify-center mb-4">
            <Radio className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-soft-white">
            No Matches Currently Live
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-muted-grey max-w-md mx-auto">
            All court sessions for this category are either scheduled for upcoming rounds or have completed their 29-point sets.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/tournaments')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange text-charcoal-950 font-bold text-xs shadow-orange-glow active:scale-95 transition-transform"
            >
              <Trophy className="w-4 h-4 stroke-[2.2]" />
              <span>Browse Tournaments</span>
            </button>
            <button
              onClick={() => navigate('/results')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-charcoal-800 text-slate-800 dark:text-soft-white font-semibold text-xs border border-slate-200 dark:border-charcoal-700 active:scale-95 transition-transform"
            >
              <span>View Recent Results</span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-orange" />
            </button>
          </div>
        </div>
      )}

      {/* Stream Meta Footer */}
      {lastUpdated && (
        <div className="mt-8 text-center text-[11px] text-slate-500 dark:text-muted-grey">
          Last synchronized with court scorer desk at {lastUpdated.toLocaleTimeString()}
        </div>
      )}

    </div>
  );
};
