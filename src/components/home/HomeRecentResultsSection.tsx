import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Trophy, Clock } from 'lucide-react';
import type { Match } from '../../types';
import { nativeHaptics } from '../../lib/nativeBridge';

interface HomeRecentResultsSectionProps {
  completedMatches: Match[];
  onOpenDetails: (match: Match) => void;
}

export const HomeRecentResultsSection: React.FC<HomeRecentResultsSectionProps> = ({
  completedMatches,
  onOpenDetails,
}) => {

  return (
    <section id="recent-results-section" className="my-8 sm:my-12">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg sm:text-2xl text-soft-white tracking-tight">
              Recent Results
            </h2>
            <p className="text-xs text-muted-grey hidden sm:block">
              Final verified scores and official BBFI match summaries
            </p>
          </div>
        </div>

        <Link
          to="/results"
          onClick={() => nativeHaptics.selection()}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <span>View All Results</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Results Grid */}
      {completedMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedMatches.slice(0, 3).map((match) => {
            const isTeam1Winner = match.team1SetsWon > match.team2SetsWon;
            const isTeam2Winner = match.team2SetsWon > match.team1SetsWon;

            return (
              <div
                key={match.id}
                onClick={() => {
                  nativeHaptics.impact('light');
                  onOpenDetails(match);
                }}
                className="group relative rounded-2xl bg-charcoal-900/90 hover:bg-plum-950/90 border border-plum-800/70 hover:border-emerald-500/60 p-4 sm:p-5 shadow-subtle transition-all duration-200 cursor-pointer active:scale-[0.98] flex flex-col justify-between"
              >
                <div>
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-plum-900/60">
                    <span className="text-xs font-bold text-soft-white truncate max-w-[170px]">
                      {match.tournamentName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 shrink-0">
                      FINAL
                    </span>
                  </div>

                  {/* Team 1 Score Row */}
                  <div className={`flex items-center justify-between gap-3 py-1.5 rounded-lg px-2 ${
                    isTeam1Winner ? 'bg-plum-900/40' : ''
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs text-white border border-plum-700 shrink-0"
                        style={{ backgroundColor: match.team1.logoBg || '#211329' }}
                      >
                        {match.team1.shortName}
                      </div>
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className={`font-display text-sm truncate ${
                          isTeam1Winner ? 'font-extrabold text-soft-white' : 'font-medium text-muted-grey'
                        }`}>
                          {match.team1.name}
                        </span>
                        {isTeam1Winner && (
                          <Trophy className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                        )}
                      </div>
                    </div>

                    <span className={`font-score text-lg min-w-[20px] text-right ${
                      isTeam1Winner ? 'font-black text-brand-orange' : 'font-medium text-muted-grey'
                    }`}>
                      {match.team1SetsWon}
                    </span>
                  </div>

                  {/* Team 2 Score Row */}
                  <div className={`flex items-center justify-between gap-3 py-1.5 rounded-lg px-2 mt-0.5 ${
                    isTeam2Winner ? 'bg-plum-900/40' : ''
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs text-white border border-plum-700 shrink-0"
                        style={{ backgroundColor: match.team2.logoBg || '#15131B' }}
                      >
                        {match.team2.shortName}
                      </div>
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className={`font-display text-sm truncate ${
                          isTeam2Winner ? 'font-extrabold text-soft-white' : 'font-medium text-muted-grey'
                        }`}>
                          {match.team2.name}
                        </span>
                        {isTeam2Winner && (
                          <Trophy className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                        )}
                      </div>
                    </div>

                    <span className={`font-score text-lg min-w-[20px] text-right ${
                      isTeam2Winner ? 'font-black text-brand-orange' : 'font-medium text-muted-grey'
                    }`}>
                      {match.team2SetsWon}
                    </span>
                  </div>

                  {/* Set Breakdown Pills */}
                  {match.setScores.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2">
                      {match.setScores.map((set, idx) => (
                        <span
                          key={set.gameNumber || idx}
                          className="px-2 py-0.5 rounded bg-charcoal-800 text-[10px] font-score text-muted-grey border border-plum-900"
                        >
                          {set.team1Score}-{set.team2Score}
                        </span>
                      ))}
                      {match.matchDurationMinutes && (
                        <span className="text-[10px] text-muted-grey ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{match.matchDurationMinutes} min</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Link */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-plum-900/50 text-[11px]">
                  <span className="text-muted-grey">
                    {match.completedAt || 'Official Result'}
                  </span>
                  <span className="font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>View Match Summary</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-2xl bg-charcoal-900/70 border border-plum-800/50 text-center">
          <p className="text-sm font-semibold text-soft-white mb-1">
            No Completed Matches Recorded Yet
          </p>
          <p className="text-xs text-muted-grey max-w-sm mx-auto">
            Official scorecards will appear here once games conclude.
          </p>
        </div>
      )}
    </section>
  );
};
