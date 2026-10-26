import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  PlusCircle, 
  ArrowUpRight, 
  Shield, 
  Table, 
  X, 
  Search, 
  Radio 
} from 'lucide-react';
import { dataService } from '../services/dataService';
import type { AdminTournament } from '../types';
import { Badge } from '../components/common/Badge';
import { TournamentStandingsAndBrackets } from '../components/tournament/TournamentStandingsAndBrackets';
import { nativeHaptics } from '../lib/nativeBridge';

interface TournamentsPageProps {
  onCreateTournament: () => void;
}

export const TournamentsPage: React.FC<TournamentsPageProps> = ({
  onCreateTournament,
}) => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [selectedTournamentForModal, setSelectedTournamentForModal] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchTournaments = async () => {
      setIsLoading(true);
      try {
        const list = await dataService.getTournaments();
        if (isMounted) setTournaments(list);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTournaments();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTournaments = tournaments.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const text = `${t.name} ${t.organizer} ${t.city} ${t.venue} ${t.category}`.toLowerCase();
      if (!text.includes(q)) return false;
    }

    return true;
  });

  const handleOpenTournament = (tournamentId: string) => {
    nativeHaptics.selection();
    navigate(`/tournaments/${tournamentId}`);
  };

  return (
    <div className="pt-4 md:pt-24 pb-20">
      
      {/* Top Hero Header */}
      <div className="bg-slate-50 dark:bg-charcoal-950 border-b border-slate-200 dark:border-plum-900/60 py-10 sm:py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-brand-orange"></span>
                <span className="text-xs uppercase tracking-widest font-bold text-brand-orange">
                  Federation &amp; Collegiate Hub
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-slate-900 dark:text-soft-white tracking-tight">
                Tournaments Directory
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-muted-grey max-w-xl">
                Explore official championships, collegiate cups, and regional invitationals tracked live with real database records.
              </p>
            </div>

            <button
              onClick={() => {
                nativeHaptics.impact('light');
                onCreateTournament();
              }}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-brand-orange hover:bg-brand-orangeHover text-charcoal-950 shadow-orange-glow transition-all active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Create Tournament</span>
            </button>
          </div>

          {/* Search and Status Filters */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-charcoal-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 dark:text-muted-grey absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tournament, organizer, or city..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-800 text-slate-900 dark:text-soft-white placeholder:text-slate-400 dark:placeholder:text-muted-grey focus:outline-none focus:ring-2 focus:ring-brand-orange"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === 'all'
                    ? 'bg-brand-orange text-charcoal-950 font-bold shadow-sm'
                    : 'bg-white dark:bg-charcoal-900 text-slate-600 dark:text-muted-grey border border-slate-200 dark:border-charcoal-800'
                }`}
              >
                All ({tournaments.length})
              </button>

              <button
                onClick={() => setStatusFilter('live')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                  statusFilter === 'live'
                    ? 'bg-brand-coral text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-charcoal-900 text-slate-600 dark:text-muted-grey border border-slate-200 dark:border-charcoal-800'
                }`}
              >
                <Radio className="w-3 h-3 text-brand-coral" />
                <span>Live Now</span>
              </button>

              <button
                onClick={() => setStatusFilter('upcoming')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === 'upcoming'
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-charcoal-900 text-slate-600 dark:text-muted-grey border border-slate-200 dark:border-charcoal-800'
                }`}
              >
                Upcoming
              </button>

              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-charcoal-900 text-slate-600 dark:text-muted-grey border border-slate-200 dark:border-charcoal-800'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="bg-white dark:bg-charcoal-950/60 py-12 border-b border-slate-200 dark:border-charcoal-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-100 dark:bg-charcoal-900 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredTournaments.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleOpenTournament(t.id)}
                  className="group flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white dark:bg-charcoal-900 border border-slate-200/90 dark:border-plum-900/80 hover:border-brand-orange/60 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-md hover:shadow-xl cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <Badge variant={t.status === 'live' ? 'live' : 'upcoming'} pulse={t.status === 'live'} size="sm">
                        {t.status === 'live' ? 'Live on Courts' : t.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-600 dark:text-muted-grey font-semibold bg-slate-100 dark:bg-charcoal-800 px-2 py-0.5 rounded">
                        {t.format} Format
                      </span>
                    </div>

                    <h3 className="text-xl font-display font-bold text-slate-900 dark:text-soft-white group-hover:text-brand-orange transition-colors mb-2">
                      {t.name}
                    </h3>

                    <p className="text-xs text-brand-orange font-bold mb-4">
                      Org: {t.organizer}
                    </p>

                    <div className="space-y-2.5 text-xs text-slate-600 dark:text-muted-grey py-3.5 border-y border-slate-200 dark:border-charcoal-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-muted-grey" />
                        <span>{t.startDate} to {t.endDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-muted-grey" />
                        <span>{t.venue}, {t.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 dark:text-muted-grey" />
                        <span>{t.totalTeams} Participating Teams • {t.courtsCount} Outdoor Courts</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTournamentForModal({ id: t.id, name: t.name });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-plum-900/60 hover:bg-orange-100 dark:hover:bg-plum-850 text-slate-800 dark:text-soft-white font-semibold text-xs border border-orange-200 dark:border-plum-800 transition-colors"
                    >
                      <Table className="w-3.5 h-3.5 text-brand-orange" />
                      <span>Standings</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTournament(t.id);
                      }}
                      className="text-slate-900 dark:text-soft-white group-hover:text-brand-orange font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                    >
                      <span>View Tournament</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-brand-orange" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-plum-800 mb-12">
              <p className="text-slate-600 dark:text-muted-grey text-sm">
                No tournaments match your current filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-brand-orange text-charcoal-950 font-bold text-xs"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Callout Notice */}
          <div className="p-7 rounded-2xl bg-white dark:bg-charcoal-950 border border-slate-200 dark:border-plum-800/80 shadow-md dark:shadow-elevated flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-plum-800 flex items-center justify-center text-brand-orange shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-soft-white">
                  Hosting an Inter-School or College Tournament?
                </h4>
                <p className="text-xs text-slate-600 dark:text-muted-grey mt-0.5">
                  Get free digital umpire scoring pads, automated pool fixtures, and shareable live links for your court.
                </p>
              </div>
            </div>

            <button
              onClick={onCreateTournament}
              className="px-6 py-3 rounded-xl text-xs font-bold bg-brand-orange hover:bg-brand-orangeHover text-charcoal-950 shadow-orange-glow transition-all shrink-0"
            >
              Register Event
            </button>
          </div>

        </div>
      </div>

      {/* Standings & Brackets Modal */}
      {selectedTournamentForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-5xl my-8 bg-white dark:bg-charcoal-950 border border-slate-200 dark:border-plum-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedTournamentForModal(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 dark:bg-charcoal-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-soft-white hover:bg-slate-200 dark:hover:bg-plum-900/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <TournamentStandingsAndBrackets
              tournamentId={selectedTournamentForModal.id}
              tournamentName={selectedTournamentForModal.name}
            />
          </div>
        </div>
      )}

    </div>
  );
};
