import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Users, 
  BarChart2, 
  PlusCircle, 
  LayoutDashboard, 
  BookOpen, 
  ShieldCheck, 
  Smartphone, 
  Wifi, 
  ChevronRight,
  Sun,
  Moon,
  Download,
  Radio,
  Lock,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { nativeHaptics, isNativePlatform, registerBackButtonListener } from '../../lib/nativeBridge';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTeams: () => void;
  onOpenStats: () => void;
  onOpenCreateTournament: () => void;
  onOpenLogin: () => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({
  isOpen,
  onClose,
  onOpenTeams,
  onOpenStats,
  onOpenCreateTournament,
  onOpenLogin,
}) => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    logout, 
    isSuperAdmin, 
    isTournamentAdmin, 
    isScorer, 
    canManageTournaments,
    canScoreMatches 
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showRulesModal, setShowRulesModal] = useState(false);
  const { isInstallable, isInstalled, installApp } = usePwaInstall();
  const [installSuccess, setInstallSuccess] = useState(false);

  const isPrivilegedUser = isSuperAdmin || isTournamentAdmin || isScorer;

  const handleInstallClick = async () => {
    nativeHaptics.impact('medium');
    if (isInstallable) {
      const ok = await installApp();
      if (ok) setInstallSuccess(true);
    } else {
      alert('To install this app on your phone:\n\n• Android Chrome: Tap the 3 dots (⋮) at top right and tap "Install app" or "Add to Home screen".\n• iPhone Safari: Tap the Share button at bottom and tap "Add to Home Screen".');
    }
  };

  // Android hardware back button closes this sheet if open
  useEffect(() => {
    if (!isOpen) return;
    const cleanup = registerBackButtonListener(() => {
      onClose();
      return true;
    });
    return cleanup;
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (callback: () => void) => {
    nativeHaptics.impact('light');
    onClose();
    callback();
  };

  const handleNavigate = (path: string) => {
    nativeHaptics.selection();
    onClose();
    navigate(path);
  };

  const formatRoleLabel = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'Super Administrator';
      case 'tournament_admin': return 'Tournament Director';
      case 'official_scorer': return 'BBFI Certified Scorer';
      case 'viewer': return 'Spectator / Media';
      default: return 'Public Spectator';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden animate-fade-in-up">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Sheet Surface */}
      <div className="relative w-full max-h-[85vh] bg-charcoal-950 dark:bg-charcoal-950 border-t border-plum-800/80 rounded-t-3xl shadow-elevated overflow-y-auto pb-safe z-10">
        
        {/* Drag handle & close header */}
        <div className="sticky top-0 bg-charcoal-950/95 dark:bg-charcoal-950/95 backdrop-blur-md px-5 pt-3 pb-2 flex items-center justify-between border-b border-plum-900/60 z-20">
          <div className="w-12 h-1.5 bg-slate-400/30 dark:bg-plum-800 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-soft-white pt-2">
            Match Hub &amp; Tools
          </h2>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-charcoal-900 text-muted-grey hover:text-soft-white active:scale-90 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* User Profile & Role Status */}
          <div className="p-4 rounded-2xl bg-charcoal-900 border border-plum-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-sm"
                style={{ backgroundColor: currentUser?.avatarBg || '#FF851B' }}
              >
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm text-soft-white">
                    {currentUser?.name || 'Guest Spectator'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isPrivilegedUser
                      ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/40'
                      : 'bg-slate-700/40 text-muted-grey'
                  }`}>
                    {formatRoleLabel(currentUser?.role)}
                  </span>
                </div>
                <span className="text-xs text-muted-grey">
                  {currentUser?.email || 'Public spectating access'}
                </span>
              </div>
            </div>

            {currentUser ? (
              <button
                onClick={() => {
                  nativeHaptics.impact('light');
                  logout();
                }}
                title="Sign out"
                className="p-2 rounded-xl bg-charcoal-800 text-muted-grey hover:text-brand-coral active:scale-95 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleAction(onOpenLogin)}
                className="px-3 py-1.5 rounded-xl bg-brand-orange text-charcoal-950 font-bold text-xs shadow-sm active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Official Scorer & Admin Portal (Restricted to Authorized Roles) */}
          {isPrivilegedUser ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-plum-900 to-charcoal-900 border border-brand-orange/40 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-orange text-charcoal-950 font-bold">
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-soft-white">
                      Official Scorer &amp; Admin Portal
                    </h3>
                    <span className="text-xs text-muted-grey">
                      Authorized court access granted
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNavigate('/admin')}
                  className="py-2.5 px-3 rounded-xl bg-brand-orange text-charcoal-950 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                </button>

                {canScoreMatches && (
                  <button
                    onClick={() => handleNavigate('/admin/matches')}
                    className="py-2.5 px-3 rounded-xl bg-charcoal-800 hover:bg-plum-850 text-soft-white font-bold text-xs flex items-center justify-center gap-1.5 border border-plum-700/80 active:scale-95 transition-transform"
                  >
                    <Radio className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Court Scoring</span>
                  </button>
                )}
              </div>
            </div>
          ) : !currentUser ? (
            /* Sign in Prompt for Official Umpires */
            <div className="p-4 rounded-2xl bg-gradient-to-br from-plum-950 to-charcoal-900 border border-plum-800/60">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-plum-800 text-brand-orange">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-soft-white">
                      Federation Scorer Sign In
                    </h3>
                    <span className="text-xs text-muted-grey">
                      Certified umpires and tournament directors
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleAction(onOpenLogin)}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-brand-orange text-charcoal-950 font-bold text-xs flex items-center justify-center gap-2 shadow-orange-glow active:scale-95 transition-transform"
              >
                <span>Official Scorer Sign In</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : null}

          {/* Quick Hub Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAction(onOpenTeams)}
              className="p-3.5 rounded-2xl bg-charcoal-900 border border-charcoal-800 text-left hover:border-brand-orange/40 active:scale-95 transition-all flex flex-col justify-between"
            >
              <div className="p-2 w-fit rounded-xl bg-plum-800/60 text-brand-orange mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block text-soft-white">Teams Directory</span>
                <span className="text-[11px] text-muted-grey">State &amp; Academy squads</span>
              </div>
            </button>

            <button
              onClick={() => handleAction(onOpenStats)}
              className="p-3.5 rounded-2xl bg-charcoal-900 border border-charcoal-800 text-left hover:border-brand-orange/40 active:scale-95 transition-all flex flex-col justify-between"
            >
              <div className="p-2 w-fit rounded-xl bg-plum-800/60 text-brand-orange mb-2">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block text-soft-white">Stats &amp; Leaders</span>
                <span className="text-[11px] text-muted-grey">Aces, smashes &amp; points</span>
              </div>
            </button>

            {/* New Tournament Creation (Restricted to Authorized Admins) */}
            {canManageTournaments ? (
              <button
                onClick={() => handleAction(onOpenCreateTournament)}
                className="p-3.5 rounded-2xl bg-charcoal-900 border border-charcoal-800 text-left hover:border-brand-orange/40 active:scale-95 transition-all flex flex-col justify-between"
              >
                <div className="p-2 w-fit rounded-xl bg-plum-800/60 text-brand-orange mb-2">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm block text-soft-white">New Tournament</span>
                  <span className="text-[11px] text-muted-grey">Host or register championship</span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => handleNavigate('/tournaments')}
                className="p-3.5 rounded-2xl bg-charcoal-900 border border-charcoal-800 text-left hover:border-brand-orange/40 active:scale-95 transition-all flex flex-col justify-between"
              >
                <div className="p-2 w-fit rounded-xl bg-plum-800/60 text-brand-orange mb-2">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm block text-soft-white">Tournaments Hub</span>
                  <span className="text-[11px] text-muted-grey">Browse official events</span>
                </div>
              </button>
            )}

            <button
              onClick={() => {
                nativeHaptics.impact('light');
                setShowRulesModal(true);
              }}
              className="p-3.5 rounded-2xl bg-charcoal-900 border border-charcoal-800 text-left hover:border-brand-orange/40 active:scale-95 transition-all flex flex-col justify-between"
            >
              <div className="p-2 w-fit rounded-xl bg-plum-800/60 text-brand-orange mb-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block text-soft-white">BBFI Rules</span>
                <span className="text-[11px] text-muted-grey">Official scoring handbook</span>
              </div>
            </button>
          </div>

          {/* Theme Switcher Row */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-brand-orange" />
              ) : (
                <Sun className="w-5 h-5 text-brand-orange" />
              )}
              <div>
                <span className="text-sm font-bold text-soft-white block">Appearance</span>
                <span className="text-xs text-muted-grey">
                  Current: {theme === 'dark' ? 'Deep Plum Dark' : 'Clean White Light'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                nativeHaptics.selection();
                toggleTheme();
              }}
              className="px-3 py-1.5 rounded-xl bg-plum-800 text-xs font-bold text-soft-white active:scale-95 transition-transform"
            >
              Switch to {theme === 'dark' ? 'White' : 'Dark'}
            </button>
          </div>

          {/* PWA / App Install (When viewing in mobile browser) */}
          {!isNativePlatform() && !isInstalled && (
            <div className="p-3.5 rounded-2xl bg-plum-950/70 border border-brand-orange/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-orange text-charcoal-950 shrink-0">
                  <Download className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs text-soft-white">
                    {installSuccess ? 'App Installed!' : 'Add to Home Screen'}
                  </h4>
                  <p className="text-[11px] text-muted-grey">
                    1-tap match viewing and offline caching
                  </p>
                </div>
              </div>

              {!installSuccess && (
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 rounded-xl bg-brand-orange text-charcoal-950 font-bold text-xs shrink-0 active:scale-95"
                >
                  Install
                </button>
              )}
            </div>
          )}

          {/* System & Device Meta */}
          <div className="pt-2 border-t border-plum-900/60 flex items-center justify-between text-[11px] text-muted-grey">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-brand-orange" />
              <span>{isNativePlatform() ? 'Android Native Edition' : 'Mobile Web PWA'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase Cloud Connected</span>
            </span>
          </div>
        </div>
      </div>

      {/* Rules Quick Reference Drawer */}
      {showRulesModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 animate-fade-in-up">
          <div className="bg-charcoal-900 border border-plum-800 rounded-3xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-extrabold text-base text-soft-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-orange" />
                <span>BBFI Official Scoring Rules</span>
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-1 rounded-full bg-charcoal-800 text-muted-grey hover:text-soft-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs text-muted-grey">
              <div className="p-3 rounded-xl bg-plum-950/60 border border-plum-800">
                <strong className="text-soft-white block font-semibold mb-0.5">Points &amp; Sets</strong>
                Each match is best of 3 sets. A set is won by the first team to reach 29 points. Deuce rule applies if 28-all, up to maximum 33 points sudden death.
              </div>
              <div className="p-3 rounded-xl bg-plum-950/60 border border-plum-800">
                <strong className="text-soft-white block font-semibold mb-0.5">Serving Hand Rotation</strong>
                The starting team receives 1 Hand in the opening game. Subsequent serving turns grant 2 Hands (1st Hand, then 2nd Hand on point loss).
              </div>
              <div className="p-3 rounded-xl bg-plum-950/60 border border-plum-800">
                <strong className="text-soft-white block font-semibold mb-0.5">Court Dimensions &amp; Ball</strong>
                12 meters by 24 meters court divided by a 1.83m net. Played with standard 27-30g bright yellow wool ball.
              </div>
              <div className="p-3 rounded-xl bg-plum-950/60 border border-plum-800">
                <strong className="text-soft-white block font-semibold mb-0.5">5s Lineup &amp; Positions</strong>
                5 on-court players: 2 Net/Front smashers, 1 Centre/Pivot, 2 Base/Deep defenders, and designated server. Maximum 3 substitutions permitted per set.
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-brand-orange font-bold text-xs text-charcoal-950 active:scale-95"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
