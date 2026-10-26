import React, { useState } from 'react';
import { useAuth, SUPER_ADMIN_EMAIL } from '../../../context/AuthContext';
import { 
  ShieldAlert, 
  KeyRound, 
  UserCheck, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'tournament_admin' | 'official_scorer' | 'any';
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ 
  children,
  requiredRole = 'any'
}) => {
  const { 
    currentUser, 
    loginWithEmail, 
    signInWithPassword,
    switchActiveUser, 
    authorizedUsers,
    authBackend,
    isDevMode,
    logout
  } = useAuth();

  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If user is logged in
  if (currentUser) {
    if (requiredRole === 'super_admin' && currentUser.role !== 'super_admin') {
      return (
        <div className="min-h-screen bg-app-bg flex items-center justify-center p-6 text-text-primary transition-colors duration-300">
          <div className="max-w-md w-full bg-white border border-red-200 p-8 rounded-2xl shadow-card text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-status-live">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-display font-bold text-text-primary">Restricted Platform Privilege</h2>
            <p className="text-sm text-text-secondary">
              You are currently signed in as <strong className="text-text-primary">{currentUser.name}</strong> ({currentUser.role}). This section requires Super Admin privileges.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              {isDevMode ? (
                <button
                  onClick={() => switchActiveUser(SUPER_ADMIN_EMAIL)}
                  className="w-full py-2.5 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:bg-brand-orangeHover transition-colors shadow-sm"
                >
                  Switch to Super Admin (Dev: {SUPER_ADMIN_EMAIL})
                </button>
              ) : (
                <button
                  onClick={() => logout()}
                  className="w-full py-2.5 rounded-xl bg-surface-muted text-text-primary font-semibold text-sm hover:bg-border-neutral border border-border-neutral transition-colors"
                >
                  Sign Out &amp; Authenticate as Super Admin
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }

  // Not logged in: Show Admin Authentication Gate
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!inputEmail.trim()) {
      setErrorMsg('Please enter an authorized email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authBackend === 'supabase') {
        if (!inputPassword) {
          setErrorMsg('Password is required for production authentication.');
          setIsSubmitting(false);
          return;
        }
        const res = await signInWithPassword(inputEmail, inputPassword);
        if (!res.success) {
          setErrorMsg(res.error || 'Authentication failed. Please check credentials.');
        }
      } else {
        const res = loginWithEmail(inputEmail);
        if (!res.success) {
          setErrorMsg(res.error || 'Access denied. Email not recognized.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4 selection:bg-brand-orange selection:text-white transition-colors duration-300">
      <div className="w-full max-w-lg bg-white border border-border-neutral rounded-2xl shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-6 border-b border-border-neutral bg-surface-muted">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-text-primary">
                  Ball Badminton Live Admin Console
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  authBackend === 'supabase'
                    ? 'bg-emerald-50 text-status-success border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {authBackend === 'supabase' ? 'Supabase Auth' : 'Dev Mode'}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Restricted to certified tournament directors, scorers, and officials
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Super Admin Quick Launch - ONLY rendered in Development/Demo Mode */}
          {isDevMode && (
            <div className="p-4 rounded-xl bg-brand-soft border border-brand-orange/30 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-orange" />
                  <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Designated Super Admin (Development Persona)
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-soft text-brand-orange font-semibold border border-brand-orange/20">
                  Dev Quick-Launch
                </span>
              </div>

              <div>
                <p className="text-sm font-semibold text-text-primary">{SUPER_ADMIN_EMAIL}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Full platform control: create tournaments, schedule matches, and grant access to other persons.
                </p>
              </div>

              <button
                type="button"
                onClick={() => switchActiveUser(SUPER_ADMIN_EMAIL)}
                className="w-full py-2.5 px-4 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <UserCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Launch Console as Super Admin</span>
              </button>
            </div>
          )}

          {isDevMode && (
            <div className="relative flex items-center justify-center">
              <div className="border-t border-border-neutral w-full" />
              <span className="bg-white px-3 text-xs text-text-secondary uppercase tracking-wider">
                Or Sign In with Official Email
              </span>
              <div className="border-t border-border-neutral w-full" />
            </div>
          )}

          {/* Email + Password form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Authorized Official Email
              </label>
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="name@bbfi.org or your authorized email"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>

            {authBackend === 'supabase' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-status-live flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : authBackend === 'supabase' ? 'Sign In to Official Dashboard' : 'Validate Authorized Access'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Pre-configured Authorized List for Demo Testing - ONLY in Dev/Demo Mode */}
          {isDevMode && (
            <div className="pt-2 border-t border-border-neutral">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Available Development Personas:
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {authorizedUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => switchActiveUser(user.id)}
                    className="w-full text-left p-2 rounded-lg bg-surface-muted hover:bg-border-neutral border border-border-neutral hover:border-brand-orange/40 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="truncate pr-2">
                      <span className="font-medium text-text-primary">{user.name}</span>
                      <span className="text-text-secondary block text-[11px] truncate">{user.email}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 bg-white text-text-primary border border-border-neutral">
                      {user.role.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Explicit Status Notice */}
          <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral flex items-start gap-2.5 text-left">
            <Info className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
            <div className="text-[11px] text-text-secondary leading-relaxed">
              <strong className="text-text-primary block">
                {authBackend === 'supabase' ? 'Production Supabase Security Active' : 'Development Auth Architecture Notice'}
              </strong>
              {authBackend === 'supabase'
                ? 'Authentication is verified by Supabase Auth with server-side JWT session validation and PostgreSQL Row Level Security (RLS).'
                : 'Role-aware authorization is running in local development mode. Persona switching is permitted only during development testing.'}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
