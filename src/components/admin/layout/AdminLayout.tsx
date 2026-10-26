import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Database, Server } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { registerBackButtonListener } from '../../../lib/nativeBridge';

export const AdminLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { authBackend } = useAuth();

  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const cleanup = registerBackButtonListener(() => {
      setIsMobileSidebarOpen(false);
      return true;
    });
    return cleanup;
  }, [isMobileSidebarOpen]);

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
                  <strong className="text-text-primary">Supabase PostgreSQL Connected:</strong> RLS policies active, authoritative RPC scoring, and Realtime stream.
                </span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                <span className="truncate">
                  <strong className="text-text-primary">Local Prototype Repository:</strong> Offline development mode. Connect Supabase in <code>.env.local</code> to enable cloud sync.
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

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
