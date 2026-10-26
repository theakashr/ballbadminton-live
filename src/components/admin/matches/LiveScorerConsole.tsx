import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  RotateCcw, 
  X, 
  Pause, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeftRight, 
  UserCheck, 
  ShieldAlert,
  Sun,
  Moon,
  Eye,
  Trophy
} from 'lucide-react';
import { scoringService, getMatchVersion } from '../../../services/scoringService';
import { matchRepository } from '../../../repositories/matchRepository';
import { rosterRepository } from '../../../repositories/rosterRepository';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { AnimatedScoreDigit } from '../../common/AnimatedScoreDigit';
import { SlideToConfirm } from '../../common/SlideToConfirm';
import { InteractiveCourtView } from '../../court/InteractiveCourtView';
import { nativeHaptics, registerBackButtonListener } from '../../../lib/nativeBridge';
import type { Match, GameScore } from '../../../types';

interface LiveScorerConsoleProps {
  matchId: string;
  isOpen: boolean;
  onClose: () => void;
  onMatchUpdated: () => void;
}

export const LiveScorerConsole: React.FC<LiveScorerConsoleProps> = ({
  matchId,
  isOpen,
  onClose,
  onMatchUpdated,
}) => {
  const { currentUser, isSuperAdmin, isTournamentAdmin, isScorer, authBackend } = useAuth();
  const toast = useToast();

  const [match, setMatch] = useState<Match | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pauseReason, setPauseReason] = useState<string>('');
  const [isPausePromptOpen, setIsPausePromptOpen] = useState<boolean>(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState<boolean>(false);
  const [subTeamId, setSubTeamId] = useState<string>('');
  const [substitutionsCount, setSubstitutionsCount] = useState<Record<string, number>>({});
  const [isOutdoorMode, setIsOutdoorMode] = useState<boolean>(false);
  const [showCourtView, setShowCourtView] = useState<boolean>(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState<boolean>(false);

  const reloadMatch = () => {
    const data = matchRepository.getById(matchId);
    if (data) {
      setMatch(data);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadMatch();
    }
  }, [isOpen, matchId]);

  useEffect(() => {
    if (!isOpen) return;
    const cleanup = registerBackButtonListener(() => {
      onClose();
      return true;
    });
    return cleanup;
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      reloadMatch();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOpen || !match) return null;

  // Verify scoring authority
  const isAuthorizedToScore = 
    isSuperAdmin || 
    isTournamentAdmin || 
    (isScorer && (!match.scorerEmail || match.scorerEmail.toLowerCase() === currentUser?.email.toLowerCase()));

  const currentSetIndex = Math.max(0, match.currentSet - 1);
  const currentSetScore: GameScore = match.setScores[currentSetIndex] || {
    gameNumber: match.currentSet,
    team1Score: 0,
    team2Score: 0,
    isCompleted: false,
  };

  const targetPoints = match.maxPointsPerSet || 29;
  const isChangeOfEnds = 
    (currentSetScore.team1Score === 15 || currentSetScore.team2Score === 15) &&
    (currentSetScore.team1Score + currentSetScore.team2Score <= 31);

  // Award Point Handler with idempotency & concurrency protection
  const handleAwardPoint = async (awardedTeamId: string, eventType: 'rally_point' | 'ace' = 'rally_point') => {
    if (isSubmitting) return; // Prevent double taps
    if (!isOnline && authBackend === 'supabase') {
      setErrorMessage('Device is offline. Reconnect to Wi-Fi to resume authoritative match scoring.');
      return;
    }
    if (match.status !== 'live') {
      setErrorMessage(`Match is currently ${match.status.toUpperCase()}. Resume match to record points.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Haptic vibration on scoring devices
    nativeHaptics.impact('medium');

    const idempotencyKey = `pt-${match.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const currentVer = getMatchVersion(match.id);

    try {
      const res = await scoringService.recordPoint({
        matchId: match.id,
        awardedTeamId,
        eventType,
        expectedVersion: currentVer,
        idempotencyKey,
      });

      if (res.success && res.data) {
        toast.success(
          'Point Recorded',
          `${awardedTeamId === match.team1.id ? match.team1.shortName : match.team2.shortName} +1 (${res.data.team1Score} - ${res.data.team2Score})`
        );
        reloadMatch();
        onMatchUpdated();
      } else {
        setErrorMessage(res.error || 'Failed to record point.');
        toast.error('Scoring Error', res.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'System error while recording point.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Undo Last Point
  const handleUndo = async () => {
    if (isSubmitting) return;
    nativeHaptics.impact('light');
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await scoringService.undoLastPoint(match.id);
      if (res.success) {
        nativeHaptics.notification('warning');
        toast.info('Point Undone', 'Reverted previous rally score.');
        reloadMatch();
        onMatchUpdated();
      } else {
        setErrorMessage(res.error || 'Cannot undo score.');
        toast.error('Undo Failed', res.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start / Resume Match
  const handleStartOrResume = async () => {
    setIsSubmitting(true);
    try {
      const res = await scoringService.startMatch(match.id);
      if (res.success) {
        toast.success('Match Live', 'Live court tracking initialized.');
        reloadMatch();
        onMatchUpdated();
      } else {
        setErrorMessage(res.error || 'Could not start match.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pause Match
  const handlePause = async () => {
    setIsSubmitting(true);
    try {
      const res = await scoringService.pauseMatch(match.id, pauseReason || 'Official Court Time-out');
      if (res.success) {
        toast.info('Match Paused', 'Court play has been paused.');
        setIsPausePromptOpen(false);
        setPauseReason('');
        reloadMatch();
        onMatchUpdated();
      } else {
        setErrorMessage(res.error || 'Could not pause match.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete Match
  const handleComplete = async () => {
    if (!window.confirm('Are you sure you want to conclude and finalize this match victory? Scores will be locked.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await scoringService.completeMatch(match.id, 'Official Scorer Signature');
      if (res.success) {
        toast.success('Match Finalized', 'Results committed to official tournament standings.');
        reloadMatch();
        onMatchUpdated();
        onClose();
      } else {
        setErrorMessage(res.error || 'Could not complete match.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Perform In-game Substitution
  const handlePerformSubstitution = (_playerOutId: string, _playerInId: string) => {
    const currentSubs = substitutionsCount[subTeamId] || 0;
    if (currentSubs >= 3) {
      toast.error('Substitution Limit', 'BBFI regulations permit at most 3 substitutions per game.');
      return;
    }

    setSubstitutionsCount((prev) => ({
      ...prev,
      [subTeamId]: currentSubs + 1,
    }));

    toast.info('Substitution Recorded', `Player replaced. (${currentSubs + 1}/3 substitutions used in Game ${match.currentSet})`);
    setIsSubModalOpen(false);
  };

  const team1Roster = rosterRepository.getRoster(match.team1.id, match.tournamentId);
  const team2Roster = rosterRepository.getRoster(match.team2.id, match.tournamentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative w-full max-w-2xl bg-white border border-border-neutral rounded-2xl sm:rounded-3xl shadow-card-hover overflow-hidden z-10 my-8 transition-colors ${
        isOutdoorMode ? 'outdoor-contrast-mode' : ''
      }`}>
        
        {/* Header Bar */}
        <div className={`px-6 py-4 border-b border-border-neutral flex items-center justify-between ${
          isOutdoorMode ? 'bg-black border-amber-400' : 'bg-surface-muted'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-brand-orange">
                  {match.stage} • {match.court}
                </span>
                <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                  match.status === 'live'
                    ? 'bg-rose-50 text-status-live border border-status-live/30 animate-pulse'
                    : match.status === 'paused'
                    ? 'bg-amber-500/15 text-status-warning border border-amber-500/30'
                    : match.status === 'completed'
                    ? 'bg-surface-muted text-text-secondary border border-border-neutral'
                    : 'bg-brand-soft text-brand-orange border border-brand-orange/30'
                }`}>
                  {match.status}
                </span>
              </div>
              <h2 className="text-sm font-display font-bold text-text-primary truncate max-w-md">
                {match.team1.name} vs {match.team2.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Outdoor High Contrast Toggle */}
            <button
              onClick={() => setIsOutdoorMode(!isOutdoorMode)}
              className={`p-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                isOutdoorMode
                  ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                  : 'bg-white hover:bg-surface-muted text-text-secondary hover:text-text-primary border-border-neutral'
              }`}
              title="Toggle High-Contrast Outdoor Sunlight Mode"
            >
              {isOutdoorMode ? <Sun className="w-4 h-4 fill-black" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline">{isOutdoorMode ? 'Outdoor' : 'Sun Mode'}</span>
            </button>

            {/* Toggle Court Diagram */}
            <button
              onClick={() => setShowCourtView(!showCourtView)}
              className={`p-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                showCourtView
                  ? 'bg-brand-soft text-brand-orange border-brand-orange/30'
                  : 'bg-white hover:bg-surface-muted text-text-secondary hover:text-text-primary border-border-neutral'
              }`}
              title="Toggle 2D Tactical Court View"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Court</span>
            </button>

            <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Change of Ends Alert */}
        {isChangeOfEnds && (
          <div className="bg-brand-soft border-b border-brand-orange/30 px-6 py-2.5 flex items-center justify-between text-xs text-brand-orange font-bold">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              <span>BBFI RULE: 15 Points Reached — TEAMS MUST CHANGE ENDS NOW</span>
            </div>
            <span className="text-[11px] font-normal text-text-primary">Outdoor Red Clay Regulation</span>
          </div>
        )}

        {/* Authorization Alert */}
        {!isAuthorizedToScore && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 flex items-center gap-2 text-xs text-status-warning">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Read-Only Official View: Only the assigned scorer ({match.scorerEmail || 'Official Scorer'}) or Super Admin can record points.</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-status-live/30 px-6 py-2.5 flex items-center gap-2 text-xs text-status-live">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Main Scoreboard Display */}
          <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${
            isOutdoorMode ? 'outdoor-card' : 'bg-surface-muted border-border-neutral'
          }`}>
            {/* Team 1 Card */}
            <div className="flex-1 text-center">
              <span className={`text-xs font-bold block truncate px-2 ${
                isOutdoorMode ? 'text-white font-extrabold' : 'text-text-primary'
              }`}>
                {match.team1.name}
              </span>
              <div className="my-2">
                <AnimatedScoreDigit
                  score={currentSetScore.team1Score}
                  colorVariant={isOutdoorMode ? 'yellow' : 'orange'}
                  size="xl"
                  className={isOutdoorMode ? 'outdoor-score-t1' : ''}
                />
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[11px] text-text-secondary font-mono">
                  Sets: <strong className="text-text-primary">{match.team1SetsWon}</strong>
                </span>
                {match.servingTeamId === match.team1.id && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isOutdoorMode
                      ? 'bg-amber-400 text-black border border-black font-extrabold'
                      : 'bg-brand-orange text-white'
                  }`}>
                    SERVE ({match.servingHand === 1 ? '1st Hand' : '2nd Hand'})
                  </span>
                )}
              </div>
            </div>

            {/* Set & Hand Indicator Center */}
            <div className="px-4 text-center">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-brand-orange border border-border-neutral shadow-sm">
                SET {match.currentSet}
              </span>
              <span className="block text-[11px] text-text-secondary mt-2 font-mono">
                Target: {targetPoints} pts
              </span>
              <span className="block text-[10px] text-text-secondary">
                (Cap: {targetPoints + 4} pts)
              </span>
            </div>

            {/* Team 2 Card */}
            <div className="flex-1 text-center">
              <span className={`text-xs font-bold block truncate px-2 ${
                isOutdoorMode ? 'text-white font-extrabold' : 'text-text-primary'
              }`}>
                {match.team2.name}
              </span>
              <div className="my-2">
                <AnimatedScoreDigit
                  score={currentSetScore.team2Score}
                  colorVariant="coral"
                  size="xl"
                  className={isOutdoorMode ? 'outdoor-score-t2' : ''}
                />
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[11px] text-text-secondary font-mono">
                  Sets: <strong className="text-text-primary">{match.team2SetsWon}</strong>
                </span>
                {match.servingTeamId === match.team2.id && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isOutdoorMode
                      ? 'bg-cyan-400 text-black border border-black font-extrabold'
                      : 'bg-brand-orangeHover text-white'
                  }`}>
                    SERVE ({match.servingHand === 1 ? '1st Hand' : '2nd Hand'})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive 2D Tactical Court (Expandable) */}
          {showCourtView && (
            <div className="p-4 rounded-2xl bg-surface-muted border border-border-neutral animate-fade-in-up">
              <InteractiveCourtView
                team1={match.team1}
                team2={match.team2}
                servingTeamId={match.servingTeamId}
                servingHand={match.servingHand}
              />
            </div>
          )}

          {/* Offline Warning Banner for Disconnection Safety */}
          {!isOnline && authBackend === 'supabase' && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-status-warning flex items-start gap-2.5 text-left mb-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="block text-amber-800">Cloud Disconnected — Scoring Paused for Safety</strong>
                Your device is currently offline. To prevent desynchronized scores, point recording is disabled until Wi-Fi reconnects.
              </div>
            </div>
          )}

          {/* Point Action Buttons with Spring Tactile Physics */}
          {match.status === 'live' && isAuthorizedToScore ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={isSubmitting || (!isOnline && authBackend === 'supabase')}
                onClick={() => handleAwardPoint(match.team1.id, 'rally_point')}
                className={`tactile-btn py-5 px-6 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed font-display font-extrabold text-lg shadow-card flex flex-col items-center justify-center ${
                  isOutdoorMode
                    ? 'bg-amber-400 hover:bg-amber-300 text-black border-2 border-black'
                    : 'bg-brand-orange hover:bg-brand-orangeHover text-white'
                }`}
              >
                <span className="text-xl sm:text-2xl">+1 POINT</span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-90 truncate max-w-full">
                  {match.team1.shortName}
                </span>
              </button>

              <button
                type="button"
                disabled={isSubmitting || (!isOnline && authBackend === 'supabase')}
                onClick={() => handleAwardPoint(match.team2.id, 'rally_point')}
                className={`tactile-btn py-5 px-6 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed font-display font-extrabold text-lg shadow-card flex flex-col items-center justify-center ${
                  isOutdoorMode
                    ? 'bg-cyan-400 hover:bg-cyan-300 text-black border-2 border-black'
                    : 'bg-brand-orangeHover hover:bg-amber-700 text-white'
                }`}
              >
                <span className="text-xl sm:text-2xl">+1 POINT</span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-90 truncate max-w-full">
                  {match.team2.shortName}
                </span>
              </button>
            </div>
          ) : match.status !== 'live' ? (
            <div className="p-4 rounded-2xl bg-surface-muted border border-border-neutral text-center">
              <p className="text-xs text-text-secondary mb-3">
                Match is currently <strong className="text-text-primary uppercase">{match.status}</strong>.
              </p>
              {isAuthorizedToScore && (
                <button
                  type="button"
                  onClick={handleStartOrResume}
                  disabled={isSubmitting}
                  className="tactile-btn px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-card"
                >
                  {match.status === 'upcoming' ? 'Start Match (Snapshot Rules)' : 'Resume Court Play'}
                </button>
              )}
            </div>
          ) : null}

          {/* Controls: Undo, Pause/Resume, Substitutions, Finish */}
          <div className="pt-3 border-t border-border-neutral flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={isSubmitting || !isAuthorizedToScore || (currentSetScore.team1Score === 0 && currentSetScore.team2Score === 0)}
                className="tactile-btn px-3.5 py-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-border-neutral disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 text-brand-orange" />
                <span>Undo Point</span>
              </button>

              {match.status === 'live' && isAuthorizedToScore && (
                <button
                  type="button"
                  onClick={() => setIsPausePromptOpen(true)}
                  className="tactile-btn px-3.5 py-2 rounded-xl text-status-warning hover:bg-amber-50 border border-amber-500/30 flex items-center gap-1.5 shadow-sm"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Match</span>
                </button>
              )}

              {match.status === 'paused' && isAuthorizedToScore && (
                <button
                  type="button"
                  onClick={handleStartOrResume}
                  className="tactile-btn px-3.5 py-2 rounded-xl text-status-success hover:bg-emerald-50 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
              )}

              {isAuthorizedToScore && match.status === 'live' && (
                <button
                  type="button"
                  onClick={() => {
                    setSubTeamId(match.team1.id);
                    setIsSubModalOpen(true);
                  }}
                  className="tactile-btn px-3.5 py-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-border-neutral flex items-center gap-1.5 shadow-sm"
                >
                  <UserCheck className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Substitution</span>
                </button>
              )}
            </div>

            {isAuthorizedToScore && match.status !== 'completed' && (
              <button
                type="button"
                onClick={() => setIsFinalizeModalOpen(true)}
                disabled={isSubmitting}
                className="tactile-btn px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-status-success border border-emerald-500/30 font-bold flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Finalize Match</span>
              </button>
            )}
          </div>

          {/* Slide-to-Confirm Finalize Drawer */}
          {isFinalizeModalOpen && (
            <div className="p-5 rounded-2xl bg-surface-muted border border-emerald-500/40 space-y-3 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-status-success" />
                  <span className="font-bold text-xs text-text-primary">Finalize &amp; Lock Match Result</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFinalizeModalOpen(false)}
                  className="p-1 rounded text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-text-secondary">
                Slide slider below to declare official match conclusion. Standings and knockout progress will update immediately.
              </p>

              <SlideToConfirm
                label="Slide to Officially Complete Match"
                confirmedLabel="Match Finalized"
                variant="success"
                isLoading={isSubmitting}
                onConfirm={() => {
                  handleComplete();
                  setIsFinalizeModalOpen(false);
                }}
              />
            </div>
          )}

          {/* Pause Reason Modal Dialog */}
          {isPausePromptOpen && (
            <div className="p-4 rounded-2xl bg-surface-muted border border-amber-500/40 space-y-3">
              <span className="font-bold text-xs text-status-warning block">Pause Court Play: Reason</span>
              <input
                type="text"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g. Rain delay, court dampness, medical time-out"
                className="w-full px-3 py-2 rounded-xl bg-white border border-border-neutral text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPausePromptOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePause}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                >
                  Confirm Pause
                </button>
              </div>
            </div>
          )}

          {/* Substitution Modal Dialog */}
          {isSubModalOpen && (
            <div className="p-4 rounded-2xl bg-surface-muted border border-border-neutral space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border-neutral">
                <span className="font-bold text-text-primary">Record Court Substitution (Max 3/game)</span>
                <select
                  value={subTeamId}
                  onChange={(e) => setSubTeamId(e.target.value)}
                  className="bg-white px-2 py-1 rounded text-brand-orange border border-border-neutral font-bold"
                >
                  <option value={match.team1.id}>{match.team1.shortName}</option>
                  <option value={match.team2.id}>{match.team2.shortName}</option>
                </select>
              </div>

              <p className="text-[11px] text-text-secondary">
                Select player coming off court and substitute entering from bench:
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-status-live block mb-1">Player Out</span>
                  <select className="w-full bg-white p-2 rounded border border-border-neutral text-text-primary">
                    {(subTeamId === match.team1.id ? team1Roster : team2Roster).slice(0, 5).map((m) => (
                      <option key={m.playerId} value={m.playerId}>
                        #{m.jerseyNumber} {m.player?.name || 'Starter'} ({m.position})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-[11px] text-status-success block mb-1">Substitute In</span>
                  <select className="w-full bg-white p-2 rounded border border-border-neutral text-text-primary">
                    {(subTeamId === match.team1.id ? team1Roster : team2Roster).slice(5).map((m) => (
                      <option key={m.playerId} value={m.playerId}>
                        #{m.jerseyNumber} {m.player?.name || 'Bench'} ({m.position})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handlePerformSubstitution('p-out', 'p-in')}
                  className="px-4 py-1.5 rounded-lg font-bold bg-brand-orange text-white hover:bg-brand-orangeHover shadow-sm"
                >
                  Confirm Substitution
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
