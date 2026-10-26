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
          <span className="px-2 py-0.5 rounded-full bg-brand-coral/20 border border-brand-coral/40 text-[10px] font-bold text-brand-coral uppercase tracking-wider">
            Active Now
          </span>
        );
      case 'upcoming':
        return (
          <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-[10px] font-bold text-sky-400 uppercase tracking-wider">
            Upcoming
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-brand-orange/20 border border-brand-orange/40 text-[10px] font-bold text-brand-orange uppercase tracking-wider">
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
    <section id="featured-tournaments-section" className="my-8 sm:my-12">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-brand-orange/15 border border-brand-orange/30 text-brand-orange">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg sm:text-2xl text-soft-white tracking-tight">
              Featured Tournaments
            </h2>
            <p className="text-xs text-muted-grey hidden sm:block">
              National, State, and Inter-Collegiate championships
            </p>
          </div>
        </div>

        <Link
          to="/tournaments"
          onClick={() => nativeHaptics.selection()}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-orange hover:text-brand-orangeHover transition-colors"
        >
          <span>View All Tournaments</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Tournaments Grid */}
      {tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {tournaments.slice(0, 3).map((tournament) => (
            <div
              key={tournament.id}
              onClick={() => handleTournamentClick(tournament.id)}
              className="group relative rounded-2xl bg-charcoal-900/90 hover:bg-plum-950/90 border border-plum-800/70 hover:border-brand-orange/60 p-5 shadow-subtle transition-all duration-200 cursor-pointer active:scale-[0.98] flex flex-col justify-between"
            >
              <div>
                {/* Status & Format */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {getStatusBadge(tournament.status)}
                  <span className="text-[11px] font-semibold text-muted-grey">
                    {tournament.category || "Men's Open 5s"}
                  </span>
                </div>

                {/* Tournament Name */}
                <h3 className="font-display font-extrabold text-base sm:text-lg text-soft-white group-hover:text-brand-orange transition-colors mb-2 line-clamp-1">
                  {tournament.name}
                </h3>

                {/* Venue & City */}
                <div className="flex items-center gap-1.5 text-xs text-muted-grey mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                  <span className="truncate">{tournament.venue || tournament.city || 'India'}</span>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-1.5 text-xs text-muted-grey mb-3">
                  <Calendar className="w-3.5 h-3.5 text-brand-coral shrink-0" />
                  <span>
                    {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'TBD'}
                    {tournament.endDate ? ` - ${new Date(tournament.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                  </span>
                </div>
              </div>

              {/* Bottom Meta & Action */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-plum-900/50 text-xs">
                <div className="flex items-center gap-1.5 text-muted-grey font-medium">
                  <Users className="w-3.5 h-3.5 text-brand-yellow" />
                  <span>{tournament.totalTeams || tournament.maxTeams || 16} Teams</span>
                </div>

                <span className="inline-flex items-center gap-1 font-bold text-brand-orange group-hover:translate-x-0.5 transition-transform">
                  <span>View Draws</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-charcoal-900/70 border border-plum-800/50 text-center">
          <p className="text-sm font-semibold text-soft-white mb-2">
            No Tournaments Listed Yet
          </p>
          <button
            onClick={onCreateTournament}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-orange text-charcoal-950 font-bold text-xs shadow-orange-glow active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create the First Tournament</span>
          </button>
        </div>
      )}
    </section>
  );
};
