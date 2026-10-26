import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Match } from '../../types';
import { MatchSection } from './MatchSection';
import { matchRepository } from '../../repositories/matchRepository';
import { dataService } from '../../services/dataService';
import { Filter, EyeOff, Eye, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { nativeHaptics } from '../../lib/nativeBridge';

interface MatchOverviewProps {
  onSelectMatch: (match: Match) => void;
  theme?: 'dark' | 'light';
}

export const MatchOverview: React.FC<MatchOverviewProps> = ({ 
  onSelectMatch,
  theme: propTheme 
}) => {
  const navigate = useNavigate();
  const { theme: contextTheme } = useTheme();
  const theme = propTheme || contextTheme;
  const isLight = theme === 'light';

  const [liveList, setLiveList] = useState<Match[]>(() => matchRepository.getByStatus('live'));
  const [upcomingList, setUpcomingList] = useState<Match[]>(() => matchRepository.getByStatus('upcoming'));
  const [recentList, setRecentList] = useState<Match[]>(() => matchRepository.getByStatus('completed'));

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [simulateEmptyState, setSimulateEmptyState] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<{
    live: boolean;
    upcoming: boolean;
    results: boolean;
    [key: string]: boolean;
  }>({
    live: false,
    upcoming: false,
    results: false,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchMatches = async () => {
      try {
        const [live, upcoming, completed] = await Promise.all([
          dataService.getLiveMatches(),
          dataService.getMatches('upcoming'),
          dataService.getCompletedMatches(),
        ]);
        if (isMounted) {
          if (live.length > 0) setLiveList(live);
          if (upcoming.length > 0) setUpcomingList(upcoming);
          if (completed.length > 0) setRecentList(completed);
        }
      } catch (err) {
        console.warn('MatchOverview fetch err:', err);
      }
    };
    fetchMatches();
    return () => { isMounted = false; };
  }, []);

  const categories = [
    'All',
    "Men's Open 5s",
    "Women's Open 5s",
    'Junior Boys (U-19)',
    'Inter-Collegiate Fives',
    'Doubles Open',
  ];

  const filterMatches = (matches: Match[]) => {
    if (simulateEmptyState) return [];
    if (selectedCategory === 'All') return matches;
    return matches.filter((m) => m.category === selectedCategory);
  };

  const filteredLive = filterMatches(liveList);
  const filteredUpcoming = filterMatches(upcomingList);
  const filteredRecent = filterMatches(recentList);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  return (
    <section 
      id="matches-overview" 
      className={`py-16 transition-colors duration-300 relative ${
        isLight 
          ? 'bg-[#F8FAFC] text-slate-900 border-y border-slate-200/80' 
          : 'bg-charcoal-950 text-soft-white border-y border-plum-900/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Category Filter Bar & Empty State Toggle */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b ${
          isLight ? 'border-slate-200' : 'border-plum-850'
        }`}>
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <Filter className="w-4 h-4 shrink-0 hidden sm:block text-brand-orange" />
            <span className={`text-xs uppercase tracking-wider font-bold shrink-0 mr-1 hidden sm:block ${
              isLight ? 'text-slate-500' : 'text-muted-grey'
            }`}>
              Filter By:
            </span>
            <div className="flex items-center gap-1.5">
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => {
                      nativeHaptics.selection();
                      setSelectedCategory(category);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange active:scale-95 ${
                      isSelected
                        ? isLight 
                          ? 'bg-slate-950 text-white font-extrabold shadow-sm' 
                          : 'bg-brand-orange text-charcoal-950 font-bold shadow-sm'
                        : isLight
                          ? 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-300 shadow-sm'
                          : 'bg-charcoal-900/80 text-muted-grey hover:text-soft-white hover:bg-plum-900/50 border border-charcoal-800'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prototype Toggle Button */}
          <button
            onClick={() => setSimulateEmptyState(!simulateEmptyState)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all border flex items-center gap-1.5 self-end sm:self-auto ${
              simulateEmptyState 
                ? 'bg-brand-orange/20 border-brand-orange/40 text-brand-orange' 
                : isLight
                  ? 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  : 'bg-charcoal-900 text-muted-grey border-charcoal-800 hover:text-soft-white hover:border-plum-800'
            }`}
          >
            {simulateEmptyState ? (
              <>
                <Eye className="w-3.5 h-3.5 text-brand-orange" />
                <span>Restore Match Data</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Simulate Empty State</span>
              </>
            )}
          </button>
        </div>

        {/* 1. Live Matches Section */}
        <div className="relative">
          <MatchSection
            id="live-matches"
            kicker="Courtside Broadcast"
            title="Live Matches"
            description="Real-time 29-point set scoreboards streaming live from outdoor courts."
            matches={expandedSections.live ? filteredLive : filteredLive.slice(0, 1)}
            onSelectMatch={onSelectMatch}
            onViewAll={() => navigate('/live')}
            isExpanded={expandedSections.live}
            emptyMessage="No live matches are actively on court right now. Check upcoming fixtures below."
            theme={theme}
          />
          <div className="mt-2 text-right">
            <button
              onClick={() => navigate('/live')}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline"
            >
              <span>Explore all live courts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className={`my-8 border-t ${isLight ? 'border-slate-200' : 'border-charcoal-800/60'}`} />

        {/* 2. Upcoming Fixtures Section */}
        <MatchSection
          id="upcoming-matches"
          kicker="Scheduled Fixtures"
          title="Upcoming Matches"
          description="Next rounds, court assignments, and scheduled start times across all venues."
          matches={expandedSections.upcoming ? filteredUpcoming : filteredUpcoming.slice(0, 2)}
          onSelectMatch={onSelectMatch}
          onViewAll={() => toggleSection('upcoming')}
          isExpanded={expandedSections.upcoming}
          emptyMessage="All scheduled matches for today have concluded. New fixtures will be drawn shortly."
          theme={theme}
        />

        <div className={`my-8 border-t ${isLight ? 'border-slate-200' : 'border-charcoal-800/60'}`} />

        {/* 3. Recent Results Section */}
        <div className="relative">
          <MatchSection
            id="recent-results"
            kicker="Championship Standings"
            title="Recent Results"
            description="Official final scores, duration records, and winner progressions."
            matches={expandedSections.results ? filteredRecent : filteredRecent.slice(0, 2)}
            onSelectMatch={onSelectMatch}
            onViewAll={() => navigate('/results')}
            isExpanded={expandedSections.results}
            emptyMessage="No completed match records found for the selected filter."
            theme={theme}
          />
          <div className="mt-2 text-right">
            <button
              onClick={() => navigate('/results')}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline"
            >
              <span>View full results archive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
