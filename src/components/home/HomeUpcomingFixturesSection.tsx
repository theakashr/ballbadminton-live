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
    <section id="upcoming-fixtures-section" className="my-8 sm:my-10">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#FFF1E5] border border-[#B54708]/30 text-[#B54708]">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg sm:text-2xl text-[#182230] tracking-tight">
              Upcoming Fixtures
            </h2>
            <p className="text-xs text-[#667085] hidden sm:block">
              Scheduled matches and confirmed court assignments
            </p>
          </div>
        </div>

        <Link
          to="/live"
          onClick={() => nativeHaptics.selection()}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#FF851B] hover:text-[#E96F0B] transition-colors"
        >
          <span>Full Schedule</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Fixtures Rail / Grid */}
      {fixtures.length > 0 ? (
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto snap-x snap-mandatory gap-3.5 sm:gap-4 pb-2.5 sm:pb-0 no-scrollbar card-rail">
          {fixtures.map((match) => (
            <div
              key={match.id}
              onClick={() => {
                nativeHaptics.impact('light');
                onOpenDetails(match);
              }}
              className="group relative rounded-2xl bg-white hover:bg-[#F0F2F6] border border-[#E4E7EC] hover:border-[#FF851B]/60 p-4 sm:p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] transition-all duration-150 cursor-pointer active:scale-[0.98] flex flex-col justify-between min-w-[280px] sm:min-w-0 flex-shrink-0 sm:flex-shrink snap-center"
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

                {/* Scheduled Time Banner */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#FFF1E5] border border-[#B54708]/20 text-xs text-[#B54708] font-semibold mb-3">
                  <Clock className="w-3.5 h-3.5 text-[#B54708] shrink-0" />
                  <span>Scheduled: {match.scheduledTime}</span>
                  {match.category && (
                    <span className="text-[#667085] ml-auto text-[10px] truncate max-w-[100px]">
                      {match.category}
                    </span>
                  )}
                </div>

                {/* Teams vs */}
                <div className="space-y-2 py-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs text-white border border-[#E4E7EC] shrink-0"
                      style={{ backgroundColor: match.team1.logoBg || '#182230' }}
                    >
                      {match.team1.shortName}
                    </div>
                    <span className="font-display font-bold text-sm text-[#182230] truncate">
                      {match.team1.name}
                    </span>
                    <span className="text-[10px] text-[#667085] ml-auto shrink-0">
                      {match.team1.state}
                    </span>
                  </div>

                  <div className="flex items-center justify-center -my-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#98A2B3] bg-[#F0F2F6] px-2 py-0.5 rounded-full border border-[#E4E7EC]">
                      VS
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs text-white border border-[#E4E7EC] shrink-0"
                      style={{ backgroundColor: match.team2.logoBg || '#182230' }}
                    >
                      {match.team2.shortName}
                    </div>
                    <span className="font-display font-bold text-sm text-[#182230] truncate">
                      {match.team2.name}
                    </span>
                    <span className="text-[10px] text-[#667085] ml-auto shrink-0">
                      {match.team2.state}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E4E7EC] text-[11px]">
                <span className="text-[#667085] font-medium">
                  3 Sets • 29 Pts
                </span>
                <span className="font-semibold text-[#FF851B] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>Match Details</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E4E7EC] text-center shadow-sm">
          <p className="text-sm font-semibold text-[#182230] mb-1">
            No Fixtures Currently Scheduled
          </p>
          <p className="text-xs text-[#667085] max-w-sm mx-auto mb-4">
            Tournament committee will publish the next order of play as soon as teams are confirmed.
          </p>
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF851B] hover:underline"
          >
            <span>Browse Tournaments &amp; Brackets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
};
