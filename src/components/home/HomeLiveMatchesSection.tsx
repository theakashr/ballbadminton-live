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
    <section id="live-matches-section" className="my-8 sm:my-12">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-brand-coral/15 border border-brand-coral/30 text-brand-coral">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-lg sm:text-2xl text-soft-white tracking-tight">
                Live Matches
              </h2>
              {matches.length > 0 && (
                <LiveRadarBadge label={`${matches.length} IN PLAY`} pulseColor="coral" size="sm" />
              )}
            </div>
            <p className="text-xs text-muted-grey hidden sm:block">
              Real-time court feeds direct from official tournament scorers
            </p>
          </div>
        </div>

        <Link
          to="/live"
          onClick={() => nativeHaptics.selection()}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-orange hover:text-brand-orangeHover transition-colors"
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
                className="group relative rounded-2xl bg-charcoal-900/90 hover:bg-plum-950/90 border border-plum-800/70 hover:border-brand-orange/60 p-4 sm:p-5 shadow-subtle transition-all duration-200 cursor-pointer active:scale-[0.98] flex flex-col justify-between"
              >
                <div>
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-plum-900/60">
                    <span className="text-xs font-bold text-soft-white truncate max-w-[170px]">
                      {match.tournamentName}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-muted-grey shrink-0">
                      <MapPin className="w-3 h-3 text-brand-orange" />
                      <span>{match.court}</span>
                    </div>
                  </div>

                  {/* Team 1 Row */}
                  <div className="flex items-center justify-between gap-3 py-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-xs text-white border border-plum-700 shrink-0"
                        style={{ backgroundColor: match.team1.logoBg || '#211329' }}
                      >
                        {match.team1.shortName}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-extrabold text-sm text-soft-white truncate block">
                            {match.team1.name}
                          </span>
                          {isTeam1Serving && (
                            <span className="px-1.5 py-0.2 rounded bg-brand-yellow/20 border border-brand-yellow/40 text-[9px] font-black text-brand-yellow shrink-0">
                              {match.servingHand === 1 ? '1H' : '2H'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-grey">{match.team1.state}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs text-muted-grey font-semibold">
                        ({match.team1SetsWon})
                      </span>
                      <span className={`font-score font-black text-xl sm:text-2xl min-w-[28px] text-right ${
                        isTeam1Serving ? 'text-brand-orange' : 'text-soft-white'
                      }`}>
                        {currentSetScore.team1Score}
                      </span>
                    </div>
                  </div>

                  {/* Team 2 Row */}
                  <div className="flex items-center justify-between gap-3 py-1.5 mt-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-xs text-white border border-plum-700 shrink-0"
                        style={{ backgroundColor: match.team2.logoBg || '#15131B' }}
                      >
                        {match.team2.shortName}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-extrabold text-sm text-soft-white truncate block">
                            {match.team2.name}
                          </span>
                          {isTeam2Serving && (
                            <span className="px-1.5 py-0.2 rounded bg-brand-yellow/20 border border-brand-yellow/40 text-[9px] font-black text-brand-yellow shrink-0">
                              {match.servingHand === 1 ? '1H' : '2H'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-grey">{match.team2.state}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs text-muted-grey font-semibold">
                        ({match.team2SetsWon})
                      </span>
                      <span className={`font-score font-black text-xl sm:text-2xl min-w-[28px] text-right ${
                        isTeam2Serving ? 'text-brand-orange' : 'text-soft-white'
                      }`}>
                        {currentSetScore.team2Score}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer status / sets */}
                <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-plum-900/50 text-[11px] text-muted-grey">
                  <span className="text-brand-coral font-bold uppercase tracking-wider text-[10px]">
                    SET {match.currentSet} OF 3
                  </span>
                  <span className="font-medium text-brand-orange group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Watch Match</span>
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
            No Other Matches Currently On Court
          </p>
          <p className="text-xs text-muted-grey max-w-sm mx-auto mb-4">
            All active games in this session are completed or upcoming. Check the fixtures below.
          </p>
          <Link
            to="/live"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline"
          >
            <span>Explore All Match Schedules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
};
