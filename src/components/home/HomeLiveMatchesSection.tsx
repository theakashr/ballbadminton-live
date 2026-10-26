import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ArrowRight, MapPin } from 'lucide-react';
import type { Match } from '../../types';
import { LiveRadarBadge } from '../common/LiveRadarBadge';
import { nativeHaptics } from '../../lib/nativeBridge';

interface HomeLiveMatchesSectionProps {
  matches: Match[];
  onOpenDetails: (match: Match) => void;
}

export const HomeLiveMatchesSection: React.FC<HomeLiveMatchesSectionProps> = ({
  matches,
  onOpenDetails,
}) => {
  return (
    <section id="live-matches-section" className="my-8 sm:my-10">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#D92D20]/10 border border-[#D92D20]/30 text-[#D92D20]">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-lg sm:text-2xl text-[#182230] tracking-tight">
                Live Matches
              </h2>
              {matches.length > 0 && (
                <LiveRadarBadge label={`${matches.length} IN PLAY`} pulseColor="coral" size="sm" />
              )}
            </div>
            <p className="text-xs text-[#667085] hidden sm:block">
              Real-time court feeds direct from official tournament scorers
            </p>
          </div>
        </div>

        <Link
          to="/live"
          onClick={() => nativeHaptics.selection()}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#FF851B] hover:text-[#E96F0B] transition-colors"
        >
          <span>View All Live</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Matches Grid or Empty State */}
      {matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => {
            const currentSetScore = match.setScores[match.currentSet - 1] || { team1Score: 0, team2Score: 0 };
            const isTeam1Serving = match.servingTeamId === match.team1.id;
            const isTeam2Serving = match.servingTeamId === match.team2.id;

            return (
              <div
                key={match.id}
                onClick={() => {
                  nativeHaptics.impact('light');
                  onOpenDetails(match);
                }}
                className="group relative rounded-2xl bg-white hover:bg-[#F0F2F6] border border-[#E4E7EC] hover:border-[#FF851B]/60 p-4 sm:p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] transition-all duration-150 cursor-pointer active:scale-[0.98] flex flex-col justify-between"
              >
                <div>
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#E4E7EC]">
                    <span className="text-xs font-bold text-[#182230] truncate max-w-[170px]">
                      {match.tournamentName}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-[#667085] shrink-0">
                      <MapPin className="w-3 h-3 text-[#FF851B]" />
                      <span>{match.court}</span>
                    </div>
                  </div>

                  {/* Team 1 Row */}
                  <div className="flex items-center justify-between gap-3 py-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-xs text-white border border-[#E4E7EC] shrink-0"
                        style={{ backgroundColor: match.team1.logoBg || '#182230' }}
                      >
                        {match.team1.shortName}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-extrabold text-sm text-[#182230] truncate block">
                            {match.team1.name}
                          </span>
                          {isTeam1Serving && (
                            <span className="px-1.5 py-0.2 rounded bg-[#FFF1E5] border border-[#FF851B]/40 text-[9px] font-black text-[#FF851B] shrink-0">
                              {match.servingHand === 1 ? '1H' : '2H'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#667085]">{match.team1.state}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs text-[#667085] font-semibold">
                        ({match.team1SetsWon})
                      </span>
                      <span className={`font-score font-black text-xl sm:text-2xl min-w-[28px] text-right ${
                        isTeam1Serving ? 'text-[#FF851B]' : 'text-[#182230]'
                      }`}>
                        {currentSetScore.team1Score}
                      </span>
                    </div>
                  </div>

                  {/* Team 2 Row */}
                  <div className="flex items-center justify-between gap-3 py-1.5 mt-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-xs text-white border border-[#E4E7EC] shrink-0"
                        style={{ backgroundColor: match.team2.logoBg || '#182230' }}
                      >
                        {match.team2.shortName}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-extrabold text-sm text-[#182230] truncate block">
                            {match.team2.name}
                          </span>
                          {isTeam2Serving && (
                            <span className="px-1.5 py-0.2 rounded bg-[#FFF1E5] border border-[#FF851B]/40 text-[9px] font-black text-[#FF851B] shrink-0">
                              {match.servingHand === 1 ? '1H' : '2H'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#667085]">{match.team2.state}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs text-[#667085] font-semibold">
                        ({match.team2SetsWon})
                      </span>
                      <span className={`font-score font-black text-xl sm:text-2xl min-w-[28px] text-right ${
                        isTeam2Serving ? 'text-[#FF851B]' : 'text-[#182230]'
                      }`}>
                        {currentSetScore.team2Score}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer status / sets */}
                <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-[#E4E7EC] text-[11px] text-[#667085]">
                  <span className="text-[#D92D20] font-bold uppercase tracking-wider text-[10px]">
                    SET {match.currentSet} OF 3
                  </span>
                  <span className="font-semibold text-[#FF851B] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Watch Match</span>
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
            No Other Matches Currently On Court
          </p>
          <p className="text-xs text-[#667085] max-w-sm mx-auto mb-4">
            All active games in this session are completed or upcoming. Check the fixtures below.
          </p>
          <Link
            to="/live"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF851B] hover:underline"
          >
            <span>Explore All Match Schedules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
};
