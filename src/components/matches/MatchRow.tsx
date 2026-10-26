import React from 'react';
import { 
  ChevronRight, 
  MapPin, 
  Clock, 
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
  theme = 'light' 
}) => {
  const isLight = theme === 'light';
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
      className={`group relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
        isLight
          ? 'bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-brand-orange/60 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-lg'
          : 'bg-charcoal-900/60 hover:bg-plum-900/40 border border-charcoal-800 hover:border-plum-700/80'
      }`}
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
          <span className={`text-xs truncate max-w-[140px] sm:max-w-xs font-semibold ${
            isLight ? 'text-slate-600' : 'text-muted-grey'
          }`}>
            {match.stage}
          </span>
        </div>

        <div className={`text-xs sm:text-sm font-bold truncate ${
          isLight ? 'text-slate-900' : 'text-soft-white'
        }`}>
          {match.tournamentName}
        </div>

        <div className={`flex items-center gap-2 text-[11px] ${
          isLight ? 'text-slate-500' : 'text-muted-grey'
        }`}>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-brand-orange shrink-0" />
            <span className="truncate">{match.court}</span>
          </span>
          <span>•</span>
          <span>{match.category}</span>
        </div>
      </div>

      {/* Middle: Teams and Scores */}
      <div className={`flex-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6 py-2 md:py-0 border-y sm:border-y-0 sm:border-x sm:px-6 ${
        isLight ? 'border-slate-200' : 'border-charcoal-800/80'
      }`}>
        
        {/* Team 1 */}
        <div className="flex-1 flex items-center justify-between sm:justify-end gap-3 text-right">
          <div className="flex flex-col items-start sm:items-end">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm sm:text-base font-display font-bold tracking-tight ${
                winnerId === match.team1.id 
                  ? 'text-brand-orange font-black' 
                  : isLight ? 'text-slate-900' : 'text-soft-white'
              }`}>
                {match.team1.name}
              </span>
              {winnerId === match.team1.id && (
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-orange shrink-0" />
              )}
            </div>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-muted-grey'}`}>
              {match.team1.state}
              {match.servingTeamId === match.team1.id && isLive && (
                <span className="text-brand-orange ml-1 font-bold">
                  • Serv. ({match.servingHand === 1 ? '1st' : '2nd'})
                </span>
              )}
            </span>
          </div>

          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-xs text-soft-white shrink-0 border border-slate-700/60 shadow-sm"
            style={{ backgroundColor: match.team1.logoBg }}
          >
            {match.team1.shortName}
          </div>
        </div>

        {/* Center Score / Schedule Details (High-Contrast Sports Box) */}
        <div className={`shrink-0 flex flex-col items-center justify-center min-w-[125px] px-3.5 py-2 rounded-xl shadow-sm ${
          isLight 
            ? 'bg-slate-950 text-white border border-slate-900' 
            : 'bg-charcoal-950/90 text-soft-white border border-charcoal-800'
        }`}>
          {isLive && currentSet && (
            <>
              <div className="flex items-center gap-2 score-digits">
                <span className="text-xl font-bold font-score text-white">
                  {currentSet.team1Score}
                </span>
                <span className="text-xs text-slate-400 font-sans">-</span>
                <span className="text-xl font-bold font-score text-white">
                  {currentSet.team2Score}
                </span>
              </div>
              <div className="text-[10px] text-brand-orange uppercase tracking-wider font-bold">
                Set {match.currentSet} ({match.team1SetsWon}-{match.team2SetsWon} sets)
              </div>
            </>
          )}

          {isUpcoming && (
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Clock className="w-3.5 h-3.5 text-brand-orange" />
                <span>{match.scheduledTime}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {match.city}
              </span>
            </div>
          )}

          {isCompleted && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 score-digits">
                <span className={`text-lg font-bold font-score ${
                  match.team1SetsWon > match.team2SetsWon ? 'text-brand-orange' : 'text-white'
                }`}>
                  {match.team1SetsWon}
                </span>
                <span className="text-xs text-slate-400 font-sans">sets</span>
                <span className={`text-lg font-bold font-score ${
                  match.team2SetsWon > match.team1SetsWon ? 'text-brand-orange' : 'text-white'
                }`}>
                  {match.team2SetsWon}
                </span>
              </div>
              <div className="text-[10px] text-slate-300 flex items-center gap-1">
                {match.setScores.map((s, idx) => (
                  <span key={idx}>
                    {s.team1Score}-{s.team2Score}
                    {idx < match.setScores.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex-1 flex items-center justify-between sm:justify-start gap-3 text-left">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-xs text-soft-white shrink-0 border border-slate-700/60 shadow-sm"
            style={{ backgroundColor: match.team2.logoBg }}
          >
            {match.team2.shortName}
          </div>

          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm sm:text-base font-display font-bold tracking-tight ${
                winnerId === match.team2.id 
                  ? 'text-brand-orange font-black' 
                  : isLight ? 'text-slate-900' : 'text-soft-white'
              }`}>
                {match.team2.name}
              </span>
              {winnerId === match.team2.id && (
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-orange shrink-0" />
              )}
            </div>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-muted-grey'}`}>
              {match.team2.state}
              {match.servingTeamId === match.team2.id && isLive && (
                <span className="text-brand-orange ml-1 font-bold">
                  • Serv. ({match.servingHand === 1 ? '1st' : '2nd'})
                </span>
              )}
            </span>
          </div>
        </div>

      </div>

      {/* Right Action: Details Arrow */}
      <div className="flex items-center justify-end md:w-auto shrink-0 pt-2 md:pt-0">
        <span className={`text-xs font-bold flex items-center gap-1 transition-all ${
          isLight ? 'text-slate-600 group-hover:text-brand-orange' : 'text-muted-grey group-hover:text-brand-orange'
        }`}>
          <span className="hidden sm:inline">Details</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </div>
  );
};
