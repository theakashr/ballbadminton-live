import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  Info,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Mail
} from 'lucide-react';
import { useAuth, SUPER_ADMIN_EMAIL } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentUser, 
    isLoading,
    loginWithEmail, 
    signInWithPassword,
    switchActiveUser, 
    authBackend,
    isDevMode,
    logout
  } = useAuth();

  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Intended destination after successful login
  const from = (location.state as any)?.from?.pathname || '/admin';

  // If already authenticated with administrative access, redirect immediately
  useEffect(() => {
    if (!isLoading && currentUser) {
      const role = currentUser.role;
      const hasAdmin = (role === 'super_admin' || role === 'tournament_admin' || role === 'official_scorer') && currentUser.isActive;
      if (hasAdmin) {
        // Direct scorers to scorer console if navigating to root admin
        const target = from === '/admin' && role === 'official_scorer' ? '/admin/scorers' : from;
        navigate(target, { replace: true });
      }
    }
  }, [currentUser, isLoading, from, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange mb-4 shadow-sm">
          <div className="w-6 h-6 border-3 border-brand-orange border-t-transparent rounded-full animate-spin" />
        </div>
        <h3 className="font-display font-bold text-base text-text-primary">
          Checking Authentication...
        </h3>
      </div>
    );
  }

  // If user is logged in as viewer, show notification
  if (currentUser && currentUser.role === 'viewer') {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-border-neutral rounded-2xl shadow-elevated p-6 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-display font-bold text-text-primary">
            Signed In as Spectator
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            You are signed in as <strong className="text-text-primary">{currentUser.name}</strong> ({currentUser.email}). This account is registered with read-only viewer access.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/"
              className="w-full py-2.5 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:bg-brand-orangeHover transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <span>Return to Public Website</span>
            </Link>
            <button
              onClick={() => logout()}
              className="w-full py-2.5 rounded-xl bg-surface-muted text-text-primary font-semibold text-sm hover:bg-border-neutral border border-border-neutral transition-colors"
            >
              Sign Out &amp; Use Authorized Official Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const emailClean = inputEmail.trim();

    if (!emailClean) {
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
        const res = await signInWithPassword(emailClean, inputPassword);
        if (!res.success) {
          setErrorMsg(res.error || 'Authentication failed. Please check credentials.');
        } else {
          navigate(from, { replace: true });
        }
      } else {
        const res = loginWithEmail(emailClean);
        if (!res.success) {
          setErrorMsg(res.error || 'Access denied. Email not recognized.');
        } else {
          navigate(from, { replace: true });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col justify-center items-center p-4 selection:bg-brand-orange selection:text-white transition-colors">
      <div className="w-full max-w-md bg-white border border-border-neutral rounded-2xl shadow-elevated overflow-hidden">
        
        {/* Header */}
        <div className="p-6 sm:p-8 pb-6 border-b border-border-neutral bg-surface-muted">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange shrink-0 shadow-sm">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-display font-bold text-text-primary">
                  Official Portal Sign In
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

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* Dev Quick-Launch Banner (Only in local Dev Mode) */}
          {isDevMode && (
            <div className="p-4 rounded-xl bg-brand-soft border border-brand-orange/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-orange" />
                  <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Dev Quick-Launch Persona
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-brand-orange font-semibold border border-brand-orange/20">
                  Dev Test
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                Simulate verified credentials for local development testing:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    switchActiveUser(SUPER_ADMIN_EMAIL);
                    navigate(from, { replace: true });
                  }}
                  className="p-2 rounded-lg bg-white border border-border-neutral hover:border-brand-orange text-left text-xs transition-colors"
                >
                  <span className="font-bold text-text-primary block">Super Admin</span>
                  <span className="text-[10px] text-text-secondary block truncate">{SUPER_ADMIN_EMAIL}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    switchActiveUser('organizer.coimbatore@bbfi.org');
                    navigate(from, { replace: true });
                  }}
                  className="p-2 rounded-lg bg-white border border-border-neutral hover:border-brand-orange text-left text-xs transition-colors"
                >
                  <span className="font-bold text-text-primary block">Organizer</span>
                  <span className="text-[10px] text-text-secondary block truncate">organizer@bbfi.org</span>
                </button>
              </div>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Authorized Official Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="name@bbfi.org or your authorized email"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
                />
                <Mail className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
              </div>
            </div>

            {authBackend === 'supabase' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
                  />
                  <Lock className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
                </div>
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
              <span>{isSubmitting ? 'Authenticating Credentials...' : 'Sign In to Official Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Notice */}
          <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral flex items-start gap-2.5 text-left">
            <Info className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
            <div className="text-[11px] text-text-secondary leading-relaxed">
              <strong className="text-text-primary block">Cryptographic Session Verification</strong>
              Access requires an active cryptographic session with verified database role permissions. Public visitors can view fixtures, scores, and standings without signing in.
            </div>
          </div>

          {/* Back link */}
          <div className="pt-2 text-center border-t border-border-neutral">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Website</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};
