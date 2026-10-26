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
    <div className="relative overflow-hidden border-b border-plum-800/40 bg-gradient-to-r from-plum-950 via-charcoal-950 to-charcoal-900 text-soft-white">
      {/* Subtle background ambient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,133,27,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,91,69,0.06),transparent_50%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Left: Brand Identity & Live Broadcast Status */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
            {/* Live Indicator */}
            {liveCount > 0 ? (
              <LiveRadarBadge 
                label={`${liveCount} ${liveCount === 1 ? 'MATCH' : 'MATCHES'} LIVE`} 
                pulseColor="coral" 
                size="sm" 
              />
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-charcoal-900 border border-plum-800/70 text-[11px] font-bold tracking-wider uppercase text-muted-grey">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>STANDBY</span>
              </span>
            )}

            <div className="h-3.5 w-px bg-plum-800/60 hidden sm:block" />

            {/* Federation / Broadcaster Pill */}
            <div className="flex items-center gap-1.5 text-xs text-soft-white/90 font-medium">
              <span className="font-display font-extrabold text-soft-white tracking-wide">
                BBFI MATCH CENTER
              </span>
              <span className="text-muted-grey hidden md:inline">•</span>
              <span className="text-muted-grey hidden md:inline text-[11px]">
                Official 29-Pt Set Standards
              </span>
            </div>

            {/* Realtime Stream Health Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-plum-900/60 border border-plum-800/50 text-[10px] text-muted-grey">
              <Zap className={`w-3 h-3 ${realtimeStatus === 'connected' ? 'text-emerald-400' : 'text-brand-orange'}`} />
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-plum-900/80 hover:bg-plum-850 border border-plum-700/60 hover:border-brand-orange/60 text-xs font-bold text-brand-orange transition-all active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 text-brand-coral" />
              <span>Watch Live Feed</span>
            </Link>

            <button
              onClick={() => {
                nativeHaptics.impact('light');
                onCreateTournament();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-orange hover:bg-brand-orangeHover text-charcoal-950 font-display font-extrabold text-xs shadow-orange-glow transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Tournament</span>
            </button>

            {hasAdminRole && (
              <Link
                to="/admin"
                onClick={() => nativeHaptics.selection()}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-charcoal-800/80 hover:bg-charcoal-800 border border-plum-800/80 text-xs font-semibold text-soft-white transition-all active:scale-95"
                title="Open Scorer / Admin Console"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-brand-orange" />
                <span>Portal</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
