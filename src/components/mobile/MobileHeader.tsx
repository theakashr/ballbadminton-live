import React from 'react';
import { Link } from 'react-router-dom';
import { User, ShieldCheck, PlusCircle } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { nativeHaptics } from '../../lib/nativeBridge';

interface MobileHeaderProps {
  onOpenLogin: () => void;
  onCreateTournament: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenLogin,
  onCreateTournament,
}) => {
  const { currentUser, isSuperAdmin, isTournamentAdmin, isScorer } = useAuth();
  const hasAdminRole = isSuperAdmin || isTournamentAdmin || isScorer;

  return (
    <header className="sticky top-0 left-0 right-0 z-30 md:hidden bg-charcoal-950/95 dark:bg-charcoal-950/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-plum-800/60 pt-safe px-4 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Brand Mark */}
        <Link
          to="/"
          onClick={() => nativeHaptics.selection()}
          className="flex items-center gap-2.5 active:scale-95 transition-transform"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-plum-800 to-charcoal-900 border border-plum-700/60 shadow-sm shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
              <ellipse cx="14" cy="13" rx="8" ry="9.5" stroke="#FF851B" strokeWidth="1.8" />
              <path d="M10 7V19 M14 5V21 M18 7V19" stroke="#B7AFBD" strokeWidth="0.75" opacity="0.6" />
              <path d="M7 10H21 M6 13H22 M7 16H21" stroke="#B7AFBD" strokeWidth="0.75" opacity="0.6" />
              <line x1="14" y1="22.5" x2="14" y2="29" stroke="#F8F5F2" strokeWidth="2" strokeLinecap="round" />
              <circle cx="23" cy="21" r="5" fill="#FFDC00" stroke="#FF851B" strokeWidth="1.2" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brand-coral border border-charcoal-950" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base tracking-tight text-slate-900 dark:text-soft-white">
                BALL BADMINTON
              </span>
              <span className="bg-brand-coral/20 text-brand-coral text-[9px] font-black px-1 py-0.5 rounded uppercase tracking-wider border border-brand-coral/40">
                LIVE
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-muted-grey font-medium -mt-0.5">
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
            className="p-1.5 rounded-lg bg-brand-orange/15 border border-brand-orange/30 text-brand-orange hover:bg-brand-orange hover:text-charcoal-950 transition-colors active:scale-95"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Role Aware Auth / Admin Button */}
          {currentUser ? (
            <Link
              to="/admin"
              onClick={() => nativeHaptics.selection()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-plum-800/60 dark:bg-plum-800/80 border border-plum-700/80 text-xs font-semibold text-brand-orange active:scale-95 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="max-w-[80px] truncate">
                {hasAdminRole ? 'Portal' : 'Account'}
              </span>
            </Link>
          ) : (
            <button
              onClick={() => {
                nativeHaptics.impact('light');
                onOpenLogin();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-charcoal-900 border border-slate-200 dark:border-plum-800/60 text-xs font-medium text-slate-700 dark:text-soft-white active:scale-95 transition-all"
            >
              <User className="w-3.5 h-3.5 text-slate-500 dark:text-muted-grey" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
