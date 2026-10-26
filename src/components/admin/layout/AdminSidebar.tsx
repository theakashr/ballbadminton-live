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
      className={`h-full flex flex-col bg-charcoal-900 border-r border-plum-800/80 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand & Wordmark */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-plum-800/80 bg-plum-950/60">
        <NavLink
          to="/admin"
          onClick={onCloseMobile}
          className="flex items-center gap-3 focus:outline-none"
        >
          {/* Custom Ball Badminton Emblem */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-plum-800 to-charcoal-950 border border-brand-orange/40 flex items-center justify-center shrink-0 shadow-orange-glow">
            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
              <ellipse cx="14" cy="13" rx="8" ry="9.5" stroke="#FF851B" strokeWidth="1.8" />
              <line x1="14" y1="22.5" x2="14" y2="29" stroke="#F8F5F2" strokeWidth="2" strokeLinecap="round" />
              <circle cx="23" cy="21" r="4.5" fill="#FFDC00" stroke="#FF851B" strokeWidth="1.2" />
            </svg>
          </div>

          {!isCollapsed && (
            <div className="truncate">
              <span className="font-display font-bold text-sm tracking-wide text-soft-white block">
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
          className="hidden md:flex p-1.5 rounded-lg text-muted-grey hover:text-soft-white hover:bg-charcoal-800 transition-colors"
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
                    ? 'bg-plum-850 text-soft-white border border-plum-700/60 shadow-subtle'
                    : 'text-muted-grey hover:text-soft-white hover:bg-charcoal-800/60'
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
                      isActive ? 'text-brand-orange' : 'text-muted-grey group-hover:text-soft-white'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-coral/20 text-brand-coral border border-brand-coral/30">
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
        <div className="px-4 py-3 mx-3 mb-3 rounded-xl bg-plum-950 border border-plum-800/80">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-charcoal-950 uppercase"
              style={{ backgroundColor: currentUser.avatarBg || '#FF851B' }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-bold text-soft-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-brand-orange uppercase font-semibold tracking-wider truncate">
                {currentUser.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer / Switch back to public site */}
      <div className="p-3 border-t border-plum-800/80 bg-charcoal-950/60">
        <NavLink
          to="/"
          onClick={onCloseMobile}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-grey hover:text-soft-white hover:bg-charcoal-800 transition-colors"
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
            className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm"
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
