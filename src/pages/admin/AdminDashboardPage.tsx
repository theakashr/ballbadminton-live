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
  RefreshCw, 
  Shield, 
  Sliders, 
  Play, 
  Check, 
  X, 
  FileText
} from 'lucide-react';
import { StatCard } from '../../components/admin/common/StatCard';
import { StatusBadge } from '../../components/admin/common/StatusBadge';
import { LiveScorerConsole } from '../../components/admin/matches/LiveScorerConsole';
import { tournamentRepository } from '../../repositories/tournamentRepository';
import { teamRepository } from '../../repositories/teamRepository';
import { playerRepository } from '../../repositories/playerRepository';
import { matchRepository } from '../../repositories/matchRepository';
import { activityRepository } from '../../repositories/activityRepository';
import { scorerRepository } from '../../repositories/scorerRepository';
import { useAuth, SUPER_ADMIN_EMAIL } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { Match, ActivityLog, AdminTournament } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isSuperAdmin, isTournamentAdmin, isScorer } = useAuth();

  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [teamsCount, setTeamsCount] = useState(0);
  const [playersCount, setPlayersCount] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Scorer Command Center States
  const [scorerTab, setScorerTab] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
  const [verificationMatch, setVerificationMatch] = useState<Match | null>(null);

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

  // Filter matches assigned to the active scorer
  const isMatchAssignedToCurrentScorer = (match: Match) => {
    if (!currentUser) return false;
    if (isSuperAdmin || isTournamentAdmin) return true;
    
    // 1. Direct match scorer email match
    if (match.scorerEmail && match.scorerEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      return true;
    }

    // 2. Scorer assignment repository record
    const assignment = scorerRepository.getByMatchId(match.id);
    if (assignment && assignment.scorerEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      return true;
    }

    // 3. Fallback for demo matches when user is demo umpire
    if (currentUser.email === 'ramachandra.umpire@bbfi.org' && (match.id === 'match-live-01' || match.id === 'match-up-01')) {
      return true;
    }

    // 4. Matches within scoped assigned tournaments if unassigned
    if (currentUser.assignedTournaments && currentUser.assignedTournaments.includes(match.tournamentId)) {
      return !match.scorerEmail;
    }

    return false;
  };

  const scorerAssignedMatches = matches.filter(isMatchAssignedToCurrentScorer);
  const scorerLiveMatches = scorerAssignedMatches.filter((m) => m.status === 'live');
  const scorerUpcomingMatches = scorerAssignedMatches.filter((m) => m.status === 'upcoming');
  const scorerCompletedMatches = scorerAssignedMatches.filter((m) => m.status === 'completed');

  const filteredScorerMatches = scorerAssignedMatches.filter((m) => {
    if (scorerTab === 'live') return m.status === 'live';
    if (scorerTab === 'upcoming') return m.status === 'upcoming';
    if (scorerTab === 'completed') return m.status === 'completed';
    return true;
  });

  // Dedicated Official Scorer Command Center (for official_scorer role)
  if (isScorer && !isSuperAdmin && !isTournamentAdmin) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Scorer Welcome Banner */}
        <div className="p-6 rounded-2xl bg-white border border-border-neutral shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-soft text-brand-orange border border-brand-orange/30 text-xs font-bold uppercase tracking-wider">
                  BBFI Certified Scorer
                </span>
                <span className="text-xs text-text-secondary">
                  Grade A Umpire
                </span>
              </div>
              <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
                Scorer Command Center — {currentUser?.name}
              </h1>
              <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
                Authorized court umpire terminal. Record authoritative points, set outcomes, service hand rotations, and official match scorecards.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="p-2.5 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-secondary hover:text-text-primary border border-border-neutral transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Refresh Assigned Matches"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scorer Key Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div
            onClick={() => setScorerTab('live')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              scorerTab === 'live'
                ? 'bg-red-50/70 border-red-300 ring-2 ring-red-200'
                : 'bg-white border-border-neutral hover:border-brand-orange/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Live Now
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-status-live animate-ping" />
            </div>
            <p className="text-2xl font-display font-bold text-text-primary mt-2">
              {scorerLiveMatches.length}
            </p>
            <p className="text-[10px] text-text-secondary mt-0.5">Active Rallies</p>
          </div>

          <div
            onClick={() => setScorerTab('upcoming')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              scorerTab === 'upcoming'
                ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-200'
                : 'bg-white border-border-neutral hover:border-brand-orange/40'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
              Upcoming
            </span>
            <p className="text-2xl font-display font-bold text-text-primary mt-2">
              {scorerUpcomingMatches.length}
            </p>
            <p className="text-[10px] text-text-secondary mt-0.5">Assigned Court Slots</p>
          </div>

          <div
            onClick={() => setScorerTab('completed')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              scorerTab === 'completed'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-200'
                : 'bg-white border-border-neutral hover:border-brand-orange/40'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
              Completed
            </span>
            <p className="text-2xl font-display font-bold text-text-primary mt-2">
              {scorerCompletedMatches.length}
            </p>
            <p className="text-[10px] text-text-secondary mt-0.5">Scorecards Submitted</p>
          </div>
        </div>

        {/* Assigned Matches List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-display font-bold text-text-primary">
                Assigned Court Matches ({scorerAssignedMatches.length})
              </h2>
              <p className="text-xs text-text-secondary">
                Tap any assigned fixture to verify rosters and launch the mobile scoring console.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-muted border border-border-neutral">
              {(['all', 'live', 'upcoming', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setScorerTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    scorerTab === tab
                      ? 'bg-white text-brand-orange shadow-sm border border-border-neutral'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredScorerMatches.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-border-neutral text-center space-y-3">
              <ClipboardCheck className="w-10 h-10 text-text-secondary mx-auto" />
              <p className="text-sm font-semibold text-text-primary">No Matches in this view</p>
              <p className="text-xs text-text-secondary">
                You have no matches currently matching the "{scorerTab}" filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScorerMatches.map((m) => {
                const isLive = m.status === 'live';
                const isUpcoming = m.status === 'upcoming';
                return (
                  <div
                    key={m.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-border-neutral shadow-card hover:border-brand-orange/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={m.status} size="sm" pulse={isLive} />
                          <span className="text-xs font-bold text-brand-orange">{m.stage}</span>
                          <span className="text-xs text-text-secondary">•</span>
                          <span className="text-xs text-text-secondary font-medium">{m.court}</span>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-1">{m.tournamentName}</p>
                      </div>

                      <span className="text-xs font-medium text-text-secondary bg-surface-muted px-2.5 py-1 rounded-lg border border-border-neutral shrink-0">
                        {m.scheduledTime}
                      </span>
                    </div>

                    {/* Team Matchup Card */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-muted border border-border-neutral">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white uppercase shrink-0"
                          style={{ backgroundColor: m.team1.logoBg || '#211329' }}
                        >
                          {m.team1.shortName.slice(0, 2)}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-sm text-text-primary block truncate">
                            {m.team1.name}
                          </span>
                          <span className="text-[10px] text-text-secondary">
                            Captain: {m.team1.captainName || 'Verified'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 min-w-0 justify-end text-right">
                        <div className="truncate">
                          <span className="font-bold text-sm text-text-primary block truncate">
                            {m.team2.name}
                          </span>
                          <span className="text-[10px] text-text-secondary">
                            Captain: {m.team2.captainName || 'Verified'}
                          </span>
                        </div>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white uppercase shrink-0"
                          style={{ backgroundColor: m.team2.logoBg || '#15131B' }}
                        >
                          {m.team2.shortName.slice(0, 2)}
                        </div>
                      </div>
                    </div>

                    {/* Live Scoreline or Action CTAs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      {isLive ? (
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-md bg-red-50 text-status-live font-bold text-xs border border-red-200">
                            Set {m.currentSet} in Progress
                          </span>
                          <span className="font-mono font-bold text-base text-text-primary">
                            {m.setScores[m.currentSet - 1]?.team1Score ?? 0} - {m.setScores[m.currentSet - 1]?.team2Score ?? 0}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-text-secondary">
                          Category: <strong className="text-text-primary">{m.category}</strong>
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        {isLive && (
                          <button
                            onClick={() => setScoringMatch(m)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Resume Live Scoring</span>
                          </button>
                        )}

                        {isUpcoming && (
                          <button
                            onClick={() => setVerificationMatch(m)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            <span>Verify Rosters &amp; Start</span>
                          </button>
                        )}

                        {m.status === 'completed' && (
                          <button
                            onClick={() => navigate(`/matches/${m.id}`)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface-muted hover:bg-border-neutral text-xs font-semibold text-text-primary border border-border-neutral transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Final Scorecard</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pre-Match Lineup Verification Modal */}
        {verificationMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm"
              onClick={() => setVerificationMatch(null)}
            />
            <div className="relative w-full max-w-lg bg-white border border-border-neutral rounded-2xl shadow-elevated p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-border-neutral">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-bold text-text-primary">
                      Pre-Match Verification
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Umpire Lineup &amp; Court Certification
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setVerificationMatch(null)}
                  className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Match Particulars */}
              <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Tournament:</span>
                  <span className="font-semibold text-text-primary truncate max-w-[240px]">
                    {verificationMatch.tournamentName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Court:</span>
                  <span className="font-semibold text-brand-orange">{verificationMatch.court}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Stage &amp; Category:</span>
                  <span className="font-semibold text-text-primary">
                    {verificationMatch.stage} • {verificationMatch.category}
                  </span>
                </div>
              </div>

              {/* Teams & Squads Verification */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Playing Squads (5 Starting Players Each)
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-border-neutral bg-white space-y-1.5">
                    <p className="font-bold text-xs text-text-primary">{verificationMatch.team1.name}</p>
                    <p className="text-[11px] text-text-secondary">
                      Captain: <strong className="text-text-primary">{verificationMatch.team1.captainName || 'Confirmed'}</strong>
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-status-success font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>5 Starters Checked</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-border-neutral bg-white space-y-1.5">
                    <p className="font-bold text-xs text-text-primary">{verificationMatch.team2.name}</p>
                    <p className="text-[11px] text-text-secondary">
                      Captain: <strong className="text-text-primary">{verificationMatch.team2.captainName || 'Confirmed'}</strong>
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-status-success font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>5 Starters Checked</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BBFI Rule Parameters Confirmation */}
              <div className="p-3 rounded-xl bg-brand-soft/50 border border-brand-orange/20 text-xs text-text-secondary space-y-1">
                <p className="font-bold text-text-primary">Official BBFI Match Rules:</p>
                <p>• Target: 29 points per set (Best of 3 sets)</p>
                <p>• Service: 2-Hand system with rotation after 2 faults</p>
                <p>• Equipment: Approved Yellow Woollen Ball</p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-border-neutral flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setVerificationMatch(null)}
                  className="px-4 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary border border-border-neutral hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const matchToScore = verificationMatch;
                    setVerificationMatch(null);
                    setScoringMatch(matchToScore);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Authorize &amp; Launch Scorer Console</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Scorer Console */}
        {scoringMatch && (
          <LiveScorerConsole
            matchId={scoringMatch.id}
            isOpen={Boolean(scoringMatch)}
            onClose={() => setScoringMatch(null)}
            onMatchUpdated={loadData}
          />
        )}
      </div>
    );
  }

  // Admin & Organizer Dashboard View
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-border-neutral shadow-card">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {isSuperAdmin
                ? 'Super Admin Platform Command Center'
                : isTournamentAdmin
                ? 'Tournament Director Command Center'
                : 'Ball Badminton Tournament Portal'}
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
            Welcome back, {currentUser?.name || 'Administrator'}
          </h1>
          <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
            {isSuperAdmin
              ? `Designated Primary Authority: ${SUPER_ADMIN_EMAIL}. Full permissions to govern tournaments, users, and official scoring parameters.`
              : isTournamentAdmin
              ? 'Organize matches, verify team rosters, schedule court slots, and assign official umpires.'
              : 'Observer desk. View live matches, standings, and completed championship results.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {(isSuperAdmin || isTournamentAdmin) && (
            <button
              onClick={() => navigate('/admin/tournaments?action=new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Create Tournament</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-surface-muted hover:bg-border-neutral text-text-secondary hover:text-text-primary border border-border-neutral transition-colors"
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
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Platform Statistics &amp; Metrics
          </h2>
          <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
            <span>Storage:</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                isSupabaseConfigured()
                  ? 'bg-emerald-50 text-status-success border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSupabaseConfigured() ? 'bg-status-success' : 'bg-amber-500'
                }`}
              />
              {isSupabaseConfigured() ? 'Supabase PostgreSQL (Cloud)' : 'Local Prototype Repository'}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard
            title="Tournaments"
            value={tournaments.length}
            subtitle={`${tournaments.filter((t) => t.status === 'live').length} active`}
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

      {/* 2. Role-Specific Quick Actions Section */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(isSuperAdmin || isTournamentAdmin) && (
            <>
              <button
                onClick={() => navigate('/admin/tournaments?action=new')}
                className="p-4 rounded-xl bg-white hover:bg-brand-soft/50 border border-border-neutral hover:border-brand-orange/40 text-left transition-all duration-200 group flex items-start gap-3 shadow-card"
              >
                <div className="p-2.5 rounded-lg bg-brand-soft text-brand-orange border border-brand-orange/20 group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary group-hover:text-brand-orange transition-colors">
                    Create Tournament
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    Configure dates, 5s rules, courts &amp; registration
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/teams?action=new')}
                className="p-4 rounded-xl bg-white hover:bg-brand-soft/50 border border-border-neutral hover:border-brand-orange/40 text-left transition-all duration-200 group flex items-start gap-3 shadow-card"
              >
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 group-hover:scale-105 transition-transform">
                  <UserPlus className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary group-hover:text-brand-orange transition-colors">
                    Register New Team
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    Add state association, club &amp; squad roster
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/matches?action=new')}
                className="p-4 rounded-xl bg-white hover:bg-brand-soft/50 border border-border-neutral hover:border-brand-orange/40 text-left transition-all duration-200 group flex items-start gap-3 shadow-card"
              >
                <div className="p-2.5 rounded-lg bg-red-50 text-status-live border border-red-200 group-hover:scale-105 transition-transform">
                  <CalendarPlus className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary group-hover:text-brand-orange transition-colors">
                    Schedule Match
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    Set court, time slot, stage &amp; opposing teams
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/scorers?action=assign')}
                className="p-4 rounded-xl bg-white hover:bg-brand-soft/50 border border-border-neutral hover:border-brand-orange/40 text-left transition-all duration-200 group flex items-start gap-3 shadow-card"
              >
                <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 group-hover:scale-105 transition-transform">
                  <ClipboardCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary group-hover:text-brand-orange transition-colors">
                    Assign Court Scorer
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    Assign certified BBFI umpires to live courts
                  </p>
                </div>
              </button>
            </>
          )}

          {isSuperAdmin && (
            <>
              <button
                onClick={() => navigate('/admin/settings')}
                className="p-4 rounded-xl bg-white hover:bg-brand-soft/50 border border-border-neutral hover:border-brand-orange/40 text-left transition-all duration-200 group flex items-start gap-3 shadow-card"
              >
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary group-hover:text-brand-orange transition-colors">
                    Access Governance
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    Grant, edit, or revoke official dashboard access
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/settings')}
                className="p-4 rounded-xl bg-white hover:bg-brand-soft/50 border border-border-neutral hover:border-brand-orange/40 text-left transition-all duration-200 group flex items-start gap-3 shadow-card"
              >
                <div className="p-2.5 rounded-lg bg-brand-soft text-brand-orange border border-brand-orange/20 group-hover:scale-105 transition-transform">
                  <Sliders className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary group-hover:text-brand-orange transition-colors">
                    BBFI Rule Configuration
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    29 points/set, 2-hand service, overtime rules
                  </p>
                </div>
              </button>
            </>
          )}

          {!isSuperAdmin && !isTournamentAdmin && (
            <>
              <button
                onClick={() => navigate('/live')}
                className="p-4 rounded-xl bg-white hover:bg-brand-soft/50 border border-border-neutral hover:border-brand-orange/40 text-left transition-all duration-200 group flex items-start gap-3 shadow-card"
              >
                <div className="p-2.5 rounded-lg bg-red-50 text-status-live border border-red-200 group-hover:scale-105 transition-transform">
                  <Flame className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary group-hover:text-brand-orange transition-colors">
                    Live Scoreboards
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    Spectate ongoing court matches in real time
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate('/results')}
                className="p-4 rounded-xl bg-white hover:bg-brand-soft/50 border border-border-neutral hover:border-brand-orange/40 text-left transition-all duration-200 group flex items-start gap-3 shadow-card"
              >
                <div className="p-2.5 rounded-lg bg-emerald-50 text-status-success border border-emerald-200 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary group-hover:text-brand-orange transition-colors">
                    Completed Results
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    Inspect official match summaries &amp; scores
                  </p>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. Upcoming Fixtures & Live Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-status-live" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
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
                className="p-4 rounded-xl bg-white border border-border-neutral hover:border-brand-orange/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={match.status} size="sm" pulse={match.status === 'live'} />
                    <span className="text-[11px] font-semibold text-text-secondary truncate">
                      {match.tournamentName}
                    </span>
                    <span className="text-[10px] text-border-neutral">•</span>
                    <span className="text-[11px] text-brand-orange font-medium">
                      {match.stage}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-text-primary truncate">
                      {match.team1.name}
                    </span>
                    <span className="text-xs font-bold text-text-secondary px-2 py-0.5 rounded bg-surface-muted">
                      VS
                    </span>
                    <span className="text-sm font-bold text-text-primary truncate">
                      {match.team2.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-text-secondary" />
                      {match.scheduledTime}
                    </span>
                    <span>•</span>
                    <span className="truncate">{match.court}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-neutral">
                  {match.status === 'live' && (
                    <div className="text-right px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-[10px] uppercase font-bold text-status-live">
                        Set {match.currentSet}
                      </p>
                      <p className="text-sm font-mono font-bold text-text-primary">
                        {match.setScores[match.currentSet - 1]?.team1Score ?? 0} -{' '}
                        {match.setScores[match.currentSet - 1]?.team2Score ?? 0}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/admin/matches`)}
                    className="px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-border-neutral text-xs font-semibold text-text-primary border border-border-neutral transition-colors"
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
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
                Recent Admin Activity
              </h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-surface-muted text-text-secondary border border-border-neutral">
              Live Log
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-border-neutral space-y-4 shadow-card">
            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 text-xs pb-3 border-b border-border-neutral last:border-0 last:pb-0"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-soft border border-brand-orange/20 flex items-center justify-center shrink-0 text-brand-orange mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary leading-tight">{act.action}</p>
                    <p className="text-[11px] text-brand-orange truncate mt-0.5 font-medium">
                      {act.entityName}
                    </p>
                    {act.details && (
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                        {act.details}
                      </p>
                    )}
                    <span className="text-[10px] text-text-secondary/70 block mt-1">
                      By {act.userName} •{' '}
                      {new Date(act.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border-neutral text-center">
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
