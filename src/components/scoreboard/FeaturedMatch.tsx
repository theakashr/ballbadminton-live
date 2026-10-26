import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  MapPin, 
  Info, 
  ArrowUpRight, 
  RefreshCw, 
  Flame
} from 'lucide-react';
import type { Match } from '../../types';
import { Badge } from '../common/Badge';
import { useRealtimeMatch } from '../../hooks/useRealtimeMatch';
import { nativeHaptics } from '../../lib/nativeBridge';

interface FeaturedMatchProps {
  initialMatch: Match;
  onOpenDetails: (match: Match) => void;
}

export const FeaturedMatch: React.FC<FeaturedMatchProps> = ({
  initialMatch,
  onOpenDetails,
}) => {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [lastPointTeam, setLastPointTeam] = useState<string | null>(null);

  const { match: realtimeMatch, status } = useRealtimeMatch(initialMatch.id);

  useEffect(() => {
    if (realtimeMatch) {
      setMatch(realtimeMatch);
    }
  }, [realtimeMatch]);

  // Interactive live point simulation for demonstration
  const handleSimulateRally = () => {
    nativeHaptics.impact('light');
    setMatch((prev) => {
      // Alternate scoring or score team 1
      const isTeam1 = Math.random() > 0.45;
      const teamId = isTeam1 ? prev.team1.id : prev.team2.id;
      setLastPointTeam(teamId);

      const updatedSetScores = prev.setScores.map((set, idx) => {
        if (idx === prev.currentSet - 1) {
          const newTeam1Score = isTeam1 ? set.team1Score + 1 : set.team1Score;
          const newTeam2Score = !isTeam1 ? set.team2Score + 1 : set.team2Score;
          return {
            ...set,
            team1Score: newTeam1Score,
            team2Score: newTeam2Score,
          };
        }
        return set;
      });

      // Serving hand rotation logic in Ball Badminton:
      // If serving team loses rally, if 1st Hand -> becomes 2nd Hand. If 2nd Hand -> service passes to opponent team (1st Hand).
      let newServingTeamId = prev.servingTeamId;
      let newServingHand = prev.servingHand || 1;

      if (teamId !== prev.servingTeamId) {
        if (newServingHand === 1) {
          newServingHand = 2; // Goes to 2nd Hand
        } else {
          // Handover to opponent on 1st Hand
          newServingTeamId = teamId;
          newServingHand = 1;
        }
      }

      return {
        ...prev,
        setScores: updatedSetScores,
        servingTeamId: newServingTeamId,
        servingHand: newServingHand as 1 | 2,
      };
    });

    setTimeout(() => setLastPointTeam(null), 1000);
  };

  const handleResetScores = () => {
    setMatch(initialMatch);
    setLastPointTeam(null);
  };

  const currentSetScore = match.setScores[match.currentSet - 1] || { team1Score: 0, team2Score: 0 };
  const isTeam1Serving = match.servingTeamId === match.team1.id;
  const isTeam2Serving = match.servingTeamId === match.team2.id;

  return (
    <section id="featured-scoreboard" className="py-12 bg-slate-50 dark:bg-charcoal-950 transition-colors duration-300 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Stream Banner: Shows demo controls ONLY in Demo Mode, authoritative badge in Production */}
        {status === 'demo' ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-xl bg-white/90 dark:bg-plum-950/70 border border-slate-200 dark:border-plum-800/60 text-xs text-slate-600 dark:text-muted-grey shadow-sm">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-orange shrink-0" />
              <span>
                <strong className="text-slate-900 dark:text-soft-white font-semibold">Broadcast Scoreboard Demo:</strong> Simulated match data reflecting official BBFI 29-point set rules &amp; service rotation.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSimulateRally}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-plum-800 hover:bg-brand-orange hover:text-charcoal-950 text-soft-white font-medium transition-all active:scale-95"
                title="Click to simulate an actual rally point"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Simulate Rally Point</span>
              </button>
              <button
                onClick={handleResetScores}
                className="p-1 text-slate-400 dark:text-muted-grey hover:text-slate-800 dark:hover:text-soft-white transition-colors"
                title="Reset scores"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                <strong className="font-semibold text-slate-900 dark:text-soft-white">Official Courtside Broadcast:</strong> Realtime live streaming directly from certified match official scorer pad.
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
              Supabase Realtime Stream
            </span>
          </div>
        )}

        {/* Main Broadcast Scoreboard Card */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-white dark:bg-gradient-to-br dark:from-charcoal-900 dark:via-plum-950 dark:to-charcoal-950 border border-slate-200 dark:border-plum-800/80 shadow-xl dark:shadow-elevated overflow-hidden">
          
          {/* Top Bar: Tournament & Court Header */}
          <div className="px-5 sm:px-8 py-4 border-b border-slate-200 dark:border-plum-800/60 bg-slate-50/90 dark:bg-charcoal-950/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="live" pulse size="sm">
                LIVE MATCH
              </Badge>
              <span className="text-slate-300 dark:text-soft-white/30 hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-soft-white">
                <Trophy className="w-4 h-4 text-brand-orange shrink-0" />
                <span>{match.tournamentName}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-muted-grey">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-coral" />
                <span className="text-slate-800 dark:text-soft-white/80 font-medium">{match.court}</span>
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-soft-white/30">•</span>
              <span className="hidden sm:inline bg-slate-100 dark:bg-plum-900/60 px-2.5 py-0.5 rounded text-slate-700 dark:text-soft-white/90 border border-slate-200 dark:border-plum-800 font-medium">
                {match.category}
              </span>
            </div>
          </div>

          {/* Main Scoring Arena Layout */}
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Team 1 (Left Side) */}
              <div className="lg:col-span-4 flex items-center lg:flex-row-reverse justify-between lg:justify-start gap-4">
                <div className="flex items-center gap-4 lg:text-right">
                  <div className="order-2 lg:order-1">
                    <div className="flex items-center lg:justify-end gap-2">
                      <span className="text-xs text-slate-500 dark:text-muted-grey font-medium uppercase tracking-wider">
                        {match.team1.state}
                      </span>
                      {isTeam1Serving && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/40 animate-pulse">
                          SERVICE • {match.servingHand === 1 ? '1ST HAND' : '2ND HAND'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-soft-white tracking-tight">
                      {match.team1.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-muted-grey mt-0.5">
                      Capt. {match.team1.captainName}
                    </p>
                  </div>

                  {/* Team Badge / Initials */}
                  <div 
                    className="order-1 lg:order-2 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-display font-black text-xl text-soft-white shadow-subtle border-2 border-slate-200 dark:border-plum-700 shrink-0"
                    style={{ backgroundColor: match.team1.logoBg }}
                  >
                    {match.team1.shortName}
                  </div>
                </div>

                {/* Games Won Badge (Mobile only) */}
                <div className="lg:hidden flex flex-col items-end">
                  <span className="text-[10px] uppercase text-slate-500 dark:text-muted-grey font-bold">Games</span>
                  <span className="text-xl font-bold text-brand-orange">{match.team1SetsWon}</span>
                </div>
              </div>

              {/* Center Board: Score Numerical Display */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center">
                
                {/* Games Won Counter (Desktop) */}
                <div className="hidden lg:flex items-center gap-8 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-muted-grey font-semibold">Games Won:</span>
                    <span className="text-lg font-bold text-brand-orange font-score">{match.team1SetsWon}</span>
                  </div>
                  <span className="text-xs text-slate-600 dark:text-muted-grey font-semibold uppercase tracking-wider bg-slate-100 dark:bg-charcoal-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-charcoal-700">
                    Set {match.currentSet} of 3
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-brand-coral font-score">{match.team2SetsWon}</span>
                  </div>
                </div>

                {/* Live Scores (Big Broadcast Digits) */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 w-full">
                  
                  {/* Team 1 Score Box */}
                  <div className={`flex flex-col items-center justify-center w-24 sm:w-32 h-24 sm:h-32 rounded-2xl bg-slate-50 dark:bg-charcoal-950/80 border transition-all duration-300 shadow-md dark:shadow-elevated ${
                    lastPointTeam === match.team1.id 
                      ? 'border-brand-orange scale-105 shadow-orange-glow ring-2 ring-brand-orange/30' 
                      : 'border-slate-200 dark:border-plum-800/70'
                  }`}>
                    <span className="text-5xl sm:text-6xl font-score font-extrabold text-slate-900 dark:text-soft-white score-digits tracking-tighter">
                      {currentSetScore.team1Score}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-muted-grey font-semibold mt-1">
                      Set {match.currentSet}
                    </span>
                  </div>

                  {/* VS Separator */}
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-slate-400 dark:text-muted-grey uppercase tracking-widest mb-1">
                      Target 29
                    </span>
                    <span className="text-2xl font-light text-slate-300 dark:text-soft-white/30">:</span>
                    <span className="text-[10px] text-brand-coral font-semibold uppercase mt-1">
                      Race to Gold
                    </span>
                  </div>

                  {/* Team 2 Score Box */}
                  <div className={`flex flex-col items-center justify-center w-24 sm:w-32 h-24 sm:h-32 rounded-2xl bg-slate-50 dark:bg-charcoal-950/80 border transition-all duration-300 shadow-md dark:shadow-elevated ${
                    lastPointTeam === match.team2.id 
                      ? 'border-brand-coral scale-105 shadow-coral-glow ring-2 ring-brand-coral/30' 
                      : 'border-slate-200 dark:border-plum-800/70'
                  }`}>
                    <span className="text-5xl sm:text-6xl font-score font-extrabold text-slate-900 dark:text-soft-white score-digits tracking-tighter">
                      {currentSetScore.team2Score}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-muted-grey font-semibold mt-1">
                      Set {match.currentSet}
                    </span>
                  </div>

                </div>

                {/* Service Status Badge */}
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-800 dark:text-soft-white/90 bg-slate-100 dark:bg-plum-900/60 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-plum-800/80">
                  <span className="w-2 h-2 rounded-full bg-brand-orange"></span>
                  <span>
                    Current Service: <strong>{isTeam1Serving ? match.team1.name : match.team2.name}</strong>
                  </span>
                  <span className="text-slate-400 dark:text-muted-grey">•</span>
                  <span className="text-brand-orange font-bold">
                    {match.servingHand === 1 ? '1st Hand' : '2nd Hand'}
                  </span>
                </div>
              </div>

              {/* Team 2 (Right Side) */}
              <div className="lg:col-span-4 flex items-center justify-between lg:justify-start gap-4">
                {/* Games Won Badge (Mobile only) */}
                <div className="lg:hidden flex flex-col items-start">
                  <span className="text-[10px] uppercase text-slate-500 dark:text-muted-grey font-bold">Games</span>
                  <span className="text-xl font-bold text-brand-coral">{match.team2SetsWon}</span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Team Badge / Initials */}
                  <div 
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-display font-black text-xl text-soft-white shadow-subtle border-2 border-slate-200 dark:border-plum-700 shrink-0"
                    style={{ backgroundColor: match.team2.logoBg }}
                  >
                    {match.team2.shortName}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-muted-grey font-medium uppercase tracking-wider">
                        {match.team2.state}
                      </span>
                      {isTeam2Serving && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-coral/20 text-brand-coral border border-brand-coral/40 animate-pulse">
                          SERVICE • {match.servingHand === 1 ? '1ST HAND' : '2ND HAND'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-soft-white tracking-tight">
                      {match.team2.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-muted-grey mt-0.5">
                      Capt. {match.team2.captainName}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Set Progression Breakdown Strip */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-plum-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                <span className="text-xs uppercase font-semibold text-slate-500 dark:text-muted-grey shrink-0">
                  Sets Breakdown:
                </span>
                {match.setScores.map((set) => (
                  <div
                    key={set.gameNumber}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-score border ${
                      set.gameNumber === match.currentSet
                        ? 'bg-amber-50 dark:bg-plum-900/80 border-brand-orange/60 text-slate-900 dark:text-soft-white shadow-sm font-bold'
                        : 'bg-slate-100 dark:bg-charcoal-900/60 border-slate-200 dark:border-charcoal-800 text-slate-600 dark:text-muted-grey'
                    }`}
                  >
                    <span className="text-[10px] uppercase text-slate-500 dark:text-muted-grey font-sans font-bold">
                      Set {set.gameNumber}:
                    </span>
                    <span className={set.team1Score > set.team2Score ? 'text-slate-900 dark:text-soft-white font-bold' : ''}>
                      {set.team1Score}
                    </span>
                    <span>-</span>
                    <span className={set.team2Score > set.team1Score ? 'text-slate-900 dark:text-soft-white font-bold' : ''}>
                      {set.team2Score}
                    </span>
                    {set.durationMinutes && (
                      <span className="text-[10px] text-slate-400 dark:text-muted-grey/70">
                        ({set.durationMinutes}m)
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Match Details CTA button */}
              <button
                onClick={() => onOpenDetails(match)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-plum-850 dark:hover:bg-plum-800 text-slate-800 dark:text-soft-white font-medium text-xs sm:text-sm border border-slate-300 dark:border-plum-700/80 transition-all hover:border-brand-orange/50 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <span>View Full Lineup &amp; Court Notes</span>
                <ArrowUpRight className="w-4 h-4 text-brand-orange" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
