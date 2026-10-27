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
  Mail,
  CheckCircle2,
  Key
} from 'lucide-react';
import { useAuth, SUPER_ADMIN_EMAIL } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentUser, 
    isLoading,
    loginWithEmail, 
    signInWithPassword,
    signInWithGoogle,
    switchActiveUser, 
    authBackend,
    isDevMode,
    logout
  } = useAuth();

  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Intended destination after successful login
  const from = (location.state as any)?.from?.pathname || '/admin';

  // Detect recovery mode from email reset link
  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
    }
  }, []);

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
    setSuccessMsg(null);
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

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleSubmitting(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to initiate Google sign in.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error redirecting to Google authentication.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const emailClean = inputEmail.trim().toLowerCase();

    if (!emailClean) {
      setErrorMsg('Please enter your registered Super Admin email address.');
      return;
    }

    if (!supabase) {
      setErrorMsg('Supabase is not configured. Reset requires cloud database connection.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailClean, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg(`Password reset instructions have been sent to ${emailClean}. Please check your inbox and spam folder.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while sending the reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (!supabase) {
      setErrorMsg('Supabase connection unavailable.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Your password has been successfully updated! Redirecting to admin console...');
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
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

          {/* Recovery Form (when arriving from email password reset link) */}
          {isRecoveryMode ? (
            <form onSubmit={handleUpdatePasswordSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-brand-soft border border-brand-orange/30 text-xs text-text-primary">
                <span className="font-bold block text-brand-orange mb-1">Set New Official Password</span>
                Enter a new secure password for your verified administrator account.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
                  />
                  <Key className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
                </div>
              </div>

              {errorMsg && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-status-live flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block">{errorMsg}</span>
                      {errorMsg.toLowerCase().includes('rate limit') && (
                        <p className="text-[11px] opacity-90 leading-relaxed">
                          Supabase restricts built-in email sending to a few emails per hour on default SMTP. You do not need an email — you can set your password instantly in your Supabase Dashboard.
                        </p>
                      )}
                      {errorMsg.toLowerCase().includes('not confirmed') && (
                        <p className="text-[11px] opacity-90 leading-relaxed">
                          Supabase requires email confirmation before signing in. You can mark your email as confirmed in 1 click in your Supabase Dashboard.
                        </p>
                      )}
                    </div>
                  </div>

                  {errorMsg.toLowerCase().includes('not confirmed') && (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 text-xs text-amber-950 space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <Sparkles className="w-4 h-4 text-brand-orange shrink-0" />
                        <span>Instant 1-Click Fix in Supabase:</span>
                      </div>
                      <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-amber-900 leading-relaxed">
                        <li>
                          Open{' '}
                          <a
                            href="https://supabase.com/dashboard/project/yrlavkouxglogrrkjchf/auth/users"
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold underline text-brand-orange hover:text-brand-orangeHover"
                          >
                            Supabase Dashboard → Users
                          </a>
                        </li>
                        <li>
                          Click the <strong>···</strong> menu next to <strong>{inputEmail || SUPER_ADMIN_EMAIL}</strong>
                        </li>
                        <li>
                          Click <strong>Confirm email</strong>.
                        </li>
                        <li>
                          Return here and click <em>Sign In to Official Console</em> to enter!
                        </li>
                      </ol>
                    </div>
                  )}

                  {errorMsg.toLowerCase().includes('rate limit') && (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 text-xs text-amber-950 space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <Sparkles className="w-4 h-4 text-brand-orange shrink-0" />
                        <span>Instant Bypass (Takes 10 Seconds):</span>
                      </div>
                      <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-amber-900 leading-relaxed">
                        <li>
                          Open{' '}
                          <a
                            href="https://supabase.com/dashboard/project/yrlavkouxglogrrkjchf/auth/users"
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold underline text-brand-orange hover:text-brand-orangeHover"
                          >
                            Supabase Dashboard → Users
                          </a>
                        </li>
                        <li>
                          Click the <strong>···</strong> menu next to <strong>{SUPER_ADMIN_EMAIL}</strong>
                        </li>
                        <li>
                          Click <strong>Change password</strong>, enter your new password, and click Save.
                        </li>
                        <li>
                          Return here, click <em>Back to Regular Sign In</em>, and enter your new password!
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-status-success flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Updating Password...' : 'Save New Password & Enter Admin'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : isForgotPassword ? (
            /* Forgot Password Request Form */
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral text-xs text-text-secondary">
                <span className="font-bold block text-text-primary mb-1">Reset Super Admin / Official Password</span>
                Enter your authorized email address (e.g. <strong className="text-text-primary">{SUPER_ADMIN_EMAIL}</strong>). We'll send a secure password reset link to your inbox.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Authorized Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder={SUPER_ADMIN_EMAIL}
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
                  />
                  <Mail className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
                </div>
              </div>

              {errorMsg && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-status-live flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block">{errorMsg}</span>
                      {errorMsg.toLowerCase().includes('rate limit') && (
                        <p className="text-[11px] opacity-90 leading-relaxed">
                          Supabase restricts built-in email sending to a few emails per hour on default SMTP. You do not need an email — you can set your password instantly in your Supabase Dashboard.
                        </p>
                      )}
                      {errorMsg.toLowerCase().includes('not confirmed') && (
                        <p className="text-[11px] opacity-90 leading-relaxed">
                          Supabase requires email confirmation before signing in. You can mark your email as confirmed in 1 click in your Supabase Dashboard.
                        </p>
                      )}
                    </div>
                  </div>

                  {errorMsg.toLowerCase().includes('not confirmed') && (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 text-xs text-amber-950 space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <Sparkles className="w-4 h-4 text-brand-orange shrink-0" />
                        <span>Instant 1-Click Fix in Supabase:</span>
                      </div>
                      <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-amber-900 leading-relaxed">
                        <li>
                          Open{' '}
                          <a
                            href="https://supabase.com/dashboard/project/yrlavkouxglogrrkjchf/auth/users"
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold underline text-brand-orange hover:text-brand-orangeHover"
                          >
                            Supabase Dashboard → Users
                          </a>
                        </li>
                        <li>
                          Click the <strong>···</strong> menu next to <strong>{inputEmail || SUPER_ADMIN_EMAIL}</strong>
                        </li>
                        <li>
                          Click <strong>Confirm email</strong>.
                        </li>
                        <li>
                          Return here and click <em>Sign In to Official Console</em> to enter!
                        </li>
                      </ol>
                    </div>
                  )}

                  {errorMsg.toLowerCase().includes('rate limit') && (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 text-xs text-amber-950 space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <Sparkles className="w-4 h-4 text-brand-orange shrink-0" />
                        <span>Instant Bypass (Takes 10 Seconds):</span>
                      </div>
                      <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-amber-900 leading-relaxed">
                        <li>
                          Open{' '}
                          <a
                            href="https://supabase.com/dashboard/project/yrlavkouxglogrrkjchf/auth/users"
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold underline text-brand-orange hover:text-brand-orangeHover"
                          >
                            Supabase Dashboard → Users
                          </a>
                        </li>
                        <li>
                          Click the <strong>···</strong> menu next to <strong>{SUPER_ADMIN_EMAIL}</strong>
                        </li>
                        <li>
                          Click <strong>Change password</strong>, enter your new password, and click Save.
                        </li>
                        <li>
                          Return here, click <em>Back to Regular Sign In</em>, and enter your new password!
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-status-success flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Sending Reset Link...' : 'Send Password Reset Link'}</span>
                <Mail className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full py-2 text-center text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
              >
                ← Back to Regular Sign In
              </button>
            </form>
          ) : (
            /* Standard Login Form */
            <div className="space-y-4">
              {/* Google OAuth One-Click Login */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleSubmitting || isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-surface-muted text-text-primary font-bold text-sm border border-border-neutral shadow-xs flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-60"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isGoogleSubmitting ? 'Connecting to Google...' : 'Sign In with Google'}</span>
              </button>

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-border-neutral w-full" />
                <span className="bg-white px-3 text-[11px] uppercase font-bold tracking-wider text-text-secondary absolute">
                  or sign in with password
                </span>
              </div>

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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-brand-orange hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
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
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-status-live flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block">{errorMsg}</span>
                      {errorMsg.toLowerCase().includes('rate limit') && (
                        <p className="text-[11px] opacity-90 leading-relaxed">
                          Supabase restricts built-in email sending to a few emails per hour on default SMTP. You do not need an email — you can set your password instantly in your Supabase Dashboard.
                        </p>
                      )}
                      {errorMsg.toLowerCase().includes('not confirmed') && (
                        <p className="text-[11px] opacity-90 leading-relaxed">
                          Supabase requires email confirmation before signing in. You can mark your email as confirmed in 1 click in your Supabase Dashboard.
                        </p>
                      )}
                    </div>
                  </div>

                  {errorMsg.toLowerCase().includes('not confirmed') && (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 text-xs text-amber-950 space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <Sparkles className="w-4 h-4 text-brand-orange shrink-0" />
                        <span>Instant 1-Click Fix in Supabase:</span>
                      </div>
                      <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-amber-900 leading-relaxed">
                        <li>
                          Open{' '}
                          <a
                            href="https://supabase.com/dashboard/project/yrlavkouxglogrrkjchf/auth/users"
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold underline text-brand-orange hover:text-brand-orangeHover"
                          >
                            Supabase Dashboard → Users
                          </a>
                        </li>
                        <li>
                          Click the <strong>···</strong> menu next to <strong>{inputEmail || SUPER_ADMIN_EMAIL}</strong>
                        </li>
                        <li>
                          Click <strong>Confirm email</strong>.
                        </li>
                        <li>
                          Return here and click <em>Sign In to Official Console</em> to enter!
                        </li>
                      </ol>
                    </div>
                  )}

                  {errorMsg.toLowerCase().includes('rate limit') && (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 text-xs text-amber-950 space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <Sparkles className="w-4 h-4 text-brand-orange shrink-0" />
                        <span>Instant Bypass (Takes 10 Seconds):</span>
                      </div>
                      <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-amber-900 leading-relaxed">
                        <li>
                          Open{' '}
                          <a
                            href="https://supabase.com/dashboard/project/yrlavkouxglogrrkjchf/auth/users"
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold underline text-brand-orange hover:text-brand-orangeHover"
                          >
                            Supabase Dashboard → Users
                          </a>
                        </li>
                        <li>
                          Click the <strong>···</strong> menu next to <strong>{SUPER_ADMIN_EMAIL}</strong>
                        </li>
                        <li>
                          Click <strong>Change password</strong>, enter your new password, and click Save.
                        </li>
                        <li>
                          Return here, click <em>Back to Regular Sign In</em>, and enter your new password!
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-status-success flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
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
          </div>
        )}

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
