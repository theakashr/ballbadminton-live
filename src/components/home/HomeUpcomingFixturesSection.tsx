import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, MapPin, Clock } from 'lucide-react';
import type { Match } from '../../types';
import { nativeHaptics } from '../../lib/nativeBridge';

interface HomeUpcomingFixturesSectionProps {
  fixtures: Match[];
  onOpenDetails: (match: Match) => void;
}

export const HomeUpcomingFixturesSection: React.FC<HomeUpcomingFixturesSectionProps> = ({
  fixtures,
  onOpenDetails,
}) => {
  return (
    <section id="upcoming-fixtures-section" className="my-8 sm:my-12">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg sm:text-2xl text-soft-white tracking-tight">
              Upcoming Fixtures
            </h2>
            <p className="text-xs text-muted-grey hidden sm:block">
              Scheduled matches and confirmed court assignments
            </p>
          </div>
        </div>

        <Link
          to="/live"
          onClick={() => nativeHaptics.selection()}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-400 hover:text-sky-300 transition-colors"
        >
          <span>Full Schedule</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Fixtures Grid or Empty State */}
      {fixtures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fixtures.map((match) => (
            <div
              key={match.id}
              onClick={() => {
                nativeHaptics.impact('light');
                onOpenDetails(match);
              }}
              className="group relative rounded-2xl bg-charcoal-900/90 hover:bg-plum-950/90 border border-plum-800/70 hover:border-sky-500/60 p-4 sm:p-5 shadow-subtle transition-all duration-200 cursor-pointer active:scale-[0.98] flex flex-col justify-between"
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

                {/* Scheduled Time Banner */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-plum-900/50 border border-plum-800/50 text-xs text-sky-300 font-semibold mb-3">
                  <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Scheduled: {match.scheduledTime}</span>
                  {match.category && (
                    <span className="text-muted-grey ml-auto text-[10px] truncate max-w-[100px]">
                      {match.category}
                    </span>
                  )}
                </div>

                {/* Teams vs */}
                <div className="space-y-2 py-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs text-white border border-plum-700 shrink-0"
                      style={{ backgroundColor: match.team1.logoBg || '#211329' }}
                    >
                      {match.team1.shortName}
                    </div>
                    <span className="font-display font-bold text-sm text-soft-white truncate">
                      {match.team1.name}
                    </span>
                    <span className="text-[10px] text-muted-grey ml-auto shrink-0">
                      {match.team1.state}
                    </span>
                  </div>

                  <div className="flex items-center justify-center -my-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-plum-600 bg-charcoal-950 px-2 py-0.5 rounded-full border border-plum-900">
                      VS
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs text-white border border-plum-700 shrink-0"
                      style={{ backgroundColor: match.team2.logoBg || '#15131B' }}
                    >
                      {match.team2.shortName}
                    </div>
                    <span className="font-display font-bold text-sm text-soft-white truncate">
                      {match.team2.name}
                    </span>
                    <span className="text-[10px] text-muted-grey ml-auto shrink-0">
                      {match.team2.state}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-plum-900/50 text-[11px]">
                <span className="text-sky-400 font-semibold">
                  3 Sets • 29 Pts
                </span>
                <span className="font-medium text-sky-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>Match Details</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-2xl bg-charcoal-900/70 border border-plum-800/50 text-center">
          <p className="text-sm font-semibold text-soft-white mb-1">
            No Fixtures Currently Scheduled
          </p>
          <p className="text-xs text-muted-grey max-w-sm mx-auto mb-4">
            Tournament committee will publish the next order of play as soon as teams are confirmed.
          </p>
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 hover:underline"
          >
            <span>Browse Tournaments &amp; Brackets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
};
