import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  UserCheck, 
  Flame, 
  CalendarClock, 
  CheckCircle2, 
  PlusCircle, 
  UserPlus, 
  CalendarPlus, 
  ClipboardCheck, 
  Clock, 
  ArrowRight,
  Activity,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { StatCard } from '../../components/admin/common/StatCard';
import { StatusBadge } from '../../components/admin/common/StatusBadge';
import { tournamentRepository } from '../../repositories/tournamentRepository';
import { teamRepository } from '../../repositories/teamRepository';
import { playerRepository } from '../../repositories/playerRepository';
import { matchRepository } from '../../repositories/matchRepository';
import { activityRepository } from '../../repositories/activityRepository';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { Match, ActivityLog, AdminTournament } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [teamsCount, setTeamsCount] = useState(0);
  const [playersCount, setPlayersCount] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTournaments(tournamentRepository.getAll());
    setTeamsCount(teamRepository.getAll().length);
    setPlayersCount(playerRepository.getAll().length);
    setMatches(matchRepository.getAll());
    setActivities(activityRepository.getAll());
  };

  const liveMatches = matches.filter((m) => m.status === 'live');
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming');
  const completedMatches = matches.filter((m) => m.status === 'completed');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-plum-950 via-plum-900 to-charcoal-900 border border-plum-800 shadow-elevated">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Ball Badminton Tournament Command Center
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold text-soft-white tracking-tight">
            Welcome back, {currentUser?.name || 'Administrator'}
          </h1>
          <p className="text-xs text-muted-grey max-w-xl leading-relaxed">
            Manage official BBFI tournaments, approve team rosters, schedule clay-court fixtures, and supervise live 5s match scoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/tournaments?action=new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-charcoal-950 font-bold text-xs shadow-orange-glow transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Create Tournament</span>
          </button>

          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-muted-grey hover:text-soft-white border border-charcoal-700 transition-colors"
            title="Refresh dashboard stats"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Stat Cards Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-grey">
            Platform Statistics &amp; Metrics
          </h2>
          <span className="text-[11px] text-muted-grey flex items-center gap-1.5">
            <span>Storage:</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
              isSupabaseConfigured()
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-brand-yellow border border-amber-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-400' : 'bg-brand-yellow'}`} />
              {isSupabaseConfigured() ? 'Supabase PostgreSQL (Cloud)' : 'Local Prototype Repository'}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard
            title="Tournaments"
            value={tournaments.length}
            subtitle={`${tournaments.filter(t => t.status === 'live').length} active`}
            icon={Trophy}
            accentColor="yellow"
            onClick={() => navigate('/admin/tournaments')}
          />
          <StatCard
            title="Teams"
            value={teamsCount}
            subtitle="Registered"
            icon={Users}
            accentColor="orange"
            onClick={() => navigate('/admin/teams')}
          />
          <StatCard
            title="Players"
            value={playersCount}
            subtitle="Verified"
            icon={UserCheck}
            accentColor="plum"
            onClick={() => navigate('/admin/players')}
          />
          <StatCard
            title="Live Matches"
            value={liveMatches.length}
            subtitle="On court now"
            icon={Flame}
            accentColor="coral"
            onClick={() => navigate('/admin/matches')}
          />
          <StatCard
            title="Upcoming"
            value={upcomingMatches.length}
            subtitle="Scheduled"
            icon={CalendarClock}
            accentColor="purple"
            onClick={() => navigate('/admin/matches')}
          />
          <StatCard
            title="Completed"
            value={completedMatches.length}
            subtitle="Results posted"
            icon={CheckCircle2}
            accentColor="orange"
            onClick={() => navigate('/admin/matches')}
          />
        </div>
      </div>

      {/* 2. Quick Actions Section */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-grey mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/tournaments?action=new')}
            className="p-4 rounded-xl bg-charcoal-900 hover:bg-plum-950 border border-plum-800/80 hover:border-brand-orange/40 text-left transition-all duration-200 group flex items-start gap-3 shadow-subtle"
          >
            <div className="p-2.5 rounded-lg bg-brand-orange/15 text-brand-orange border border-brand-orange/30 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs font-bold text-soft-white group-hover:text-brand-orange transition-colors">
                Create Tournament
              </p>
              <p className="text-[11px] text-muted-grey mt-0.5 leading-relaxed">
                Configure dates, 5s rules, courts &amp; registration
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/teams?action=new')}
            className="p-4 rounded-xl bg-charcoal-900 hover:bg-plum-950 border border-plum-800/80 hover:border-brand-orange/40 text-left transition-all duration-200 group flex items-start gap-3 shadow-subtle"
          >
            <div className="p-2.5 rounded-lg bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/30 group-hover:scale-105 transition-transform">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs font-bold text-soft-white group-hover:text-brand-yellow transition-colors">
                Register New Team
              </p>
              <p className="text-[11px] text-muted-grey mt-0.5 leading-relaxed">
                Add state association, club &amp; squad roster
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/matches?action=new')}
            className="p-4 rounded-xl bg-charcoal-900 hover:bg-plum-950 border border-plum-800/80 hover:border-brand-orange/40 text-left transition-all duration-200 group flex items-start gap-3 shadow-subtle"
          >
            <div className="p-2.5 rounded-lg bg-brand-coral/15 text-brand-coral border border-brand-coral/30 group-hover:scale-105 transition-transform">
              <CalendarPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs font-bold text-soft-white group-hover:text-brand-coral transition-colors">
                Schedule Match
              </p>
              <p className="text-[11px] text-muted-grey mt-0.5 leading-relaxed">
                Set court, time slot, stage &amp; opposing teams
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/scorers?action=assign')}
            className="p-4 rounded-xl bg-charcoal-900 hover:bg-plum-950 border border-plum-800/80 hover:border-brand-orange/40 text-left transition-all duration-200 group flex items-start gap-3 shadow-subtle"
          >
            <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 group-hover:scale-105 transition-transform">
              <ClipboardCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs font-bold text-soft-white group-hover:text-purple-300 transition-colors">
                Assign Court Scorer
              </p>
              <p className="text-[11px] text-muted-grey mt-0.5 leading-relaxed">
                Assign certified BBFI umpires to live courts
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Upcoming Fixtures & Live Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-brand-coral" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-soft-white">
                Active Court Rallies &amp; Upcoming Fixtures
              </h2>
            </div>
            <button
              onClick={() => navigate('/admin/matches')}
              className="text-xs text-brand-orange hover:underline font-semibold flex items-center gap-1"
            >
              <span>View All Matches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {matches.slice(0, 4).map((match) => (
              <div
                key={match.id}
                className="p-4 rounded-xl bg-charcoal-900 border border-plum-800 hover:border-plum-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={match.status} size="sm" pulse={match.status === 'live'} />
                    <span className="text-[11px] font-semibold text-muted-grey truncate">
                      {match.tournamentName}
                    </span>
                    <span className="text-[10px] text-charcoal-600">•</span>
                    <span className="text-[11px] text-brand-orange font-medium">
                      {match.stage}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-soft-white truncate">
                      {match.team1.name}
                    </span>
                    <span className="text-xs font-bold text-muted-grey px-2 py-0.5 rounded bg-charcoal-950">
                      VS
                    </span>
                    <span className="text-sm font-bold text-soft-white truncate">
                      {match.team2.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-grey">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted-grey" />
                      {match.scheduledTime}
                    </span>
                    <span>•</span>
                    <span className="truncate">{match.court}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-charcoal-800">
                  {match.status === 'live' && (
                    <div className="text-right px-3 py-1.5 rounded-lg bg-plum-950 border border-brand-coral/30">
                      <p className="text-[10px] uppercase font-bold text-brand-coral">Set {match.currentSet}</p>
                      <p className="text-sm font-mono font-bold text-soft-white">
                        {match.setScores[match.currentSet - 1]?.team1Score ?? 0} - {match.setScores[match.currentSet - 1]?.team2Score ?? 0}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/admin/matches`)}
                    className="px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-xs font-semibold text-soft-white border border-charcoal-700 transition-colors"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Recent Tournament Activity Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-orange" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-soft-white">
                Recent Admin Activity
              </h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-plum-950 text-muted-grey border border-plum-800">
              Live Log
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-charcoal-900 border border-plum-800 space-y-4 shadow-subtle">
            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs pb-3 border-b border-charcoal-800 last:border-0 last:pb-0">
                  <div className="w-7 h-7 rounded-lg bg-plum-950 border border-plum-800 flex items-center justify-center shrink-0 text-brand-orange mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-soft-white leading-tight">
                      {act.action}
                    </p>
                    <p className="text-[11px] text-brand-orange truncate mt-0.5 font-medium">
                      {act.entityName}
                    </p>
                    {act.details && (
                      <p className="text-[11px] text-muted-grey mt-0.5 leading-snug">
                        {act.details}
                      </p>
                    )}
                    <span className="text-[10px] text-muted-grey/70 block mt-1">
                      By {act.userName} • {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-charcoal-800 text-center">
              <button
                onClick={() => navigate('/admin/settings')}
                className="text-xs text-brand-orange hover:underline font-medium"
              >
                View Audit &amp; Platform Settings →
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
