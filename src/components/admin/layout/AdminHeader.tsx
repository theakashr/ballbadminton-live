import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  ChevronRight, 
  ShieldCheck, 
  LogOut, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { ThemeToggle } from '../../common/ThemeToggle';
import { useAuth, SUPER_ADMIN_EMAIL } from '../../../context/AuthContext';

interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenMobileSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    currentUser, 
    authorizedUsers, 
    switchActiveUser, 
    logout,
    authBackend
  } = useAuth();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumbs
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbMap: Record<string, string> = {
    admin: 'Admin',
    tournaments: 'Tournaments',
    teams: 'Teams',
    players: 'Players',
    matches: 'Matches',
    scorers: 'Scorers & Umpires',
    settings: 'Platform & Access',
  };

  return (
    <header className="min-h-[4rem] pt-safe px-4 sm:px-6 bg-charcoal-900/90 backdrop-blur-md border-b border-plum-800/80 sticky top-0 z-30 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl bg-charcoal-800 text-muted-grey hover:text-soft-white border border-charcoal-700"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <Link
            to="/admin"
            className="text-muted-grey hover:text-soft-white font-medium transition-colors"
          >
            Admin
          </Link>
          {pathParts.length > 1 &&
            pathParts.slice(1).map((part, idx) => {
              const to = `/admin/${pathParts.slice(1, idx + 2).join('/')}`;
              const isLast = idx === pathParts.length - 2;
              const title = breadcrumbMap[part] || part;
              return (
                <React.Fragment key={to}>
                  <ChevronRight className="w-3.5 h-3.5 text-charcoal-600" />
                  {isLast ? (
                    <span className="font-bold text-soft-white">{title}</span>
                  ) : (
                    <Link
                      to={to}
                      className="text-muted-grey hover:text-soft-white font-medium transition-colors"
                    >
                      {title}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
        </nav>
      </div>

      {/* Right: Dev Badge, Public Link, User Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Auth Mode Badge */}
        <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] ${
          authBackend === 'supabase'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-plum-950 border-plum-700/80 text-muted-grey'
        }`}>
          <span className={`w-2 h-2 rounded-full ${authBackend === 'supabase' ? 'bg-emerald-400' : 'bg-brand-yellow animate-pulse'}`} />
          <span>{authBackend === 'supabase' ? 'Supabase RLS Active' : 'Dev Prototype Mode'}</span>
        </div>

        {/* Theme Mode Switcher */}
        <ThemeToggle />

        {/* Quick link to live public site */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-soft-white/80 hover:text-soft-white hover:bg-charcoal-800 border border-charcoal-700 transition-colors"
          title="Open public website in new tab"
        >
          <span>View Site</span>
          <ExternalLink className="w-3.5 h-3.5 text-brand-orange" />
        </Link>

        {/* User Account / Role Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-charcoal-950 hover:bg-plum-950 border border-plum-800 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-charcoal-950 shrink-0"
              style={{ backgroundColor: currentUser?.avatarBg || '#FF851B' }}
            >
              {currentUser?.name.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:block text-xs">
              <span className="font-bold text-soft-white block leading-tight truncate max-w-[130px]">
                {currentUser?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-brand-orange font-semibold uppercase tracking-wider block">
                {currentUser?.role.replace('_', ' ') || 'Admin'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-grey hidden sm:block" />
          </button>

          {/* User Menu Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-charcoal-900 border border-plum-800 shadow-elevated p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-charcoal-800 mb-2">
                <p className="text-xs font-bold text-soft-white">{currentUser?.name}</p>
                <p className="text-[11px] text-muted-grey truncate">{currentUser?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                  {currentUser?.role.replace('_', ' ')}
                </span>
              </div>

              {/* Persona Switcher for Quick Role Testing - ONLY in Dev/Demo Mode */}
              {authBackend === 'demo' && (
                <div className="py-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-grey mb-1">
                    Switch Active Persona (Dev):
                  </p>
                  <div className="space-y-1">
                    {authorizedUsers.map((user) => {
                      const isActive = currentUser?.id === user.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            switchActiveUser(user.id);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                            isActive
                              ? 'bg-plum-850 text-soft-white font-bold border border-plum-700/60'
                              : 'text-muted-grey hover:text-soft-white hover:bg-charcoal-800'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="block truncate">{user.name}</span>
                            <span className="text-[10px] text-muted-grey/80 truncate block">{user.email}</span>
                          </div>
                          {user.email === SUPER_ADMIN_EMAIL && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-yellow/20 text-brand-yellow font-bold shrink-0">
                              Super
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-charcoal-800 mt-2 flex flex-col gap-1">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate('/admin/settings');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-soft-white hover:bg-charcoal-800 flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Access & Role Permissions</span>
                </button>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-brand-coral hover:bg-brand-coral/10 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
