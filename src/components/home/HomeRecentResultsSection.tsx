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
    <section id="recent-results-section" className="my-8 sm:my-10">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#16803D]/10 border border-[#16803D]/30 text-[#16803D]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg sm:text-2xl text-[#182230] tracking-tight">
              Recent Results
            </h2>
            <p className="text-xs text-[#667085] hidden sm:block">
              Final verified scores and official BBFI match summaries
            </p>
          </div>
        </div>

        <Link
          to="/results"
          onClick={() => nativeHaptics.selection()}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#16803D] hover:text-[#136C34] transition-colors"
        >
          <span>View All Results</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Results Rail / Grid */}
      {completedMatches.length > 0 ? (
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto snap-x snap-mandatory gap-3.5 sm:gap-4 pb-2.5 sm:pb-0 no-scrollbar card-rail">
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
                className="group relative rounded-2xl bg-white hover:bg-[#F0F2F6] border border-[#E4E7EC] hover:border-[#16803D]/60 p-4 sm:p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] transition-all duration-150 cursor-pointer active:scale-[0.98] flex flex-col justify-between min-w-[280px] sm:min-w-0 flex-shrink-0 sm:flex-shrink snap-center"
              >
                <div>
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#E4E7EC]">
                    <span className="text-xs font-bold text-[#182230] truncate max-w-[170px]">
                      {match.tournamentName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#16803D]/10 border border-[#16803D]/30 text-[10px] font-bold text-[#16803D] shrink-0">
                      FINAL
                    </span>
                  </div>

                  {/* Team 1 Score Row */}
                  <div className={`flex items-center justify-between gap-3 py-1.5 rounded-lg px-2 ${
                    isTeam1Winner ? 'bg-[#F0F2F6]' : ''
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs text-white border border-[#E4E7EC] shrink-0"
                        style={{ backgroundColor: match.team1.logoBg || '#182230' }}
                      >
                        {match.team1.shortName}
                      </div>
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className={`font-display text-sm truncate ${
                          isTeam1Winner ? 'font-extrabold text-[#182230]' : 'font-medium text-[#667085]'
                        }`}>
                          {match.team1.name}
                        </span>
                        {isTeam1Winner && (
                          <Trophy className="w-3.5 h-3.5 text-[#FF851B] shrink-0" />
                        )}
                      </div>
                    </div>

                    <span className={`font-score text-base min-w-[20px] text-right ${
                      isTeam1Winner ? 'font-black text-[#16803D]' : 'font-medium text-[#667085]'
                    }`}>
                      {match.team1SetsWon}
                    </span>
                  </div>

                  {/* Team 2 Score Row */}
                  <div className={`flex items-center justify-between gap-3 py-1.5 rounded-lg px-2 mt-0.5 ${
                    isTeam2Winner ? 'bg-[#F0F2F6]' : ''
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs text-white border border-[#E4E7EC] shrink-0"
                        style={{ backgroundColor: match.team2.logoBg || '#182230' }}
                      >
                        {match.team2.shortName}
                      </div>
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className={`font-display text-sm truncate ${
                          isTeam2Winner ? 'font-extrabold text-[#182230]' : 'font-medium text-[#667085]'
                        }`}>
                          {match.team2.name}
                        </span>
                        {isTeam2Winner && (
                          <Trophy className="w-3.5 h-3.5 text-[#FF851B] shrink-0" />
                        )}
                      </div>
                    </div>

                    <span className={`font-score text-base min-w-[20px] text-right ${
                      isTeam2Winner ? 'font-black text-[#16803D]' : 'font-medium text-[#667085]'
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
                          className="px-2 py-0.5 rounded bg-[#F0F2F6] text-[10px] font-score text-[#667085] border border-[#E4E7EC]"
                        >
                          {set.team1Score}-{set.team2Score}
                        </span>
                      ))}
                      {match.matchDurationMinutes && (
                        <span className="text-[10px] text-[#667085] ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{match.matchDurationMinutes} min</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Link */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E4E7EC] text-[11px]">
                  <span className="text-[#667085]">
                    {match.completedAt || 'Official Result'}
                  </span>
                  <span className="font-bold text-[#16803D] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>View Match Summary</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E4E7EC] text-center shadow-sm">
          <p className="text-sm font-semibold text-[#182230] mb-1">
            No Completed Matches Recorded Yet
          </p>
          <p className="text-xs text-[#667085] max-w-sm mx-auto">
            Official scorecards will appear here once games conclude.
          </p>
        </div>
      )}
    </section>
  );
};
