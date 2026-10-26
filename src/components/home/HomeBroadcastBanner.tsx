import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ShieldCheck, Radio, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LiveRadarBadge } from '../common/LiveRadarBadge';
import { nativeHaptics } from '../../lib/nativeBridge';
import type { RealtimeConnectionStatus } from '../../hooks/useRealtimeMatch';

interface HomeBroadcastBannerProps {
  liveCount: number;
  realtimeStatus: RealtimeConnectionStatus;
  onCreateTournament: () => void;
}

export const HomeBroadcastBanner: React.FC<HomeBroadcastBannerProps> = ({
  liveCount,
  realtimeStatus,
  onCreateTournament,
}) => {
  const { isSuperAdmin, isTournamentAdmin, isScorer } = useAuth();
  const hasAdminRole = isSuperAdmin || isTournamentAdmin || isScorer;

  return (
    <div className="relative overflow-hidden border-b border-[#E4E7EC] bg-white text-[#182230]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Left: Brand Identity & Live Broadcast Status */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
            {/* Live Indicator */}
            {liveCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <LiveRadarBadge 
                  label={`${liveCount} ${liveCount === 1 ? 'MATCH' : 'MATCHES'} LIVE`} 
                  pulseColor="coral" 
                  size="sm" 
                />
                <span className="hidden lg:inline text-[10px] font-bold text-[#D92D20] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  ನೇರ ಪ್ರಸಾರ
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0F2F6] border border-[#E4E7EC] text-[11px] font-bold tracking-wider uppercase text-[#667085]">
                  <span className="w-2 h-2 rounded-full bg-[#667085]" />
                  <span>STANDBY</span>
                </span>
                <span className="hidden lg:inline text-[10px] font-medium text-[#667085] bg-[#F0F2F6] px-2 py-0.5 rounded-full border border-[#E4E7EC]">
                  ಮುಂದಿನ ಪಂದ್ಯಗಳಿಗಾಗಿ ನಿರೀಕ್ಷಿಸಿ
                </span>
              </div>
            )}

            <div className="h-3.5 w-px bg-[#E4E7EC] hidden sm:block" />

            {/* Federation / Broadcaster Pill */}
            <div className="flex items-center gap-1.5 text-xs text-[#182230] font-medium">
              <span className="font-display font-black text-[#182230] tracking-wide">
                BBFI MATCH CENTER
              </span>
              <span className="text-[#667085] hidden md:inline">•</span>
              <span className="text-[#667085] hidden md:inline text-[11px]">
                Official 29-Pt Set Standards
              </span>
            </div>

            {/* Realtime Stream Health Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F0F2F6] border border-[#E4E7EC] text-[10px] text-[#667085]">
              <Zap className={`w-3 h-3 ${realtimeStatus === 'connected' ? 'text-[#16803D]' : 'text-[#FF851B]'}`} />
              <span className="font-semibold capitalize">
                {realtimeStatus === 'connected' ? 'Realtime Stream Active' : realtimeStatus === 'demo' ? 'Official Courtside Feed' : 'Connecting Stream...'}
              </span>
            </div>
          </div>

          {/* Right: Quick Broadcast Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/live"
              onClick={() => nativeHaptics.selection()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF1E5] hover:bg-[#FFE5D0] border border-[#FF851B]/30 text-xs font-bold text-[#FF851B] transition-all active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 text-[#D92D20]" />
              <span>Watch Live Feed</span>
            </Link>

            <button
              onClick={() => {
                nativeHaptics.impact('light');
                onCreateTournament();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF851B] hover:bg-[#E96F0B] text-white font-display font-extrabold text-xs shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Tournament</span>
            </button>

            {hasAdminRole && (
              <Link
                to="/admin"
                onClick={() => nativeHaptics.selection()}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F0F2F6] hover:bg-[#E4E7EC] border border-[#E4E7EC] text-xs font-semibold text-[#182230] transition-all active:scale-95"
                title="Open Scorer / Admin Console"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF851B]" />
                <span>Portal</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
