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
  Sun,
  Moon,
  Download,
  Radio,
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
        className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm transition-opacity"
      />

      {/* Sheet Surface */}
      <div className="relative w-full max-h-[85vh] bg-white border-t border-[#E4E7EC] rounded-t-3xl shadow-elevated overflow-y-auto pb-safe z-10 text-[#182230]">
        
        {/* Drag handle & close header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 pt-3 pb-2.5 flex items-center justify-between border-b border-[#E4E7EC] z-20">
          <div className="w-12 h-1.5 bg-[#E4E7EC] rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          
          <h2 className="font-display font-extrabold text-lg text-[#182230] pt-2">
            Match Hub &amp; Tools
          </h2>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#F0F2F6] text-[#667085] hover:text-[#182230] active:scale-90 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* User Profile & Role Status */}
          <div className="p-4 rounded-2xl bg-[#F0F2F6] border border-[#E4E7EC] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-sm"
                style={{ backgroundColor: currentUser?.avatarBg || '#FF851B' }}
              >
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm text-[#182230]">
                    {currentUser?.name || 'Guest Spectator'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isPrivilegedUser
                      ? 'bg-[#FFF1E5] text-[#FF851B] border border-[#FF851B]/30'
                      : 'bg-[#E4E7EC] text-[#667085]'
                  }`}>
                    {formatRoleLabel(currentUser?.role)}
                  </span>
                </div>
                <span className="text-xs text-[#667085]">
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
                className="p-2 rounded-xl bg-white border border-[#E4E7EC] text-[#667085] hover:text-[#D92D20] active:scale-95 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleNavigate('/login')}
                className="px-3.5 py-1.5 rounded-xl bg-[#FF851B] text-white font-bold text-xs shadow-sm hover:bg-[#E96F0B] active:scale-95"
              >
                Admin Login
              </button>
            )}
          </div>

          {/* Official Scorer & Admin Portal (Restricted to Authorized Roles) */}
          {isPrivilegedUser ? (
            <div className="p-4 rounded-2xl bg-[#FFF1E5] border border-[#FF851B]/30 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FF851B] text-white font-bold">
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-[#182230]">
                      Official Scorer &amp; Admin Portal
                    </h3>
                    <span className="text-xs text-[#667085]">
                      Authorized court access granted
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNavigate('/admin')}
                  className="py-2.5 px-3 rounded-xl bg-[#FF851B] text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                </button>

                {canScoreMatches && (
                  <button
                    onClick={() => handleNavigate('/admin/matches')}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-[#F0F2F6] text-[#182230] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#E4E7EC] active:scale-95 transition-transform"
                  >
                    <Radio className="w-3.5 h-3.5 text-[#FF851B]" />
                    <span>Court Scoring</span>
                  </button>
                )}
              </div>
            </div>
          ) : !currentUser ? (
            /* Sign in Prompt for Official Umpires & Super Admins */
            <div className="p-4 rounded-2xl bg-[#FFF1E5] border border-[#FF851B]/30 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FF851B] text-white">
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-[#182230]">
                      Super Admin &amp; Official Portal
                    </h3>
                    <span className="text-xs text-[#667085]">
                      Manage tournaments, assign scorers &amp; live scores
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => handleNavigate('/login')}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#FF851B] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#E96F0B] active:scale-95 transition-transform"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Login</span>
                </button>
                <button
                  onClick={() => handleAction(onOpenLogin)}
                  className="w-full py-2.5 px-3 rounded-xl bg-white border border-[#E4E7EC] text-[#182230] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#F0F2F6] active:scale-95 transition-transform"
                >
                  <span>Quick Scorer ID</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Quick Hub Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAction(onOpenTeams)}
              className="p-3.5 rounded-2xl bg-[#F0F2F6] border border-[#E4E7EC] text-left hover:border-[#FF851B]/40 active:scale-95 transition-all flex flex-col justify-between"
            >
              <div className="p-2 w-fit rounded-xl bg-[#FFF1E5] text-[#FF851B] mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block text-[#182230]">Teams Directory</span>
                <span className="text-[11px] text-[#667085]">State &amp; Academy squads</span>
              </div>
            </button>

            <button
              onClick={() => handleAction(onOpenStats)}
              className="p-3.5 rounded-2xl bg-[#F0F2F6] border border-[#E4E7EC] text-left hover:border-[#FF851B]/40 active:scale-95 transition-all flex flex-col justify-between"
            >
              <div className="p-2 w-fit rounded-xl bg-[#FFF1E5] text-[#FF851B] mb-2">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block text-[#182230]">Stats &amp; Leaders</span>
                <span className="text-[11px] text-[#667085]">Aces, smashes &amp; points</span>
              </div>
            </button>

            {/* New Tournament Creation (Restricted to Authorized Admins) */}
            {canManageTournaments ? (
              <button
                onClick={() => handleAction(onOpenCreateTournament)}
                className="p-3.5 rounded-2xl bg-[#F0F2F6] border border-[#E4E7EC] text-left hover:border-[#FF851B]/40 active:scale-95 transition-all flex flex-col justify-between"
              >
                <div className="p-2 w-fit rounded-xl bg-[#FFF1E5] text-[#FF851B] mb-2">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm block text-[#182230]">New Tournament</span>
                  <span className="text-[11px] text-[#667085]">Host or register championship</span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => handleNavigate('/tournaments')}
                className="p-3.5 rounded-2xl bg-[#F0F2F6] border border-[#E4E7EC] text-left hover:border-[#FF851B]/40 active:scale-95 transition-all flex flex-col justify-between"
              >
                <div className="p-2 w-fit rounded-xl bg-[#FFF1E5] text-[#FF851B] mb-2">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm block text-[#182230]">Tournaments Hub</span>
                  <span className="text-[11px] text-[#667085]">Browse official events</span>
                </div>
              </button>
            )}

            <button
              onClick={() => {
                nativeHaptics.impact('light');
                setShowRulesModal(true);
              }}
              className="p-3.5 rounded-2xl bg-[#F0F2F6] border border-[#E4E7EC] text-left hover:border-[#FF851B]/40 active:scale-95 transition-all flex flex-col justify-between"
            >
              <div className="p-2 w-fit rounded-xl bg-[#FFF1E5] text-[#FF851B] mb-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block text-[#182230]">BBFI Rules</span>
                <span className="text-[11px] text-[#667085]">Official scoring handbook</span>
              </div>
            </button>
          </div>

          {/* Theme Switcher Row */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F0F2F6] border border-[#E4E7EC]">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-[#FF851B]" />
              ) : (
                <Sun className="w-5 h-5 text-[#FF851B]" />
              )}
              <div>
                <span className="text-sm font-bold text-[#182230] block">Appearance</span>
                <span className="text-xs text-[#667085]">
                  Current: {theme === 'dark' ? 'Dark Mode' : 'Premium Light'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                nativeHaptics.selection();
                toggleTheme();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E4E7EC] text-xs font-bold text-[#182230] active:scale-95 transition-transform"
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* PWA / App Install (When viewing in mobile browser) */}
          {!isNativePlatform() && !isInstalled && (
            <div className="p-3.5 rounded-2xl bg-[#FFF1E5] border border-[#FF851B]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#FF851B] text-white shrink-0">
                  <Download className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs text-[#182230]">
                    {installSuccess ? 'App Installed!' : 'Add to Home Screen'}
                  </h4>
                  <p className="text-[11px] text-[#667085]">
                    1-tap match viewing and offline caching
                  </p>
                </div>
              </div>

              {!installSuccess && (
                <button
                  onClick={handleInstallClick}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FF851B] text-white font-bold text-xs shrink-0 active:scale-95"
                >
                  Install
                </button>
              )}
            </div>
          )}

          {/* System & Device Meta */}
          <div className="pt-2 border-t border-[#E4E7EC] flex items-center justify-between text-[11px] text-[#667085]">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#FF851B]" />
              <span>{isNativePlatform() ? 'Android Native Edition' : 'Mobile Web PWA'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-[#16803D]" />
              <span>Supabase Cloud Connected</span>
            </span>
          </div>
        </div>
      </div>

      {/* Rules Quick Reference Drawer */}
      {showRulesModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#182230]/48 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white border border-[#E4E7EC] rounded-3xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto text-[#182230] shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-extrabold text-base text-[#182230] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#FF851B]" />
                <span>BBFI Official Scoring Rules</span>
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-1.5 rounded-full bg-[#F0F2F6] text-[#667085] hover:text-[#182230]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs text-[#667085]">
              <div className="p-3 rounded-xl bg-[#F0F2F6] border border-[#E4E7EC]">
                <strong className="text-[#182230] block font-semibold mb-0.5">Points &amp; Sets</strong>
                Each match is best of 3 sets. A set is won by the first team to reach 29 points. Deuce rule applies if 28-all, up to maximum 33 points sudden death.
              </div>
              <div className="p-3 rounded-xl bg-[#F0F2F6] border border-[#E4E7EC]">
                <strong className="text-[#182230] block font-semibold mb-0.5">Serving Hand Rotation</strong>
                The starting team receives 1 Hand in the opening game. Subsequent serving turns grant 2 Hands (1st Hand, then 2nd Hand on point loss).
              </div>
              <div className="p-3 rounded-xl bg-[#F0F2F6] border border-[#E4E7EC]">
                <strong className="text-[#182230] block font-semibold mb-0.5">Court Dimensions &amp; Ball</strong>
                12 meters by 24 meters court divided by a 1.83m net. Played with standard 27-30g bright yellow wool ball.
              </div>
              <div className="p-3 rounded-xl bg-[#F0F2F6] border border-[#E4E7EC]">
                <strong className="text-[#182230] block font-semibold mb-0.5">5s Lineup &amp; Positions</strong>
                5 on-court players: 2 Net/Front smashers, 1 Centre/Pivot, 2 Base/Deep defenders, and designated server. Maximum 3 substitutions permitted per set.
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-[#FF851B] font-bold text-xs text-white hover:bg-[#E96F0B] active:scale-95 shadow-sm"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
