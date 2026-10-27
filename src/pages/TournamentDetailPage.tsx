import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Trophy, 
  Shield, 
  Table, 
  GitFork, 
  Info, 
  ChevronRight, 
  Radio, 
  Clock, 
  CheckCircle2, 
  Share2 
} from 'lucide-react';
import { dataService } from '../services/dataService';
import type { AdminTournament, Match, TournamentTeamRegistration, TeamRosterMember } from '../types';
import { Badge } from '../components/common/Badge';
import { TournamentStandingsAndBrackets } from '../components/tournament/TournamentStandingsAndBrackets';
import { nativeHaptics } from '../lib/nativeBridge';

type DetailTab = 'matches' | 'teams' | 'standings' | 'knockout' | 'info';

export const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<AdminTournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [registeredTeams, setRegisteredTeams] = useState<TournamentTeamRegistration[]>([]);
  const [teamRosters, setTeamRosters] = useState<Record<string, TeamRosterMember[]>>({});
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<DetailTab>('matches');
  const [matchStatusFilter, setMatchStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const loadTournamentData = async () => {
      setIsLoading(true);
      try {
        const trn = await dataService.getTournamentById(id);
        const trnMatches = await dataService.getMatchesByTournament(id);
        const trnTeams = await dataService.getTournamentTeams(id);

        if (isMounted) {
          setTournament(trn || null);
          setMatches(trnMatches);
          setRegisteredTeams(trnTeams);

          // Preload rosters for participating teams
          const rostersMap: Record<string, TeamRosterMember[]> = {};
          for (const reg of trnTeams) {
            rostersMap[reg.teamId] = dataService.getTeamRoster(reg.teamId, id);
          }
          setTeamRosters(rostersMap);
        }
      } catch (err) {
        console.error('Error loading tournament details:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadTournamentData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleCopyLink = () => {
    nativeHaptics.impact('light');
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMatchClick = (matchId: string) => {
    nativeHaptics.selection();
    navigate(`/matches/${matchId}`);
  };

  const toggleTeamRoster = (teamId: string) => {
    nativeHaptics.impact('light');
    setExpandedTeamId(prev => prev === teamId ? null : teamId);
  };

  if (isLoading) {
    return (
      <div className="pt-8 md:pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-surface-muted rounded" />
          <div className="h-44 bg-surface-muted rounded-2xl" />
          <div className="h-10 w-full bg-surface-muted rounded-xl" />
          <div className="h-64 bg-surface-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="pt-8 md:pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="py-16 rounded-2xl bg-white border border-border-neutral p-8 shadow-card">
          <Trophy className="w-12 h-12 text-text-secondary mx-auto mb-3" />
          <h2 className="text-xl font-bold text-text-primary">Tournament Not Found</h2>
          <p className="text-xs text-text-secondary mt-1">
            The requested tournament ID &quot;{id}&quot; was not found in the official registry.
          </p>
          <button
            onClick={() => navigate('/tournaments')}
            className="mt-6 px-5 py-2.5 rounded-xl bg-brand-orange text-white font-bold text-xs shadow-card active:scale-95"
          >
            Back to Tournaments Directory
          </button>
        </div>
      </div>
    );
  }

  // Filter matches for this tournament
  const filteredMatches = matches.filter(m => {
    if (matchStatusFilter === 'all') return true;
    return m.status === matchStatusFilter;
  });

  const liveMatchesCount = matches.filter(m => m.status === 'live').length;
  const completedMatchesCount = matches.filter(m => m.status === 'completed').length;
  const upcomingMatchesCount = matches.filter(m => m.status === 'upcoming').length;

  return (
    <div className="pt-4 md:pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Top Breadcrumb & Share Action */}
      <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
        <button
          onClick={() => {
            nativeHaptics.selection();
            navigate('/tournaments');
          }}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tournaments Directory</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border-neutral text-xs font-medium text-text-secondary hover:text-text-primary shadow-sm active:scale-95 transition-all"
        >
          <Share2 className="w-3.5 h-3.5 text-brand-orange" />
          <span>{copied ? 'Link Copied!' : 'Share Tournament'}</span>
        </button>
      </div>

      {/* Main Tournament Hero Card */}
      <div className="rounded-2xl bg-white border border-border-neutral shadow-card overflow-hidden mb-8 transition-colors">
        
        {/* Header Ribbon */}
        <div className="px-6 py-4 bg-surface-muted border-b border-border-neutral flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge variant={tournament.status === 'live' ? 'live' : 'upcoming'} pulse={tournament.status === 'live'} size="sm">
              {tournament.status === 'live' ? 'LIVE ON COURTS' : tournament.status.toUpperCase()}
            </Badge>
            <span className="text-xs text-brand-orange font-bold uppercase tracking-wider">
              {tournament.format} Format • {tournament.category}
            </span>
          </div>

          <div className="text-xs text-text-secondary font-medium">
            DB ID: <code className="font-mono text-text-primary bg-surface-muted px-1.5 py-0.5 rounded border border-border-neutral">{tournament.id}</code>
          </div>
        </div>

        {/* Tournament Hero Content */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <span className="text-xs font-bold text-brand-orange uppercase tracking-wider block mb-1">
                Sanctioned by {tournament.organizer}
              </span>
              <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-text-primary tracking-tight">
                {tournament.name}
              </h1>
              {tournament.description && (
                <p className="mt-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
                  {tournament.description}
                </p>
              )}
            </div>

            {tournament.prizePool && (
              <div className="p-4 rounded-xl bg-brand-soft border border-brand-orange/30 shrink-0 self-start lg:self-auto text-left lg:text-right">
                <span className="text-[10px] uppercase font-bold text-brand-orange tracking-wider block">
                  Championship Prize
                </span>
                <span className="text-lg font-display font-black text-text-primary">
                  {tournament.prizePool}
                </span>
              </div>
            )}
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-6 pt-6 border-t border-border-neutral grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2 text-text-secondary">
              <Calendar className="w-4 h-4 text-brand-orange shrink-0" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-text-secondary">Dates</span>
                <span className="text-text-primary font-medium">{tournament.startDate} to {tournament.endDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-text-secondary">
              <MapPin className="w-4 h-4 text-brand-orange shrink-0" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-text-secondary">Venue &amp; City</span>
                <span className="text-text-primary font-medium truncate max-w-[160px]">{tournament.venue}, {tournament.city}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-text-secondary">
              <Users className="w-4 h-4 text-brand-orange shrink-0" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-text-secondary">Registered Squads</span>
                <span className="text-text-primary font-medium">{registeredTeams.length > 0 ? registeredTeams.length : tournament.totalTeams} Teams</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-text-secondary">
              <Shield className="w-4 h-4 text-brand-orange shrink-0" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-text-secondary">Surface / Courts</span>
                <span className="text-text-primary font-medium">{tournament.surfaceType || 'Outdoor Red Clay'} • {tournament.courtsCount} Courts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation Strip */}
        <div className="px-6 border-t border-border-neutral bg-surface-muted overflow-x-auto no-scrollbar flex items-center gap-2">
          <button
            onClick={() => {
              nativeHaptics.selection();
              setActiveTab('matches');
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'matches'
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Fixtures &amp; Matches ({matches.length})</span>
          </button>

          <button
            onClick={() => {
              nativeHaptics.selection();
              setActiveTab('teams');
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'teams'
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Teams &amp; Squads ({registeredTeams.length})</span>
          </button>

          <button
            onClick={() => {
              nativeHaptics.selection();
              setActiveTab('standings');
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'standings'
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Groups &amp; Standings</span>
          </button>

          <button
            onClick={() => {
              nativeHaptics.selection();
              setActiveTab('knockout');
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'knockout'
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Knockout Brackets</span>
          </button>

          <button
            onClick={() => {
              nativeHaptics.selection();
              setActiveTab('info');
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Tournament Info</span>
          </button>
        </div>

      </div>

      {/* ============================================================== */}
      {/* TAB CONTENT 1: FIXTURES & MATCHES */}
      {/* ============================================================== */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          {/* Sub-status Filter Buttons */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMatchStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  matchStatusFilter === 'all'
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'bg-white text-text-secondary border border-border-neutral'
                }`}
              >
                All Matches ({matches.length})
              </button>

              <button
                onClick={() => setMatchStatusFilter('live')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  matchStatusFilter === 'live'
                    ? 'bg-status-live text-white shadow-sm'
                    : 'bg-white text-text-secondary border border-border-neutral'
                }`}
              >
                <Radio className="w-3 h-3 text-status-live" />
                <span>Live ({liveMatchesCount})</span>
              </button>

              <button
                onClick={() => setMatchStatusFilter('upcoming')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  matchStatusFilter === 'upcoming'
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'bg-white text-text-secondary border border-border-neutral'
                }`}
              >
                Upcoming ({upcomingMatchesCount})
              </button>

              <button
                onClick={() => setMatchStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  matchStatusFilter === 'completed'
                    ? 'bg-status-success text-white shadow-sm'
                    : 'bg-white text-text-secondary border border-border-neutral'
                }`}
              >
                Completed ({completedMatchesCount})
              </button>
            </div>

            <span className="text-xs text-text-secondary">
              Filtered for {tournament.name}
            </span>
          </div>

          {/* Matches List */}
          {filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map(m => {
                const isLive = m.status === 'live';
                const isCompleted = m.status === 'completed';
                const currentSetScore = m.setScores[m.currentSet - 1] || { team1Score: 0, team2Score: 0 };

                return (
                  <div
                    key={m.id}
                    onClick={() => handleMatchClick(m.id)}
                    className="p-5 rounded-2xl bg-white border border-border-neutral hover:border-brand-orange/60 transition-all cursor-pointer shadow-card hover:shadow-card-hover active:scale-[0.99] flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-border-neutral text-xs">
                        <div className="flex items-center gap-2">
                          {isLive ? (
                            <span className="px-2 py-0.5 rounded-full bg-status-live/15 text-status-live font-bold text-[10px] animate-pulse">
                              LIVE ON COURT
                            </span>
                          ) : isCompleted ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-status-success font-bold text-[10px]">
                              FINAL RESULT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary font-bold text-[10px]">
                              SCHEDULED
                            </span>
                          )}
                          <span className="font-semibold text-text-primary">{m.stage}</span>
                        </div>

                        <span className="text-text-secondary font-medium">{m.court}</span>
                      </div>

                      {/* Teams & Score */}
                      <div className="space-y-3 py-1">
                        {/* Team 1 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                              style={{ backgroundColor: m.team1.logoBg || '#182230' }}
                            >
                              {m.team1.shortName}
                            </div>
                            <div>
                              <span className="font-display font-bold text-sm text-text-primary block">
                                {m.team1.name}
                              </span>
                              <span className="text-[10px] text-text-secondary">
                                {m.team1.state}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            {isLive ? (
                              <span className="font-score font-black text-xl text-brand-orange">
                                {currentSetScore.team1Score}
                              </span>
                            ) : isCompleted ? (
                              <span className={`font-score font-black text-xl ${
                                m.team1SetsWon > m.team2SetsWon ? 'text-brand-orange' : 'text-text-primary'
                              }`}>
                                {m.team1SetsWon}
                              </span>
                            ) : (
                              <span className="text-xs text-text-secondary">{m.scheduledTime}</span>
                            )}
                          </div>
                        </div>

                        {/* Team 2 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                              style={{ backgroundColor: m.team2.logoBg || '#475467' }}
                            >
                              {m.team2.shortName}
                            </div>
                            <div>
                              <span className="font-display font-bold text-sm text-text-primary block">
                                {m.team2.name}
                              </span>
                              <span className="text-[10px] text-text-secondary">
                                {m.team2.state}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            {isLive ? (
                              <span className="font-score font-black text-xl text-brand-orangeHover">
                                {currentSetScore.team2Score}
                              </span>
                            ) : isCompleted ? (
                              <span className={`font-score font-black text-xl ${
                                m.team2SetsWon > m.team1SetsWon ? 'text-brand-orange' : 'text-text-primary'
                              }`}>
                                {m.team2SetsWon}
                              </span>
                            ) : (
                              <span className="text-xs text-text-secondary">Sets: 0</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="mt-4 pt-3 border-t border-border-neutral flex items-center justify-between text-xs">
                      {isLive ? (
                        <span className="font-bold text-brand-orange text-[11px]">
                          Set {m.currentSet} of 3 (Target 29)
                        </span>
                      ) : isCompleted ? (
                        <span className="text-status-success font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Winner: {m.team1SetsWon > m.team2SetsWon ? m.team1.shortName : m.team2.shortName}</span>
                        </span>
                      ) : (
                        <span className="text-text-secondary">
                          Scheduled: {m.scheduledTime}
                        </span>
                      )}

                      <span className="font-bold text-brand-orange flex items-center gap-1">
                        <span>Open Scoreboard</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center rounded-2xl bg-white border border-border-neutral text-text-secondary">
              No matches found under this filter for {tournament.name}.
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT 2: TEAMS & SQUADS */}
      {/* ============================================================== */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-extrabold text-base text-text-primary">
              Participating Teams ({registeredTeams.length})
            </h3>
            <span className="text-xs text-text-secondary">
              Tap any team to inspect official starting fives and court positions
            </span>
          </div>

          {registeredTeams.length > 0 ? (
            <div className="space-y-3">
              {registeredTeams.map(reg => {
                const team = reg.team;
                if (!team) return null;
                const roster = teamRosters[reg.teamId] || [];
                const isExpanded = expandedTeamId === reg.teamId;

                return (
                  <div
                    key={reg.id}
                    className="rounded-2xl bg-white border border-border-neutral overflow-hidden shadow-card transition-all"
                  >
                    {/* Team Bar Header */}
                    <button
                      onClick={() => toggleTeamRoster(reg.teamId)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-surface-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: team.logoBg || '#182230' }}
                        >
                          {team.shortName}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-base text-text-primary">
                              {team.name}
                            </h4>
                            {reg.seedNumber && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-soft text-brand-orange border border-brand-orange/30">
                                Seed #{reg.seedNumber}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-text-secondary">
                            {team.city}, {team.state} • {reg.groupName || 'Pool A'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-brand-orange font-semibold hidden sm:block">
                          {isExpanded ? 'Hide Squad' : 'View Squad'}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? 'rotate-90 text-brand-orange' : ''}`} />
                      </div>
                    </button>

                    {/* Expandable Roster List */}
                    {isExpanded && (
                      <div className="p-5 bg-surface-muted border-t border-border-neutral">
                        <div className="flex items-center justify-between mb-3 text-xs text-text-secondary">
                          <span>Captain: <strong className="text-text-primary">{team.captainName}</strong></span>
                          <span>Coach: <strong className="text-text-primary">{team.coachName || 'Federation Official'}</strong></span>
                        </div>

                        {roster.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {roster.map(member => (
                              <div
                                key={member.id}
                                className="p-3 rounded-xl bg-white border border-border-neutral flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-bold text-text-primary block">
                                    #{member.jerseyNumber} {member.player?.name || `Player #${member.jerseyNumber}`}
                                    {member.isCaptain && <span className="text-brand-orange ml-1 font-extrabold">(C)</span>}
                                  </span>
                                  <span className="text-[10px] text-text-secondary">
                                    Pos: {member.position}
                                  </span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-muted text-text-primary font-semibold">
                                  {member.position === 'Front / Net' ? 'Smasher' : member.position === 'Centre / Pivot' ? 'Pivot' : member.position === 'Server' ? 'Server' : 'Base'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-text-secondary text-center py-4">
                            Squad members for this team are being finalized by team management.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center rounded-2xl bg-white border border-border-neutral text-text-secondary">
              Team registration records for this tournament are being processed.
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT 3: STANDINGS & GROUPS */}
      {/* ============================================================== */}
      {activeTab === 'standings' && (
        <TournamentStandingsAndBrackets
          tournamentId={tournament.id}
          tournamentName={tournament.name}
          initialTab="standings"
        />
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT 4: KNOCKOUT BRACKETS */}
      {/* ============================================================== */}
      {activeTab === 'knockout' && (
        <TournamentStandingsAndBrackets
          tournamentId={tournament.id}
          tournamentName={tournament.name}
          initialTab="knockout"
        />
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT 5: TOURNAMENT INFO & RULES */}
      {/* ============================================================== */}
      {activeTab === 'info' && (
        <div className="rounded-2xl bg-white border border-border-neutral p-6 sm:p-8 space-y-6 shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="space-y-4">
              <h4 className="font-display font-bold text-base text-text-primary flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-orange" />
                <span>Federation Specifications</span>
              </h4>
              <div className="space-y-2.5 text-text-secondary">
                <div className="p-3 rounded-xl bg-surface-muted border border-border-neutral">
                  <strong className="text-text-primary block mb-0.5">Scoring Engine</strong>
                  BBFI Standard 29-Point Traditional Rule. Best of 3 Sets.
                </div>
                <div className="p-3 rounded-xl bg-surface-muted border border-border-neutral">
                  <strong className="text-text-primary block mb-0.5">Court Surface &amp; Ball</strong>
                  {tournament.surfaceType || 'Outdoor Red Clay'} divided by 1.83m net. Standard {tournament.ballType || 'BBFI Standard Yellow Woollen Ball (27-30g)'}.
                </div>
                <div className="p-3 rounded-xl bg-surface-muted border border-border-neutral">
                  <strong className="text-text-primary block mb-0.5">Chief Referee &amp; Jury</strong>
                  {tournament.chiefReferee || 'BBFI Certified Senior Panel'}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-display font-bold text-base text-text-primary flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-orange" />
                <span>Host Venue &amp; Registration</span>
              </h4>
              <div className="space-y-2.5 text-text-secondary">
                <div className="p-3 rounded-xl bg-surface-muted border border-border-neutral">
                  <strong className="text-text-primary block mb-0.5">Venue Address</strong>
                  {tournament.venue}, {tournament.city} ({tournament.courtsCount} active courts)
                </div>
                <div className="p-3 rounded-xl bg-surface-muted border border-border-neutral">
                  <strong className="text-text-primary block mb-0.5">Official Contact</strong>
                  Email: {tournament.contactEmail || 'tournaments@bbfi.org'} • Phone: {tournament.contactPhone || '+91 94432 10987'}
                </div>
                <div className="p-3 rounded-xl bg-surface-muted border border-border-neutral">
                  <strong className="text-text-primary block mb-0.5">Prize Pool &amp; Trophies</strong>
                  {tournament.prizePool || 'Rolling Federation Trophy + Merit Medals'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
