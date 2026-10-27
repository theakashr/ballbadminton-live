import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Database, Server, LayoutDashboard, Trophy, Users, CalendarClock, Home } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { registerBackButtonListener, nativeHaptics } from '../../../lib/nativeBridge';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { authBackend, canManageTournaments, canManageTeams } = useAuth();

  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const cleanup = registerBackButtonListener(() => {
      setIsMobileSidebarOpen(false);
      return true;
    });
    return cleanup;
  }, [isMobileSidebarOpen]);

  const adminTabs = [
    { to: '/admin', label: 'Console', icon: LayoutDashboard, exact: true },
    ...(canManageTournaments ? [{ to: '/admin/tournaments', label: 'Tournaments', icon: Trophy, exact: false }] : []),
    ...(canManageTeams ? [{ to: '/admin/teams', label: 'Teams', icon: Users, exact: false }] : []),
    { to: '/admin/matches', label: 'Score & Matches', icon: CalendarClock, exact: false },
    { to: '/', label: 'Home', icon: Home, exact: true, isExternal: true },
  ];

  return (
    <div className="min-h-screen bg-app-bg text-text-primary font-sans flex selection:bg-brand-orange selection:text-white">
      {/* 1. Admin Sidebar */}
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        liveMatchesCount={2}
      />

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <AdminHeader onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        {/* Backend & Architecture Banner */}
        <div className="bg-brand-soft border-b border-border-neutral px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            {authBackend === 'supabase' ? (
              <>
                <Server className="w-3.5 h-3.5 text-status-success shrink-0" />
                <span className="truncate">
                  <strong className="text-text-primary">Supabase PostgreSQL:</strong> Authoritative live scoring &amp; RLS active.
                </span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                <span className="truncate">
                  <strong className="text-text-primary">Local Prototype:</strong> Offline repository mode.
                </span>
              </>
            )}
          </div>
          <span className={`hidden sm:inline-block px-2 py-0.5 rounded text-[10px] border font-mono ${
            authBackend === 'supabase'
              ? 'bg-emerald-500/10 text-status-success border-emerald-500/25'
              : 'bg-white text-brand-orange border-border-neutral'
          }`}>
            {authBackend === 'supabase' ? 'Supabase Cloud' : 'Prototype Demo'}
          </span>
        </div>

        {/* Page Viewport (with bottom padding for admin bottom nav on mobile) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
          <Outlet />
        </main>

        {/* 3. Mobile Admin Bottom Navigation Bar */}
        <nav
          aria-label="Admin Mobile Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-border-neutral shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe"
        >
          <div className="flex items-center justify-around h-14 px-2">
            {adminTabs.map((tab) => {
              const isActive = tab.exact 
                ? location.pathname === tab.to
                : location.pathname.startsWith(tab.to);
              const Icon = tab.icon;

              return (
                <button
                  key={tab.to}
                  type="button"
                  onClick={() => {
                    nativeHaptics.selection();
                    navigate(tab.to);
                  }}
                  className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                    isActive
                      ? 'text-brand-orange font-bold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  <span className="text-[10px] tracking-tight truncate max-w-[70px]">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};
