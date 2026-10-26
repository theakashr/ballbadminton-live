import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  MapPin, 
  Trophy, 
  ChevronRight, 
  Clock, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import type { Match } from '../../types';
import { LiveRadarBadge } from '../common/LiveRadarBadge';
import { nativeHaptics } from '../../lib/nativeBridge';

interface HomeFeaturedLiveMatchProps {
  match: Match | null;
  nextUpcoming: Match | null;
  onOpenDetails: (match: Match) => void;
  isLoading?: boolean;
}

export const HomeFeaturedLiveMatch: React.FC<HomeFeaturedLiveMatchProps> = ({
  match,
  nextUpcoming,
  onOpenDetails,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="w-full rounded-2xl border border-[#E4E7EC] bg-white p-6 sm:p-8 animate-pulse shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-36 bg-[#F0F2F6] rounded-full" />
          <div className="h-5 w-28 bg-[#F0F2F6] rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center my-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#F0F2F6]" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-[#F0F2F6] rounded" />
              <div className="h-3 w-20 bg-[#F0F2F6] rounded" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="h-10 w-24 bg-[#F0F2F6] rounded mx-auto" />
            <div className="h-4 w-32 bg-[#F0F2F6] rounded mx-auto" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <div className="space-y-2 text-right">
              <div className="h-5 w-32 bg-[#F0F2F6] rounded ml-auto" />
              <div className="h-3 w-20 bg-[#F0F2F6] rounded ml-auto" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#F0F2F6]" />
          </div>
        </div>
        <div className="h-12 w-48 bg-[#F0F2F6] rounded-xl mt-6" />
      </div>
    );
  }

  // 2. Featured Live Match State
  if (match) {
    const currentSetScore = match.setScores[match.currentSet - 1] || { team1Score: 0, team2Score: 0 };
    const isTeam1Serving = match.servingTeamId === match.team1.id;
    const isTeam2Serving = match.servingTeamId === match.team2.id;

    const handleCardClick = () => {
      nativeHaptics.impact('light');
      onOpenDetails(match);
    };

    return (
      <div 
        onClick={handleCardClick}
        className="group relative rounded-2xl border border-[#E4E7EC] hover:border-[#FF851B]/60 bg-white p-5 sm:p-7 shadow-[0_4px_20px_-2px_rgba(16,24,40,0.06)] transition-all duration-200 cursor-pointer overflow-hidden"
      >
        <div className="relative z-10">
          {/* Top Bar: Live Status, Tournament, Court */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E4E7EC]">
            <div className="flex items-center gap-2.5">
              <LiveRadarBadge label="FEATURED LIVE MATCH" pulseColor="coral" size="sm" />
              <span className="text-[#E4E7EC] hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#182230] truncate max-w-[240px] sm:max-w-md">
                <Trophy className="w-3.5 h-3.5 text-[#FF851B] shrink-0" />
                <span className="truncate">{match.tournamentName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-[#667085]">
              <div className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#FF851B]" />
                <span>{match.court}</span>
              </div>
              {match.category && (
                <span className="hidden md:inline px-2 py-0.5 rounded bg-[#F0F2F6] border border-[#E4E7EC] text-[11px] text-[#182230] font-semibold">
                  {match.category}
                </span>
              )}
            </div>
          </div>

          {/* Main Scoreboard Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-6">
            
            {/* Team 1 Side (Left) */}
            <div className="md:col-span-4 flex items-center gap-3.5 min-w-0">
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-display font-extrabold text-base sm:text-lg text-white border border-[#E4E7EC] shadow-sm shrink-0 transition-transform group-hover:scale-105"
                style={{ backgroundColor: match.team1.logoBg || '#182230' }}
              >
                {match.team1.shortName}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-base sm:text-xl text-[#182230] truncate">
                    {match.team1.name}
                  </h3>
                  {isTeam1Serving && (
                    <span 
                      className="px-2 py-0.5 rounded-full bg-[#FFF1E5] border border-[#FF851B]/40 text-[10px] font-black text-[#FF851B] shrink-0 flex items-center gap-1 shadow-sm"
                      title="Current ball server"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF851B] animate-ping" />
                      {match.servingHand === 1 ? '1st Hand' : '2nd Hand'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#667085] mt-0.5">
                  <span>{match.team1.state || 'Team A'}</span>
                  <span>•</span>
                  <span className="font-bold text-[#182230]">Sets Won: {match.team1SetsWon}</span>
                </div>
              </div>
            </div>

            {/* Center Score Display */}
            <div className="md:col-span-4 flex flex-col items-center justify-center py-2.5 px-4 rounded-2xl bg-[#F0F2F6] border border-[#E4E7EC]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D92D20] mb-1">
                SET {match.currentSet} IN PLAY • FIRST TO 29
              </span>
              
              <div className="flex items-center gap-4 text-4xl sm:text-5xl lg:text-6xl font-score font-black text-[#182230] tracking-tight">
                <span className={isTeam1Serving ? 'text-[#FF851B]' : 'text-[#182230]'}>
                  {currentSetScore.team1Score}
                </span>
                <span className="text-[#98A2B3] text-3xl sm:text-4xl font-light">-</span>
                <span className={isTeam2Serving ? 'text-[#FF851B]' : 'text-[#182230]'}>
                  {currentSetScore.team2Score}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#667085] font-semibold mt-1">
                <span>Sets: {match.team1SetsWon} - {match.team2SetsWon}</span>
              </div>
            </div>

            {/* Team 2 Side (Right) */}
            <div className="md:col-span-4 flex items-center justify-start md:justify-end gap-3.5 min-w-0">
              <div className="min-w-0 text-left md:text-right order-2 md:order-1">
                <div className="flex items-center md:justify-end gap-2">
                  {isTeam2Serving && (
                    <span 
                      className="px-2 py-0.5 rounded-full bg-[#FFF1E5] border border-[#FF851B]/40 text-[10px] font-black text-[#FF851B] shrink-0 flex items-center gap-1 shadow-sm"
                      title="Current ball server"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF851B] animate-ping" />
                      {match.servingHand === 1 ? '1st Hand' : '2nd Hand'}
                    </span>
                  )}
                  <h3 className="font-display font-black text-base sm:text-xl text-[#182230] truncate">
                    {match.team2.name}
                  </h3>
                </div>
                <div className="flex items-center md:justify-end gap-2 text-xs text-[#667085] mt-0.5">
                  <span className="font-bold text-[#182230]">Sets Won: {match.team2SetsWon}</span>
                  <span>•</span>
                  <span>{match.team2.state || 'Team B'}</span>
                </div>
              </div>
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-display font-extrabold text-base sm:text-lg text-white border border-[#E4E7EC] shadow-sm shrink-0 transition-transform group-hover:scale-105 order-1 md:order-2"
                style={{ backgroundColor: match.team2.logoBg || '#182230' }}
              >
                {match.team2.shortName}
              </div>
            </div>

          </div>

          {/* Set-by-Set Score Row */}
          {match.setScores.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2 px-4 rounded-xl bg-[#F0F2F6] border border-[#E4E7EC] mb-5">
              <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider mr-1">
                Set Breakdown:
              </span>
              {match.setScores.map((set, idx) => {
                const isCurrent = idx === match.currentSet - 1;
                return (
                  <span 
                    key={set.gameNumber || idx}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-score ${
                      isCurrent 
                        ? 'bg-[#FFF1E5] border border-[#FF851B]/40 text-[#FF851B] font-bold' 
                        : 'bg-white border border-[#E4E7EC] text-[#182230] font-medium'
                    }`}
                  >
                    <span className="text-[10px] text-[#667085]">G{set.gameNumber}:</span>
                    <span>{set.team1Score} - {set.team2Score}</span>
                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#D92D20] animate-pulse" />}
                  </span>
                );
              })}
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-[#E4E7EC]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF851B] hover:bg-[#E96F0B] text-white font-display font-bold text-sm sm:text-base shadow-sm transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-white stroke-none" />
              <span>Watch Live Match</span>
            </button>

            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-[#667085]">
              <span>Ref: {match.referee || 'BBFI Certified Official'}</span>
              <span className="inline-flex items-center gap-1 text-[#FF851B] font-bold group-hover:translate-x-0.5 transition-transform">
                <span>Full Match Center</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // 3. Fallback: Next Upcoming Match Spotlight
  if (nextUpcoming) {
    const handleUpcomingClick = () => {
      nativeHaptics.impact('light');
      onOpenDetails(nextUpcoming);
    };

    return (
      <div 
        onClick={handleUpcomingClick}
        className="group relative rounded-2xl border border-[#E4E7EC] hover:border-[#FF851B]/60 bg-white p-6 sm:p-7 shadow-[0_4px_20px_-2px_rgba(16,24,40,0.06)] transition-all duration-200 cursor-pointer overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4E7EC] mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF1E5] border border-[#B54708]/30 text-[#B54708] text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Next Match Spotlight</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#667085]">
            <MapPin className="w-3.5 h-3.5 text-[#FF851B]" />
            <span>{nextUpcoming.court}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mb-5">
          <div className="md:col-span-5 flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-white border border-[#E4E7EC] shrink-0"
              style={{ backgroundColor: nextUpcoming.team1.logoBg || '#182230' }}
            >
              {nextUpcoming.team1.shortName}
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-[#182230] truncate">
                {nextUpcoming.team1.name}
              </h3>
              <p className="text-xs text-[#667085]">{nextUpcoming.team1.state}</p>
            </div>
          </div>

          <div className="md:col-span-2 text-center py-2 px-3 rounded-xl bg-[#F0F2F6] border border-[#E4E7EC]">
            <span className="text-[10px] uppercase font-bold text-[#B54708] block mb-0.5">
              Scheduled
            </span>
            <span className="font-score font-bold text-base text-[#182230]">
              {nextUpcoming.scheduledTime}
            </span>
          </div>

          <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-3">
            <div className="text-left md:text-right order-2 md:order-1">
              <h3 className="font-display font-extrabold text-base text-[#182230] truncate">
                {nextUpcoming.team2.name}
              </h3>
              <p className="text-xs text-[#667085]">{nextUpcoming.team2.state}</p>
            </div>
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-white border border-[#E4E7EC] shrink-0 order-1 md:order-2"
              style={{ backgroundColor: nextUpcoming.team2.logoBg || '#182230' }}
            >
              {nextUpcoming.team2.shortName}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#E4E7EC]">
          <div className="flex items-center gap-1.5 text-xs text-[#667085] font-medium">
            <Trophy className="w-3.5 h-3.5 text-[#FF851B]" />
            <span>{nextUpcoming.tournamentName}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpcomingClick();
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#F0F2F6] hover:bg-[#E4E7EC] border border-[#E4E7EC] text-[#182230] font-bold text-xs transition-all active:scale-95"
          >
            <span>Open Match Preview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 4. Honest & Polished Empty State (Neither Live Nor Upcoming)
  return (
    <div className="rounded-2xl border border-[#E4E7EC] bg-white p-8 sm:p-10 text-center shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-[#F0F2F6] border border-[#E4E7EC] flex items-center justify-center mx-auto mb-3 text-[#FF851B]">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h3 className="font-display font-extrabold text-lg sm:text-xl text-[#182230] mb-1.5">
        No Matches In Progress Right Now
      </h3>
      <p className="text-xs sm:text-sm text-[#667085] max-w-md mx-auto mb-5">
        Tournament courts are currently between rounds. Verified scores will stream live here as soon as play resumes.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={() => navigate('/tournaments')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF851B] text-white font-display font-bold text-xs shadow-sm hover:bg-[#E96F0B] transition-all active:scale-95"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Browse Tournaments</span>
        </button>
        <button
          onClick={() => navigate('/results')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F2F6] hover:bg-[#E4E7EC] border border-[#E4E7EC] text-[#182230] font-semibold text-xs transition-all active:scale-95"
        >
          <span>View Recent Results</span>
        </button>
      </div>
    </div>
  );
};
