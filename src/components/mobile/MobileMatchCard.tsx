import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Flame, ChevronRight, Trophy } from 'lucide-react';
import type { Match } from '../../types';
import { LiveRadarBadge } from '../common/LiveRadarBadge';
import { AnimatedScoreDigit } from '../common/AnimatedScoreDigit';
import { nativeHaptics } from '../../lib/nativeBridge';

interface MobileMatchCardProps {
  match: Match;
  onOpenDetails?: (match: Match) => void;
}

export const MobileMatchCard: React.FC<MobileMatchCardProps> = ({
  match,
  onOpenDetails,
}) => {
  const navigate = useNavigate();

  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';
  const isCompleted = match.status === 'completed';

  const currentSetScore = match.setScores[match.currentSet - 1] || { team1Score: 0, team2Score: 0 };
  const isTeam1Serving = match.servingTeamId === match.team1.id;
  const isTeam2Serving = match.servingTeamId === match.team2.id;

  const scoreDiff = Math.abs(currentSetScore.team1Score - currentSetScore.team2Score);
  const leadingTeam = currentSetScore.team1Score > currentSetScore.team2Score ? match.team1 : match.team2;

  const handleCardClick = () => {
    nativeHaptics.impact('light');
    if (onOpenDetails) {
      onOpenDetails(match);
    } else {
      navigate(`/matches/${match.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98] border shadow-card hover:shadow-card-hover ${
        isLive
          ? 'bg-white border-border-neutral ring-1 ring-brand-orange/30'
          : 'bg-white border-border-neutral'
      }`}
    >
      {/* Top Metadata Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-border-neutral">
        <div className="flex items-center gap-2">
          {isLive && <LiveRadarBadge label="LIVE" pulseColor="coral" />}
          {isUpcoming && (
            <span className="px-2 py-0.5 rounded-full bg-surface-muted border border-border-neutral text-[10px] font-bold text-text-secondary">
              UPCOMING
            </span>
          )}
          {isCompleted && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-bold text-status-success">
              FINAL
            </span>
          )}

          <span className="text-[11px] font-semibold text-text-primary truncate max-w-[140px]">
            {match.tournamentName}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-text-secondary shrink-0">
          <MapPin className="w-3 h-3 text-brand-orange" />
          <span>{match.court}</span>
        </div>
      </div>

      {/* Team 1 Row */}
      <div className="flex items-center justify-between gap-3 py-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-extrabold text-xs text-white border border-border-neutral shrink-0 shadow-sm"
            style={{ backgroundColor: match.team1.logoBg || '#182230' }}
          >
            {match.team1.shortName}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm text-text-primary truncate block">
                {match.team1.name}
              </span>
              {isLive && isTeam1Serving && (
                <span className="px-1.5 py-0.2 rounded bg-brand-soft border border-brand-orange/30 text-[9px] font-black text-brand-orange shrink-0">
                  {match.servingHand === 1 ? '1H' : '2H'}
                </span>
              )}
            </div>
            <span className="text-[10px] text-text-secondary">
              Sets: {match.team1SetsWon}
            </span>
          </div>
        </div>

        {/* Score 1 */}
        <div className="flex items-center gap-2">
          {isLive ? (
            <div className="min-w-[38px] text-right">
              <AnimatedScoreDigit
                score={currentSetScore.team1Score}
                colorVariant="orange"
                size="md"
              />
            </div>
          ) : isCompleted ? (
            <span className="font-display font-black text-lg text-text-primary">
              {match.team1SetsWon}
            </span>
          ) : (
            <span className="text-xs text-text-secondary">{match.scheduledTime}</span>
          )}
        </div>
      </div>

      {/* Team 2 Row */}
      <div className="flex items-center justify-between gap-3 py-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-extrabold text-xs text-white border border-border-neutral shrink-0 shadow-sm"
            style={{ backgroundColor: match.team2.logoBg || '#475467' }}
          >
            {match.team2.shortName}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm text-text-primary truncate block">
                {match.team2.name}
              </span>
              {isLive && isTeam2Serving && (
                <span className="px-1.5 py-0.2 rounded bg-rose-50 border border-status-live/30 text-[9px] font-black text-status-live shrink-0">
                  {match.servingHand === 1 ? '1H' : '2H'}
                </span>
              )}
            </div>
            <span className="text-[10px] text-text-secondary">
              Sets: {match.team2SetsWon}
            </span>
          </div>
        </div>

        {/* Score 2 */}
        <div className="flex items-center gap-2">
          {isLive ? (
            <div className="min-w-[38px] text-right">
              <AnimatedScoreDigit
                score={currentSetScore.team2Score}
                colorVariant="coral"
                size="md"
              />
            </div>
          ) : isCompleted ? (
            <span className="font-display font-black text-lg text-text-primary">
              {match.team2SetsWon}
            </span>
          ) : (
            <span className="text-xs text-text-secondary">Scheduled</span>
          )}
        </div>
      </div>

      {/* Footer Info & Momentum */}
      <div className="mt-3 pt-2.5 border-t border-border-neutral flex items-center justify-between text-[11px]">
        {isLive ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-orange">
              Set {match.currentSet} of 3 (Target {match.maxPointsPerSet || 29})
            </span>
            {scoreDiff >= 3 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-status-warning font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                <Flame className="w-2.5 h-2.5" />
                {leadingTeam.shortName} +{scoreDiff}
              </span>
            )}
          </div>
        ) : isCompleted ? (
          <span className="text-status-success font-bold flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            <span>Winner: {match.team1SetsWon > match.team2SetsWon ? match.team1.name : match.team2.name}</span>
          </span>
        ) : (
          <span className="text-text-secondary">Stage: {match.stage}</span>
        )}

        <div className="flex items-center gap-1 text-brand-orange font-semibold">
          <span>Match Center</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
