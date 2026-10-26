import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Trophy, 
  Search, 
  Calendar, 
  MapPin, 
  Layers, 
  ArrowUpRight, 
  Clock,
  RotateCcw
} from 'lucide-react';
import { dataService } from '../services/dataService';
import type { Match, AdminTournament } from '../types';
import { nativeHaptics } from '../lib/nativeBridge';

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    const loadResults = async () => {
      setIsLoading(true);
      try {
        const [completedList, allTournaments] = await Promise.all([
          dataService.getCompletedMatches(),
          dataService.getTournaments(),
        ]);

        if (isMounted) {
          setMatches(completedList);
          setTournaments(allTournaments);
        }
      } catch (err) {
        console.error('Error loading results:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadResults();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    'all',
    "Men's Open 5s",
    "Women's Open 5s",
    'Junior Boys (U-19)',
    'Inter-Collegiate Fives',
    'Doubles Open',
  ];

  // Filter evaluation
  const filteredMatches = matches.filter((m) => {
    // Tournament Filter
    if (selectedTournamentId !== 'all' && m.tournamentId !== selectedTournamentId) {
      return false;
    }

    // Category Filter
    if (selectedCategory !== 'all' && m.category !== selectedCategory) {
      return false;
    }

    // Search Query (team names, short names, tournament name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.team1.name} ${m.team1.shortName} ${m.team2.name} ${m.team2.shortName} ${m.tournamentName} ${m.stage} ${m.city}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  const handleSelectResult = (matchId: string) => {
    nativeHaptics.selection();
    navigate(`/matches/${matchId}`);
  };

  const handleResetFilters = () => {
    nativeHaptics.impact('light');
    setSearchQuery('');
    setSelectedTournamentId('all');
    setSelectedCategory('all');
  };

  return (
    <div className="pt-4 md:pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Top Hero Header */}
      <div className="mb-6 sm:mb-8 pb-6 border-b border-slate-200 dark:border-plum-900/60">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-500">
            Official Championship Archive
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-soft-white tracking-tight">
              Match Results
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-muted-grey max-w-2xl">
              Verified final scores, set-by-set scorecards, duration metrics, and championship summaries from real database fixtures.
            </p>
          </div>

          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-charcoal-900 border border-slate-200 dark:border-plum-800 text-slate-700 dark:text-muted-grey self-start sm:self-auto">
            {matches.length} Total Matches Concluded
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-plum-800/80 shadow-sm mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-muted-grey absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team, city, or tournament..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-charcoal-800 text-slate-900 dark:text-soft-white placeholder:text-slate-400 dark:placeholder:text-muted-grey focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>

          {/* Tournament Filter Dropdown */}
          <div className="sm:col-span-4">
            <select
              value={selectedTournamentId}
              onChange={(e) => {
                nativeHaptics.selection();
                setSelectedTournamentId(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-charcoal-800 text-slate-900 dark:text-soft-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              <option value="all">All Tournaments ({tournaments.length})</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                nativeHaptics.selection();
                setSelectedCategory(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-charcoal-800 text-slate-900 dark:text-soft-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              <option value="all">All Categories</option>
              {categories.filter(c => c !== 'all').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Active Filters Tag Bar (if any filter is applied) */}
        {(searchQuery || selectedTournamentId !== 'all' || selectedCategory !== 'all') && (
          <div className="pt-2 border-t border-slate-100 dark:border-charcoal-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-muted-grey">
              Showing {filteredMatches.length} of {matches.length} results
            </span>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-brand-orange hover:underline font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Listing Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-200 dark:bg-charcoal-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="space-y-4">
          {filteredMatches.map((m) => {
            const isTeam1Winner = m.team1SetsWon > m.team2SetsWon;

            return (
              <div
                key={m.id}
                onClick={() => handleSelectResult(m.id)}
                className="group p-5 sm:p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-plum-800/80 hover:border-brand-orange/60 transition-all shadow-sm dark:shadow-md hover:shadow-lg cursor-pointer"
              >
                {/* Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-charcoal-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
                      FINAL
                    </span>
                    <span className="font-bold text-slate-900 dark:text-soft-white">
                      {m.tournamentName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 dark:text-muted-grey font-medium">
                      {m.stage}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 dark:text-muted-grey text-[11px]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-orange" />
                      <span>{m.court} • {m.city}</span>
                    </span>
                    {m.completedAt && (
                      <span className="hidden sm:inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{m.completedAt}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Matchup Arena */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  
                  {/* Team 1 */}
                  <div className="sm:col-span-5 flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-base text-white shrink-0 shadow-sm border border-slate-200 dark:border-plum-700"
                      style={{ backgroundColor: m.team1.logoBg || '#211329' }}
                    >
                      {m.team1.shortName}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-display font-bold text-base truncate block ${
                          isTeam1Winner ? 'text-slate-900 dark:text-soft-white font-extrabold' : 'text-slate-600 dark:text-muted-grey'
                        }`}>
                          {m.team1.name}
                        </span>
                        {isTeam1Winner && (
                          <span className="px-1.5 py-0.2 rounded bg-brand-orange/20 text-brand-orange text-[9px] font-black shrink-0">
                            W
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-muted-grey">
                        {m.team1.state} • Capt. {m.team1.captainName}
                      </span>
                    </div>
                  </div>

                  {/* Sets Score Center */}
                  <div className="sm:col-span-2 flex flex-col items-center justify-center text-center py-2 sm:py-0">
                    <div className="flex items-center justify-center gap-3 score-digits">
                      <span className={`text-3xl font-score font-black ${
                        isTeam1Winner ? 'text-brand-orange' : 'text-slate-800 dark:text-soft-white'
                      }`}>
                        {m.team1SetsWon}
                      </span>
                      <span className="text-slate-400 dark:text-muted-grey text-lg">:</span>
                      <span className={`text-3xl font-score font-black ${
                        !isTeam1Winner ? 'text-brand-orange' : 'text-slate-800 dark:text-soft-white'
                      }`}>
                        {m.team2SetsWon}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-muted-grey mt-0.5">
                      Sets Won (Best of 3)
                    </span>
                  </div>

                  {/* Team 2 */}
                  <div className="sm:col-span-5 flex items-center justify-start sm:justify-end gap-3 text-left sm:text-right">
                    <div className="order-2 sm:order-1 min-w-0">
                      <div className="flex items-center justify-start sm:justify-end gap-1.5">
                        {!isTeam1Winner && (
                          <span className="px-1.5 py-0.2 rounded bg-brand-orange/20 text-brand-orange text-[9px] font-black shrink-0 order-2 sm:order-1">
                            W
                          </span>
                        )}
                        <span className={`font-display font-bold text-base truncate block order-1 sm:order-2 ${
                          !isTeam1Winner ? 'text-slate-900 dark:text-soft-white font-extrabold' : 'text-slate-600 dark:text-muted-grey'
                        }`}>
                          {m.team2.name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-muted-grey">
                        {m.team2.state} • Capt. {m.team2.captainName}
                      </span>
                    </div>

                    <div
                      className="order-1 sm:order-2 w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-base text-white shrink-0 shadow-sm border border-slate-200 dark:border-plum-700"
                      style={{ backgroundColor: m.team2.logoBg || '#15131B' }}
                    >
                      {m.team2.shortName}
                    </div>
                  </div>

                </div>

                {/* Set-by-Set Breakdown Strip & Summary Action */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-charcoal-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  
                  {/* Set score pills */}
                  <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-muted-grey shrink-0 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-brand-orange" />
                      <span>Sets:</span>
                    </span>

                    {m.setScores.map((set) => (
                      <div
                        key={set.gameNumber}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-charcoal-800 text-xs font-mono font-medium text-slate-700 dark:text-soft-white whitespace-nowrap"
                      >
                        <span className="text-[10px] text-slate-400 mr-1">S{set.gameNumber}:</span>
                        <span>{set.team1Score}-{set.team2Score}</span>
                        {set.durationMinutes && (
                          <span className="text-[10px] text-slate-400 ml-1">({set.durationMinutes}m)</span>
                        )}
                      </div>
                    ))}

                    {m.matchDurationMinutes && (
                      <div className="px-2 py-1 rounded-lg bg-orange-50 dark:bg-plum-950/60 border border-orange-200 dark:border-plum-800 text-[11px] font-semibold text-brand-orange flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        <span>{m.matchDurationMinutes} mins total</span>
                      </div>
                    )}
                  </div>

                  {/* View Match Summary Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectResult(m.id);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-plum-900/60 dark:hover:bg-plum-850 text-brand-orange font-bold text-xs border border-orange-200 dark:border-plum-800 transition-all active:scale-95 shrink-0"
                  >
                    <span>View Match Summary</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 px-6 text-center rounded-3xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-plum-800 shadow-sm">
          <Trophy className="w-12 h-12 text-slate-400 dark:text-muted-grey mx-auto mb-3 stroke-[1.5]" />
          <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-soft-white">
            No Results Found
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-muted-grey max-w-md mx-auto">
            No completed match results match your current search and filter selections.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-5 px-5 py-2.5 rounded-xl bg-brand-orange text-charcoal-950 font-bold text-xs shadow-orange-glow active:scale-95"
          >
            Reset All Filters
          </button>
        </div>
      )}

    </div>
  );
};
