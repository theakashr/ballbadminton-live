import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight, MapPin, Calendar, Users, PlusCircle } from 'lucide-react';
import type { AdminTournament } from '../../types';
import { nativeHaptics } from '../../lib/nativeBridge';

interface HomeFeaturedTournamentsSectionProps {
  tournaments: AdminTournament[];
  onCreateTournament: () => void;
}

export const HomeFeaturedTournamentsSection: React.FC<HomeFeaturedTournamentsSectionProps> = ({
  tournaments,
  onCreateTournament,
}) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded-full bg-[#D92D20]/10 border border-[#D92D20]/30 text-[10px] font-bold text-[#D92D20] uppercase tracking-wider">
            Active Now
          </span>
        );
      case 'upcoming':
        return (
          <span className="px-2 py-0.5 rounded-full bg-[#FFF1E5] border border-[#B54708]/30 text-[10px] font-bold text-[#B54708] uppercase tracking-wider">
            Upcoming
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full bg-[#16803D]/10 border border-[#16803D]/30 text-[10px] font-bold text-[#16803D] uppercase tracking-wider">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-[#FFF1E5] border border-[#FF851B]/30 text-[10px] font-bold text-[#FF851B] uppercase tracking-wider">
            Registration Open
          </span>
        );
    }
  };

  const handleTournamentClick = (id: string) => {
    nativeHaptics.impact('light');
    navigate(`/tournaments/${id}`);
  };

  return (
    <section id="featured-tournaments-section" className="my-8 sm:my-10">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#FFF1E5] border border-[#FF851B]/30 text-[#FF851B]">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg sm:text-2xl text-[#182230] tracking-tight">
              Featured Tournaments
            </h2>
            <p className="text-xs text-[#667085] hidden sm:block">
              National, State, and Inter-Collegiate championships
            </p>
          </div>
        </div>

        <Link
          to="/tournaments"
          onClick={() => nativeHaptics.selection()}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#FF851B] hover:text-[#E96F0B] transition-colors"
        >
          <span>View All Tournaments</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Tournaments Rail / Grid */}
      {tournaments.length > 0 ? (
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto snap-x snap-mandatory gap-3.5 sm:gap-5 pb-2.5 sm:pb-0 no-scrollbar card-rail">
          {tournaments.slice(0, 3).map((tournament) => (
            <div
              key={tournament.id}
              onClick={() => handleTournamentClick(tournament.id)}
              className="group relative rounded-2xl bg-white hover:bg-[#F0F2F6] border border-[#E4E7EC] hover:border-[#FF851B]/60 p-5 shadow-[0_1px_3px_rgba(16,24,40,0.05)] transition-all duration-150 cursor-pointer active:scale-[0.98] flex flex-col justify-between min-w-[280px] sm:min-w-0 flex-shrink-0 sm:flex-shrink snap-center"
            >
              <div>
                {/* Status & Format */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {getStatusBadge(tournament.status)}
                  <span className="text-[11px] font-semibold text-[#667085]">
                    {tournament.category || "Men's Open 5s"}
                  </span>
                </div>

                {/* Tournament Name */}
                <h3 className="font-display font-extrabold text-base sm:text-lg text-[#182230] group-hover:text-[#FF851B] transition-colors mb-2 line-clamp-1">
                  {tournament.name}
                </h3>

                {/* Venue & City */}
                <div className="flex items-center gap-1.5 text-xs text-[#667085] mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF851B] shrink-0" />
                  <span className="truncate">{tournament.venue || tournament.city || 'India'}</span>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-1.5 text-xs text-[#667085] mb-3">
                  <Calendar className="w-3.5 h-3.5 text-[#B54708] shrink-0" />
                  <span>
                    {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'TBD'}
                    {tournament.endDate ? ` - ${new Date(tournament.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                  </span>
                </div>
              </div>

              {/* Bottom Meta & Action */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#E4E7EC] text-xs">
                <div className="flex items-center gap-1.5 text-[#667085] font-medium">
                  <Users className="w-3.5 h-3.5 text-[#FF851B]" />
                  <span>{tournament.totalTeams || tournament.maxTeams || 16} Teams</span>
                </div>

                <span className="inline-flex items-center gap-1 font-bold text-[#FF851B] group-hover:translate-x-0.5 transition-transform">
                  <span>View Draws</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-[#E4E7EC] text-center shadow-sm">
          <p className="text-sm font-semibold text-[#182230] mb-2">
            No Tournaments Listed Yet
          </p>
          <button
            onClick={onCreateTournament}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF851B] text-white font-bold text-xs shadow-sm hover:bg-[#E96F0B] active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create the First Tournament</span>
          </button>
        </div>
      )}
    </section>
  );
};
