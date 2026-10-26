import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Users, 
  Share2, 
  Layers, 
  ShieldCheck,
  Radio, 
  Flame,
  Trophy,
  CheckCircle2,
  Activity,
  History,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { LIVE_MATCHES, UPCOMING_MATCHES, RECENT_RESULTS, FEATURED_MATCH } from '../data/mockData';
import { matchRepository } from '../repositories/matchRepository';
import { dataService } from '../services/dataService';
import type { Match } from '../types';
import { Badge } from '../components/common/Badge';
import { AnimatedScoreDigit } from '../components/common/AnimatedScoreDigit';
import { LiveRadarBadge } from '../components/common/LiveRadarBadge';
import { InteractiveCourtView } from '../components/court/InteractiveCourtView';
import { useRealtimeMatch } from '../hooks/useRealtimeMatch';
import { useAuth } from '../context/AuthContext';
import { nativeHaptics } from '../lib/nativeBridge';

export const MatchCenterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canScoreMatches } = useAuth();
  const [courtTab, setCourtTab] = useState<'court' | 'list'>('court');
  const [isCourtFlipped, setIsCourtFlipped] = useState(false);

  // Fallback initial lookup
  const allMatches: Match[] = [
    ...matchRepository.getAll(),
    FEATURED_MATCH, 
    ...LIVE_MATCHES, 
    ...UPCOMING_MATCHES, 
    ...RECENT_RESULTS
  ];
  const initial = allMatches.find((m) => m.id === id) || FEATURED_MATCH;

  const [copied, setCopied] = useState(false);
  const [scoreEvents, setScoreEvents] = useState<any[]>([]);
  const [relatedTournamentMatches, setRelatedTournamentMatches] = useState<Match[]>([]);

  // Supabase Realtime Subscription
  const { match: realtimeMatch, status: realtimeStatus, isStale } = useRealtimeMatch(id);

  // Authoritative state derived from Realtime hook or local repository
  const match: Match = realtimeMatch || initial;

  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';
  const isCompleted = match.status === 'completed';

  const currentSetScore = match.setScores[match.currentSet - 1] || { team1Score: 0, team2Score: 0 };
  const isTeam1Serving = match.servingTeamId === match.team1.id;
  const isTeam2Serving = match.servingTeamId === match.team2.id;

  const isTeam1Winner = match.team1SetsWon > match.team2SetsWon;
  const winnerTeam = isTeam1Winner ? match.team1 : match.team2;

  // Fetch score events and other matches in tournament when match is loaded
  useEffect(() => {
    let isMounted = true;
    const fetchSupplementaryData = async () => {
      if (!match) return;

      try {
        const [events, otherMatches] = await Promise.all([
          dataService.getScoreEvents(match.id),
          dataService.getMatchesByTournament(match.tournamentId),
        ]);

        if (isMounted) {
          setScoreEvents(events);
          setRelatedTournamentMatches(otherMatches.filter(m => m.id !== match.id));
        }
      } catch (err) {
        console.warn('Could not fetch supplementary match data:', err);
      }
    };

    fetchSupplementaryData();
    return () => {
      isMounted = false;
    };
  }, [match.id, match.tournamentId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavigateBack = () => {
    nativeHaptics.selection();
    if (window.history.length > 1) {
      navigate(-1);
    } else if (isCompleted) {
      navigate('/results');
    } else if (isLive) {
      navigate('/live');
    } else {
      navigate('/tournaments');
    }
  };

  return (
    <div className="pt-4 md:pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
        <button
          onClick={handleNavigateBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isCompleted ? 'Back to Results' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          {match.tournamentId && (
            <Link
              to={`/tournaments/${match.tournamentId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-soft border border-brand-orange/30 text-xs font-semibold text-brand-orange hover:bg-orange-100 active:scale-95 transition-all"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tournament Hub</span>
            </Link>
          )}

          <button
            onClick={() => {
              nativeHaptics.impact('light');
              handleCopyLink();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border-neutral text-xs font-medium text-text-secondary hover:text-text-primary shadow-sm active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-brand-orange" />
            <span>{copied ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Broadcast Center Card */}
      <div className="rounded-2xl bg-white border border-border-neutral shadow-card overflow-hidden mb-8 transition-colors duration-300">
        
        {/* Tournament Bar Header */}
        <div className="px-6 py-4 bg-surface-muted border-b border-border-neutral flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isLive && <LiveRadarBadge label="LIVE ON COURT" pulseColor="coral" />}
            {isUpcoming && <Badge variant="upcoming" size="sm">UPCOMING FIXTURE</Badge>}
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-extrabold text-status-success">
                <CheckCircle2 className="w-3 h-3" />
                <span>FINAL RESULT • OFFICIAL SUMMARY</span>
              </span>
            )}
            {isLive && realtimeStatus === 'connected' && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-semibold text-status-success">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                <span>Realtime Stream</span>
              </span>
            )}
            {isLive && isStale && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-semibold text-status-warning">
                <span>Stale (Reconnecting...)</span>
              </span>
            )}
            <Link
              to={`/tournaments/${match.tournamentId}`}
              className="text-text-primary font-semibold text-sm hover:text-brand-orange hover:underline transition-colors"
            >
              {match.tournamentName}
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-orange" />
              <span>{match.court} • {match.venue}</span>
            </span>
            <span>•</span>
            <span className="text-text-primary font-medium">{match.category}</span>
          </div>
        </div>

        {/* Winner Announcement Banner (Only for Completed Matches) */}
        {isCompleted && (
          <div className="p-4 sm:p-5 bg-brand-soft border-b border-brand-orange/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-orange text-white shrink-0 shadow-sm">
                <Trophy className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-orange tracking-wider block">
                  Official Match Winner
                </span>
                <h3 className="font-display font-black text-lg sm:text-xl text-text-primary">
                  {winnerTeam.name} won by {isTeam1Winner ? `${match.team1SetsWon} - ${match.team2SetsWon}` : `${match.team2SetsWon} - ${match.team1SetsWon}`} sets
                </h3>
              </div>
            </div>

            {match.matchDurationMinutes && (
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-text-secondary block">Match Duration</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-text-primary">
                  {match.matchDurationMinutes} mins ({Math.floor(match.matchDurationMinutes / 60)}h {match.matchDurationMinutes % 60}m)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Big Score Arena */}
        <div className="p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Team 1 */}
            <div className="lg:col-span-5 flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-black text-2xl text-white border border-border-neutral shadow-sm shrink-0"
                style={{ backgroundColor: match.team1.logoBg || '#182230' }}
              >
                {match.team1.shortName}
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">
                  {match.team1.state}
                </span>
                <h2 className={`text-2xl sm:text-3xl font-display font-extrabold ${
                  isCompleted && isTeam1Winner ? 'text-brand-orange' : 'text-text-primary'
                }`}>
                  {match.team1.name}
                </h2>
                <span className="text-xs text-text-secondary">
                  Capt. {match.team1.captainName}
                </span>

                {isLive && isTeam1Serving && (
                  <div className="mt-1">
                    <span className="text-[10px] font-bold text-brand-orange bg-brand-soft px-2 py-0.5 rounded border border-brand-orange/30">
                      Serving • {match.servingHand === 1 ? '1st Hand' : '2nd Hand'}
                    </span>
                  </div>
                )}

                {isCompleted && isTeam1Winner && (
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-orange bg-brand-soft px-2 py-0.5 rounded border border-brand-orange/30">
                      <Trophy className="w-3 h-3" />
                      <span>Winner</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Score Center */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center text-center">
              {isLive && (
                <>
                  <div className="flex items-center justify-center gap-4 score-digits">
                    <div className="p-3.5 rounded-2xl bg-surface-muted border border-border-neutral min-w-[76px] shadow-sm">
                      <AnimatedScoreDigit
                        score={currentSetScore.team1Score}
                        colorVariant="orange"
                        size="xl"
                      />
                    </div>
                    <span className="text-text-secondary font-light text-2xl">:</span>
                    <div className="p-3.5 rounded-2xl bg-surface-muted border border-border-neutral min-w-[76px] shadow-sm">
                      <AnimatedScoreDigit
                        score={currentSetScore.team2Score}
                        colorVariant="coral"
                        size="xl"
                      />
                    </div>
                  </div>

                  {/* Momentum Surge Badge */}
                  {Math.abs(currentSetScore.team1Score - currentSetScore.team2Score) >= 3 && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-brand-soft border border-brand-orange/30 text-[10px] font-bold text-brand-orange animate-pulse">
                      <Flame className="w-3 h-3 fill-brand-orange" />
                      <span>
                        Surge: {currentSetScore.team1Score > currentSetScore.team2Score ? match.team1.shortName : match.team2.shortName} leads by {Math.abs(currentSetScore.team1Score - currentSetScore.team2Score)} pts
                      </span>
                    </div>
                  )}

                  <span className="text-[11px] font-bold uppercase text-brand-orange mt-2">
                    Set {match.currentSet} of 3 (Target {match.maxPointsPerSet || 29})
                  </span>
                  <span className="text-xs text-text-secondary mt-0.5 font-medium">
                    Sets Won: {match.team1SetsWon} - {match.team2SetsWon}
                  </span>

                  {/* Realtime Stream Status & Official Scorer Access */}
                  <div className="flex flex-col items-center gap-1.5 mt-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                      isStale
                        ? 'bg-amber-500/15 text-status-warning border border-amber-500/30'
                        : realtimeStatus === 'connected'
                        ? 'bg-emerald-500/10 text-status-success border border-emerald-500/25'
                        : 'bg-surface-muted border border-border-neutral text-text-secondary'
                    }`}>
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>{isStale ? 'Stale Connection (Reconnecting...)' : realtimeStatus === 'connected' ? 'Realtime Court Stream' : 'Official Authoritative Scoreboard'}</span>
                    </span>

                    {canScoreMatches && (
                      <Link
                        to="/admin/matches"
                        className="text-[10px] text-brand-orange hover:underline font-semibold flex items-center gap-1 mt-1"
                      >
                        <Flame className="w-3 h-3" />
                        <span>Court Scorer Console</span>
                      </Link>
                    )}
                  </div>
                </>
              )}

              {isCompleted && (
                <>
                  <div className="flex items-center justify-center gap-4 score-digits">
                    <span className={`text-5xl font-score font-black ${
                      isTeam1Winner ? 'text-brand-orange' : 'text-text-primary'
                    }`}>
                      {match.team1SetsWon}
                    </span>
                    <span className="text-text-secondary text-2xl">:</span>
                    <span className={`text-5xl font-score font-black ${
                      !isTeam1Winner ? 'text-brand-orange' : 'text-text-primary'
                    }`}>
                      {match.team2SetsWon}
                    </span>
                  </div>
                  <span className="text-xs uppercase font-bold text-text-secondary mt-2">
                    Final Sets Score (Best of 3)
                  </span>
                  <span className="text-[11px] font-semibold text-status-success mt-0.5">
                    Match Concluded (Read-Only)
                  </span>
                </>
              )}

              {isUpcoming && (
                <div className="text-center">
                  <Clock className="w-6 h-6 text-brand-orange mx-auto mb-1.5" />
                  <span className="text-xs text-text-secondary uppercase tracking-wider block">
                    Scheduled Start
                  </span>
                  <span className="text-sm font-bold text-text-primary">
                    {match.scheduledTime}
                  </span>
                </div>
              )}
            </div>

            {/* Team 2 */}
            <div className="lg:col-span-5 flex items-center justify-start lg:justify-end gap-4 text-left lg:text-right">
              <div className="order-2 lg:order-1">
                <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">
                  {match.team2.state}
                </span>
                <h2 className={`text-2xl sm:text-3xl font-display font-extrabold ${
                  isCompleted && !isTeam1Winner ? 'text-brand-orange' : 'text-text-primary'
                }`}>
                  {match.team2.name}
                </h2>
                <span className="text-xs text-text-secondary">
                  Capt. {match.team2.captainName}
                </span>

                {isLive && isTeam2Serving && (
                  <div className="mt-1">
                    <span className="text-[10px] font-bold text-brand-orangeHover bg-brand-soft px-2 py-0.5 rounded border border-brand-orange/30">
                      Serving • {match.servingHand === 1 ? '1st Hand' : '2nd Hand'}
                    </span>
                  </div>
                )}

                {isCompleted && !isTeam1Winner && (
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-orange bg-brand-soft px-2 py-0.5 rounded border border-brand-orange/30">
                      <Trophy className="w-3 h-3" />
                      <span>Winner</span>
                    </span>
                  </div>
                )}
              </div>

              <div
                className="order-1 lg:order-2 w-16 h-16 rounded-2xl flex items-center justify-center font-display font-black text-2xl text-white border border-border-neutral shadow-sm shrink-0"
                style={{ backgroundColor: match.team2.logoBg || '#475467' }}
              >
                {match.team2.shortName}
              </div>
            </div>

          </div>

          {/* ============================================================== */}
          {/* SECTION 1: SET-BY-SET OFFICIAL SCORECARD TABLE */}
          {/* ============================================================== */}
          {match.setScores.length > 0 && (
            <div className="mt-10 pt-6 border-t border-border-neutral">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-orange" />
                <span>Set-by-Set Official Scorecard (Target {match.maxPointsPerSet || 29} Pts)</span>
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-border-neutral bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted border-b border-border-neutral text-[10px] font-bold uppercase text-text-secondary">
                    <tr>
                      <th className="py-3 px-4">Set #</th>
                      <th className="py-3 px-4">{match.team1.shortName} Score</th>
                      <th className="py-3 px-4">{match.team2.shortName} Score</th>
                      <th className="py-3 px-4">Set Winner</th>
                      <th className="py-3 px-4 text-right">Set Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-neutral">
                    {match.setScores.map((set) => {
                      const isSetWinnerTeam1 = set.team1Score > set.team2Score;
                      const setWinnerName = isSetWinnerTeam1 ? match.team1.name : match.team2.name;

                      return (
                        <tr key={set.gameNumber} className="hover:bg-surface-muted/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-text-primary">
                            Set {set.gameNumber}
                          </td>
                          <td className={`py-3.5 px-4 font-score font-bold text-base ${
                            isSetWinnerTeam1 ? 'text-brand-orange' : 'text-text-primary'
                          }`}>
                            {set.team1Score}
                          </td>
                          <td className={`py-3.5 px-4 font-score font-bold text-base ${
                            !isSetWinnerTeam1 && set.isCompleted ? 'text-brand-orange' : 'text-text-primary'
                          }`}>
                            {set.team2Score}
                          </td>
                          <td className="py-3.5 px-4">
                            {set.isCompleted ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
                                <CheckCircle2 className="w-3.5 h-3.5 text-brand-orange" />
                                <span>{setWinnerName}</span>
                              </span>
                            ) : (
                              <span className="text-status-live font-bold animate-pulse">Set In Progress</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right text-text-secondary font-mono">
                            {set.durationMinutes ? `${set.durationMinutes} mins` : isLive ? 'Live' : 'Duration not recorded'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 2: MATCH STATISTICS & TELEMETRY */}
          {/* ============================================================== */}
          {isCompleted && (
            <div className="mt-8 pt-6 border-t border-border-neutral">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-orange" />
                <span>Recorded Match Statistics &amp; Service Telemetry</span>
              </h4>

              {scoreEvents.length > 0 ? (
                /* Actual recorded statistics calculated from score_events */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">Total Rallies</span>
                    <span className="text-xl font-mono font-black text-text-primary">{scoreEvents.length}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">Aces Recorded</span>
                    <span className="text-xl font-mono font-black text-brand-orange">
                      {scoreEvents.filter(e => e.event_type === 'ace').length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">Service Faults</span>
                    <span className="text-xl font-mono font-black text-status-live">
                      {scoreEvents.filter(e => e.event_type === 'service_fault').length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">Sets Contested</span>
                    <span className="text-xl font-mono font-black text-text-primary">{match.setScores.length}</span>
                  </div>
                </div>
              ) : (
                /* Honest empty notice when telemetry was not recorded in DB */
                <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral text-xs text-text-secondary">
                  Official statistical telemetry (individual aces, smashes, and faults) was not recorded for this archival fixture.
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 3: POINT-BY-POINT TIMELINE */}
          {/* ============================================================== */}
          {isCompleted && (
            <div className="mt-8 pt-6 border-t border-border-neutral">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-brand-orange" />
                <span>Point-by-Point Chronological Timeline</span>
              </h4>

              {scoreEvents.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {scoreEvents.map((event, idx) => (
                    <div
                      key={event.id || idx}
                      className="p-2.5 rounded-lg bg-surface-muted border border-border-neutral flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-text-secondary text-[10px]">#{event.sequence_number || idx + 1}</span>
                        <span className="font-bold text-text-primary capitalize">
                          {event.event_type?.replace('_', ' ') || 'Rally Point'}
                        </span>
                        <span className="text-text-secondary text-[10px]">(Set {event.game_number || 1})</span>
                      </div>
                      <div className="font-score font-bold text-brand-orange">
                        {event.team1_score_after} - {event.team2_score_after}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Honest notice when point history is unavailable */
                <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral text-xs text-text-secondary">
                  Detailed point-by-point event ledger was not captured for this archival fixture.
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 4: TACTICAL COURT & SQUADS */}
          {/* ============================================================== */}
          <div className="mt-8 pt-6 border-t border-border-neutral">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-orange" />
                <span>On-Court Squads &amp; Positional Formations</span>
              </h4>

              <div className="inline-flex p-1 rounded-xl bg-surface-muted border border-border-neutral self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCourtTab('court')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    courtTab === 'court'
                      ? 'bg-white text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Tactical 2D Court
                </button>
                <button
                  type="button"
                  onClick={() => setCourtTab('list')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    courtTab === 'list'
                      ? 'bg-white text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Squad Lists
                </button>
              </div>
            </div>

            {/* Tactical 2D Court View */}
            {courtTab === 'court' ? (
              <div className="p-4 rounded-2xl bg-surface-muted border border-border-neutral">
                <InteractiveCourtView
                  team1={match.team1}
                  team2={match.team2}
                  servingTeamId={match.servingTeamId}
                  servingHand={match.servingHand}
                  isFlipped={isCourtFlipped}
                  onToggleFlip={() => setIsCourtFlipped(!isCourtFlipped)}
                />
              </div>
            ) : (
              /* Squad Roster Lists */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
                {/* Team 1 Squad */}
                <div className="p-5 rounded-2xl bg-surface-muted border border-border-neutral">
                  <div className="flex items-center justify-between font-bold text-sm text-text-primary mb-3">
                    <span>{match.team1.name} (Fives)</span>
                    <span className="text-xs text-brand-orange font-normal">Coach: {match.team1.coachName || 'Federation'}</span>
                  </div>
                  <div className="space-y-2">
                    {match.team1.roster?.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border-neutral last:border-0">
                        <span className="text-text-primary">
                          #{p.number} {p.name} {p.isCaptain && <strong className="text-brand-orange">(C)</strong>}
                        </span>
                        <span className="text-[11px] text-text-secondary bg-white px-2 py-0.5 rounded border border-border-neutral">
                          {p.position}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team 2 Squad */}
                <div className="p-5 rounded-2xl bg-surface-muted border border-border-neutral">
                  <div className="flex items-center justify-between font-bold text-sm text-text-primary mb-3">
                    <span>{match.team2.name} (Fives)</span>
                    <span className="text-xs text-brand-orangeHover font-normal">Coach: {match.team2.coachName || 'Federation'}</span>
                  </div>
                  <div className="space-y-2">
                    {match.team2.roster?.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border-neutral last:border-0">
                        <span className="text-text-primary">
                          #{p.number} {p.name} {p.isCaptain && <strong className="text-brand-orangeHover">(C)</strong>}
                        </span>
                        <span className="text-[11px] text-text-secondary bg-white px-2 py-0.5 rounded border border-border-neutral">
                          {p.position}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* SECTION 5: RELATED TOURNAMENT & OTHER MATCHES */}
          {/* ============================================================== */}
          {relatedTournamentMatches.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border-neutral">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-brand-orange" />
                  <span>Other Matches in {match.tournamentName}</span>
                </h4>
                <Link
                  to={`/tournaments/${match.tournamentId}`}
                  className="text-xs text-brand-orange font-bold flex items-center gap-1 hover:underline"
                >
                  <span>View All Fixtures</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {relatedTournamentMatches.slice(0, 3).map((rm) => (
                  <div
                    key={rm.id}
                    onClick={() => {
                      nativeHaptics.selection();
                      navigate(`/matches/${rm.id}`);
                    }}
                    className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral hover:border-brand-orange/60 transition-all cursor-pointer shadow-sm hover:shadow-card-hover"
                  >
                    <div className="flex items-center justify-between text-[10px] text-text-secondary mb-1.5">
                      <span>{rm.stage}</span>
                      <span className="font-bold uppercase text-brand-orange">{rm.status}</span>
                    </div>
                    <div className="font-bold text-xs text-text-primary truncate mb-1">
                      {rm.team1.shortName} vs {rm.team2.shortName}
                    </div>
                    <div className="text-[11px] text-text-secondary flex items-center justify-between">
                      <span>{rm.court}</span>
                      <span className="text-brand-orange font-bold flex items-center gap-0.5">
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Verification Protocol Note */}
          <div className="mt-8 p-4 rounded-xl bg-brand-soft border border-brand-orange/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
            <div className="text-xs text-text-secondary">
              <strong className="text-text-primary block mb-0.5">Ball Badminton Federation Scorer Protocol</strong>
              Referee in charge: {match.referee || 'B. Ramachandra (BBFI Grade A)'}. Points counted under outdoor 29-point set regulations with yellow wool ball. Real-time updates streamed via Supabase Realtime backend.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
