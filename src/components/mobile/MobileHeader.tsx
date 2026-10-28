import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, PlusCircle } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { nativeHaptics } from '../../lib/nativeBridge';

interface MobileHeaderProps {
  onOpenLogin?: () => void;
  onCreateTournament: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenLogin: _onOpenLogin,
  onCreateTournament,
}) => {
  const { currentUser, isSuperAdmin, isTournamentAdmin, isScorer } = useAuth();
  const hasAdminRole = isSuperAdmin || isTournamentAdmin || isScorer;

  return (
    <header className="sticky top-0 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-xl border-b border-[#E4E7EC] pt-safe px-4 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Brand Mark */}
        <Link
          to="/"
          onClick={() => nativeHaptics.selection()}
          className="flex items-center gap-2.5 active:scale-95 transition-transform"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFF1E5] border border-[#FF851B]/30 shadow-sm shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
              <ellipse cx="14" cy="13" rx="8" ry="9.5" stroke="#FF851B" strokeWidth="1.8" />
              <path d="M10 7V19 M14 5V21 M18 7V19" stroke="#98A2B3" strokeWidth="0.75" opacity="0.6" />
              <path d="M7 10H21 M6 13H22 M7 16H21" stroke="#98A2B3" strokeWidth="0.75" opacity="0.6" />
              <line x1="14" y1="22.5" x2="14" y2="29" stroke="#182230" strokeWidth="2" strokeLinecap="round" />
              <circle cx="23" cy="21" r="5" fill="#FFDC00" stroke="#FF851B" strokeWidth="1.2" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D92D20] border border-white" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base tracking-tight text-[#182230]">
                BALL BADMINTON
              </span>
              <span className="bg-[#D92D20]/10 text-[#D92D20] text-[9px] font-black px-1 py-0.5 rounded uppercase tracking-wider border border-[#D92D20]/30">
                LIVE
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-wider text-[#667085] font-medium -mt-0.5">
              BBFI Match Center
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {/* Quick Create Tournament Icon Button */}
          <button
            onClick={() => {
              nativeHaptics.impact('light');
              onCreateTournament();
            }}
            aria-label="Create Tournament"
            className="p-1.5 rounded-lg bg-[#FFF1E5] border border-[#FF851B]/30 text-[#FF851B] hover:bg-[#FF851B] hover:text-white transition-colors active:scale-95"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Role Aware Auth / Admin Button */}
          {currentUser ? (
            <Link
              to={hasAdminRole ? '/admin' : '/login'}
              onClick={() => nativeHaptics.selection()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF1E5] border border-[#FF851B]/40 text-xs font-bold text-[#FF851B] active:scale-95 transition-all shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="max-w-[85px] truncate">
                {hasAdminRole ? 'Admin' : 'Account'}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                to="/login"
                onClick={() => nativeHaptics.selection()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF1E5] border border-[#FF851B]/40 text-xs font-bold text-[#FF851B] hover:bg-[#FF851B] hover:text-white active:scale-95 transition-all shadow-xs"
                title="Super Admin & Official Scorer Login"
              >
                <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Admin Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
