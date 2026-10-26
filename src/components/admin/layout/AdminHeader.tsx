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
    <header className="min-h-[4rem] pt-safe px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-border-neutral sticky top-0 z-30 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl bg-surface-muted text-text-secondary hover:text-text-primary border border-border-neutral"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <Link
            to="/admin"
            className="text-text-secondary hover:text-text-primary font-medium transition-colors"
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
                  <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
                  {isLast ? (
                    <span className="font-bold text-text-primary">{title}</span>
                  ) : (
                    <Link
                      to={to}
                      className="text-text-secondary hover:text-text-primary font-medium transition-colors"
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
            ? 'bg-emerald-500/10 border-emerald-500/25 text-status-success'
            : 'bg-surface-muted border-border-neutral text-text-secondary'
        }`}>
          <span className={`w-2 h-2 rounded-full ${authBackend === 'supabase' ? 'bg-status-success' : 'bg-status-warning animate-pulse'}`} />
          <span>{authBackend === 'supabase' ? 'Supabase RLS Active' : 'Dev Prototype Mode'}</span>
        </div>

        {/* Theme Mode Switcher */}
        <ThemeToggle />

        {/* Quick link to live public site */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-border-neutral transition-colors shadow-sm"
          title="Open public website in new tab"
        >
          <span>View Site</span>
          <ExternalLink className="w-3.5 h-3.5 text-brand-orange" />
        </Link>

        {/* User Account / Role Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-surface-muted hover:bg-border-neutral border border-border-neutral text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
              style={{ backgroundColor: currentUser?.avatarBg || '#FF851B' }}
            >
              {currentUser?.name.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:block text-xs">
              <span className="font-bold text-text-primary block leading-tight truncate max-w-[130px]">
                {currentUser?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-brand-orange font-semibold uppercase tracking-wider block">
                {currentUser?.role.replace('_', ' ') || 'Admin'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary hidden sm:block" />
          </button>

          {/* User Menu Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-border-neutral shadow-card-hover p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-border-neutral mb-2">
                <p className="text-xs font-bold text-text-primary">{currentUser?.name}</p>
                <p className="text-[11px] text-text-secondary truncate">{currentUser?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-soft text-brand-orange border border-brand-orange/30">
                  {currentUser?.role.replace('_', ' ')}
                </span>
              </div>

              {/* Persona Switcher for Quick Role Testing - ONLY in Dev/Demo Mode */}
              {authBackend === 'demo' && (
                <div className="py-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
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
                              ? 'bg-brand-soft text-brand-orange font-bold border border-brand-orange/30'
                              : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="block truncate">{user.name}</span>
                            <span className="text-[10px] text-text-secondary truncate block">{user.email}</span>
                          </div>
                          {user.email === SUPER_ADMIN_EMAIL && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-status-warning font-bold shrink-0">
                              Super
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-border-neutral mt-2 flex flex-col gap-1">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate('/admin/settings');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-text-primary hover:bg-surface-muted flex items-center gap-2 rounded-lg"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Access & Role Permissions</span>
                </button>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-status-live hover:bg-rose-50 flex items-center gap-2 rounded-lg"
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
