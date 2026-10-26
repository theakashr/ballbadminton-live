import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth, SUPER_ADMIN_EMAIL } from '../../../context/AuthContext';
import { 
  ShieldAlert, 
  Info,
  LogOut,
  ArrowLeft
} from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'tournament_admin' | 'official_scorer' | 'any';
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ 
  children,
  requiredRole = 'any'
}) => {
  const location = useLocation();
  const { 
    currentUser, 
    isLoading,
    isSuperAdmin,
    isTournamentAdmin,
    isScorer,
    logout
  } = useAuth();

  // 1. Session Loading State: Prevent flash of protected content before session is verified
  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange mb-4 shadow-sm">
          <div className="w-6 h-6 border-3 border-brand-orange border-t-transparent rounded-full animate-spin" />
        </div>
        <h3 className="font-display font-bold text-base text-text-primary">
          Verifying Official Credentials...
        </h3>
        <p className="text-xs text-text-secondary mt-1">
          Checking cryptographic session and database role authorization
        </p>
      </div>
    );
  }

  // 2. Unauthenticated Visitor: Redirect directly to login with original destination state
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Authenticated Role Verification
  const role = currentUser.role;
  const hasAdministrativePrivilege = (isSuperAdmin || isTournamentAdmin || isScorer) && currentUser.isActive;

  // 3a. Normal Authenticated Users (e.g. 'viewer' or non-admin roles): 403 Access Denied
  if (!hasAdministrativePrivilege) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-6 text-text-primary transition-colors duration-300">
        <div className="max-w-md w-full bg-white border border-red-200 p-8 rounded-2xl shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-status-live">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[10px] font-bold text-status-live uppercase tracking-wider">
            <span>403 Forbidden • Access Denied</span>
          </div>
          <h2 className="text-xl font-display font-bold text-text-primary">
            Administrative Access Denied
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            You are signed in as <strong className="text-text-primary">{currentUser.name}</strong> ({currentUser.email}), but this account is assigned a read-only role (<strong className="text-text-primary">{currentUser.role}</strong>). You do not have permissions to access the Ball Badminton Live administration portal.
          </p>
          <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral text-xs text-text-secondary text-left flex items-start gap-2.5">
            <Info className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              If you are a certified tournament director or official umpire, contact the Super Admin (<strong className="text-text-primary">{SUPER_ADMIN_EMAIL}</strong>) to request administrative privileges.
            </div>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/"
              className="w-full py-2.5 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:bg-brand-orangeHover transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Public Website</span>
            </Link>
            <button
              onClick={() => logout()}
              className="w-full py-2.5 rounded-xl bg-surface-muted text-text-primary font-semibold text-sm hover:bg-border-neutral border border-border-neutral transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4 text-status-live" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3b. Route-specific role restrictions
  if (requiredRole === 'super_admin' && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-6 text-text-primary transition-colors duration-300">
        <div className="max-w-md w-full bg-white border border-red-200 p-8 rounded-2xl shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-status-live">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-display font-bold text-text-primary">
            Restricted Platform Privilege
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            You are signed in as <strong className="text-text-primary">{currentUser.name}</strong> ({role.replace('_', ' ')}). This configuration area is restricted to the Platform Super Admin (<strong className="text-text-primary">{SUPER_ADMIN_EMAIL}</strong>).
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/admin"
              className="w-full py-2.5 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:bg-brand-orangeHover transition-colors shadow-sm"
            >
              Back to Permitted Console
            </Link>
            <button
              onClick={() => logout()}
              className="w-full py-2.5 rounded-xl bg-surface-muted text-text-primary font-semibold text-sm hover:bg-border-neutral border border-border-neutral transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4 text-status-live" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (requiredRole === 'tournament_admin' && !isSuperAdmin && !isTournamentAdmin) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-6 text-text-primary transition-colors duration-300">
        <div className="max-w-md w-full bg-white border border-red-200 p-8 rounded-2xl shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-status-live">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-display font-bold text-text-primary">
            Tournament Director Access Required
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            As an Official Scorer, your account is scoped to court match scorecards. Managing tournaments, teams, and rosters requires Tournament Director privileges.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/admin"
              className="w-full py-2.5 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:bg-brand-orangeHover transition-colors shadow-sm"
            >
              Return to Scorer Console
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Access Granted
  return <>{children}</>;
};
