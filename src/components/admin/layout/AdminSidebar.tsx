import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  UserCheck, 
  CalendarClock, 
  ClipboardList, 
  Settings, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  liveMatchesCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  liveMatchesCount = 2,
}) => {
  const { currentUser, isSuperAdmin } = useAuth();

  const navItems = [
    {
      to: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: '/admin/tournaments',
      label: 'Tournaments',
      icon: Trophy,
    },
    {
      to: '/admin/teams',
      label: 'Teams',
      icon: Users,
    },
    {
      to: '/admin/players',
      label: 'Players',
      icon: UserCheck,
    },
    {
      to: '/admin/matches',
      label: 'Matches',
      icon: CalendarClock,
      badge: liveMatchesCount > 0 ? `${liveMatchesCount} Live` : undefined,
      badgeColor: 'coral',
    },
    {
      to: '/admin/scorers',
      label: 'Scorers & Umpires',
      icon: ClipboardList,
    },
    {
      to: '/admin/settings',
      label: 'Platform & Access',
      icon: Settings,
      highlight: isSuperAdmin,
    },
  ];

  const content = (
    <aside
      className={`h-full flex flex-col bg-white border-r border-border-neutral transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand & Wordmark */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border-neutral bg-surface-muted">
        <NavLink
          to="/admin"
          onClick={onCloseMobile}
          className="flex items-center gap-3 focus:outline-none"
        >
          {/* Custom Ball Badminton Emblem */}
          <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-orange/40 flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
              <ellipse cx="14" cy="13" rx="8" ry="9.5" stroke="#FF851B" strokeWidth="1.8" />
              <line x1="14" y1="22.5" x2="14" y2="29" stroke="#182230" strokeWidth="2" strokeLinecap="round" />
              <circle cx="23" cy="21" r="4.5" fill="#FFDC00" stroke="#FF851B" strokeWidth="1.2" />
            </svg>
          </div>

          {!isCollapsed && (
            <div className="truncate">
              <span className="font-display font-bold text-sm tracking-wide text-text-primary block">
                Ball Badminton
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-orange flex items-center gap-1">
                Admin Console
              </span>
            </div>
          )}
        </NavLink>

        {/* Collapse button for desktop */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-border-neutral transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-brand-soft text-brand-orange border border-brand-orange/30 shadow-sm font-bold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                }`
              }
              title={isCollapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-orange" />
                  )}
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-brand-orange' : 'text-text-secondary group-hover:text-text-primary'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-status-live border border-status-live/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Current User Role Pill */}
      {!isCollapsed && currentUser && (
        <div className="px-4 py-3 mx-3 mb-3 rounded-xl bg-surface-muted border border-border-neutral">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm"
              style={{ backgroundColor: currentUser.avatarBg || '#FF851B' }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-bold text-text-primary truncate">{currentUser.name}</p>
              <p className="text-[10px] text-brand-orange uppercase font-semibold tracking-wider truncate">
                {currentUser.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer / Switch back to public site */}
      <div className="p-3 border-t border-border-neutral bg-surface-muted">
        <NavLink
          to="/"
          onClick={onCloseMobile}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white transition-colors border border-transparent hover:border-border-neutral shadow-sm"
          title="Exit Admin to Public Website"
        >
          <ArrowLeft className="w-4 h-4 text-brand-orange shrink-0" />
          {!isCollapsed && <span>Public Website</span>}
        </NavLink>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0 h-screen sticky top-0">
        {content}
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 max-w-xs animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
