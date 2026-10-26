import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  User, 
  Lock, 
  AlertCircle, 
  CheckCircle, 
  KeyRound, 
  Info,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { signInWithPassword, loginWithEmail, authBackend } = useAuth();

  const [role, setRole] = useState<'scorer' | 'organizer' | 'fan'>('scorer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email or official scorer ID.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (authBackend === 'supabase') {
        const res = await signInWithPassword(email.trim(), password);
        if (!res.success) {
          setError(res.error || 'Authentication failed. Please check credentials.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = loginWithEmail(email.trim());
        if (!res.success) {
          setError(res.error || 'Email not found in authorized personas list.');
          setIsSubmitting(false);
          return;
        }
      }
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Login error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setEmail('');
    setPassword('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white border border-border-neutral rounded-2xl shadow-card-hover overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-neutral bg-surface-muted flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-soft flex items-center justify-center text-brand-orange border border-brand-orange/30">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-base font-display font-bold text-text-primary">
              Official Portal Sign In
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-border-neutral transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-soft border border-brand-orange flex items-center justify-center mx-auto text-brand-orange">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-display font-bold text-text-primary">
                Authorized Credentials Verified
              </h4>
              <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
                Welcome, <strong className="text-text-primary">{email}</strong>. You have been validated as an authorized {role}.
              </p>

              <div className="p-3 rounded-xl bg-brand-soft border border-brand-orange/30 text-left text-xs text-text-secondary flex items-start gap-2.5">
                <Info className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                <span>
                  <strong className="text-text-primary">Authentication Security:</strong> {authBackend === 'supabase' ? 'Verified session with Supabase Auth and PostgreSQL role-based authorization.' : 'Verified with development prototype persona catalog.'}
                </span>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(role === 'scorer' ? '/admin/scorers' : '/admin');
                  }}
                  className="w-full py-2.5 rounded-xl bg-brand-orange text-white font-bold text-sm shadow-card hover:bg-brand-orangeHover transition-colors flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Continue to {role === 'scorer' ? 'Scorer Console' : 'Admin Dashboard'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary border border-border-neutral hover:bg-surface-muted transition-colors"
                >
                  Switch Role or Sign Out
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Role selection tabs */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                  Select Access Level
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-muted border border-border-neutral">
                  <button
                    type="button"
                    onClick={() => setRole('scorer')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                      role === 'scorer'
                        ? 'bg-white text-text-primary font-bold shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Court Scorer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('organizer')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                      role === 'organizer'
                        ? 'bg-white text-text-primary font-bold shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Organizer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('fan')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                      role === 'fan'
                        ? 'bg-white text-text-primary font-bold shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Team Fan
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                  Email or Official ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'scorer' ? 'e.g. umpire.tn@bbfi.org' : 'organizer@university.edu'}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
                  />
                  <User className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                  Password or Court Pin
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-brand-orange transition-colors"
                  />
                  <Lock className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-status-live/40 text-xs text-status-live flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-brand-orange hover:bg-brand-orangeHover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-card transition-all active:scale-95"
                >
                  {isSubmitting ? 'Authenticating...' : 'Sign In to Live Scorer Console'}
                </button>
              </div>

              <div className="text-center">
                <span className="text-[11px] text-text-secondary">
                  Demo hint: Use any demo email and 6+ character password.
                </span>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
