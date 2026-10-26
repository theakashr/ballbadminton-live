import React from 'react';
import { 
  ChevronRight, 
  MapPin, 
  CheckCircle2 
} from 'lucide-react';
import type { Match } from '../../types';
import { Badge } from '../common/Badge';

interface MatchRowProps {
  match: Match;
  onSelect: (match: Match) => void;
  theme?: 'dark' | 'light';
}

export const MatchRow: React.FC<MatchRowProps> = ({ 
  match, 
  onSelect,
}) => {
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';
  const isCompleted = match.status === 'completed';

  const currentSet = match.setScores[match.currentSet - 1];

  const getWinnerTeamId = () => {
    if (!isCompleted) return null;
    return match.team1SetsWon > match.team2SetsWon ? match.team1.id : match.team2.id;
  };

  const winnerId = getWinnerTeamId();

  return (
    <div
      onClick={() => onSelect(match)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(match);
        }
      }}
      className="group relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange bg-white hover:bg-surface-muted/60 border border-border-neutral hover:border-brand-orange/60 shadow-card hover:shadow-card-hover"
    >
      {/* Left Info: Tournament, Court & Stage */}
      <div className="flex flex-col gap-1 min-w-[200px] md:w-1/4">
        <div className="flex items-center gap-2">
          {isLive && (
            <Badge variant="live" pulse size="sm">
              Live
            </Badge>
          )}
          {isUpcoming && (
            <Badge variant="upcoming" size="sm">
              Scheduled
            </Badge>
          )}
          {isCompleted && (
            <Badge variant="completed" size="sm">
              Completed
            </Badge>
          )}
          <span className="text-xs truncate max-w-[140px] sm:max-w-xs font-semibold text-text-secondary">
            {match.stage}
          </span>
        </div>

        <div className="text-xs sm:text-sm font-bold truncate text-text-primary">
          {match.tournamentName}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-text-secondary">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-brand-orange shrink-0" />
            <span className="truncate">{match.court}</span>
          </span>
          <span>•</span>
          <span>{match.category}</span>
        </div>
      </div>

      {/* Middle: Teams and Scores */}
      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6 py-2 md:py-0 border-y sm:border-y-0 sm:border-x sm:px-6 border-border-neutral">
        {/* Team 1 */}
        <div className="flex-1 flex items-center justify-start sm:justify-end gap-3">
          <div className="text-left sm:text-right min-w-0">
            <div className="flex items-center justify-start sm:justify-end gap-1.5">
              {winnerId === match.team1.id && (
                <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
              )}
              <span className={`text-sm sm:text-base font-bold truncate ${
                winnerId === match.team1.id ? 'text-status-success font-black' : 'text-text-primary'
              }`}>
                {match.team1.name}
              </span>
            </div>
            <span className="text-[10px] text-text-secondary">
              {match.team1.state}
            </span>
          </div>

          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-xs text-white border border-border-neutral shrink-0"
            style={{ backgroundColor: match.team1.logoBg || '#182230' }}
          >
            {match.team1.shortName}
          </div>
        </div>

        {/* Center Scoreboard */}
        <div className="flex flex-col items-center justify-center px-2 min-w-[100px]">
          {isLive ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 font-mono text-xl sm:text-2xl font-black text-brand-orange">
                <span>{currentSet?.team1Score ?? 0}</span>
                <span className="text-text-secondary font-light">:</span>
                <span>{currentSet?.team2Score ?? 0}</span>
              </div>
              <span className="text-[10px] font-bold text-text-secondary uppercase">
                Set {match.currentSet}
              </span>
            </div>
          ) : isCompleted ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 font-mono text-xl sm:text-2xl font-black text-text-primary">
                <span className={winnerId === match.team1.id ? 'text-brand-orange' : ''}>
                  {match.team1SetsWon}
                </span>
                <span className="text-text-secondary font-light">:</span>
                <span className={winnerId === match.team2.id ? 'text-brand-orange' : ''}>
                  {match.team2SetsWon}
                </span>
              </div>
              <span className="text-[10px] font-bold text-status-success uppercase">
                Final Sets
              </span>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-xs font-bold text-text-primary block">
                {match.scheduledTime}
              </span>
              <span className="text-[10px] text-text-secondary">
                {match.stage || 'Upcoming'}
              </span>
            </div>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex-1 flex items-center justify-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-xs text-white border border-border-neutral shrink-0"
            style={{ backgroundColor: match.team2.logoBg || '#475467' }}
          >
            {match.team2.shortName}
          </div>

          <div className="text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm sm:text-base font-bold truncate ${
                winnerId === match.team2.id ? 'text-status-success font-black' : 'text-text-primary'
              }`}>
                {match.team2.name}
              </span>
              {winnerId === match.team2.id && (
                <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
              )}
            </div>
            <span className="text-[10px] text-text-secondary">
              {match.team2.state}
            </span>
          </div>
        </div>
      </div>

      {/* Right Action: Arrow & Details */}
      <div className="flex items-center justify-end md:w-1/6 gap-2 text-text-secondary group-hover:text-brand-orange transition-colors">
        <span className="text-xs font-semibold hidden md:inline">Details</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
};
