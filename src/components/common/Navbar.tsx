import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Menu, 
  X, 
  PlusCircle, 
  User, 
  Flame, 
  BarChart2, 
  Users, 
  CheckCircle2,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  onCreateTournament: () => void;
  onOpenLogin: () => void;
  activeSection?: string;
  onNavigateSection?: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onCreateTournament,
  onOpenLogin,
  activeSection = 'home',
  onNavigateSection,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { id: 'home', label: 'Home', href: '#home', icon: Flame },
    { id: 'matches', label: 'Matches', href: '#live-matches', icon: Flame, badge: 'Live' },
    { id: 'tournaments', label: 'Tournaments', href: '#tournaments', icon: Trophy },
    { id: 'results', label: 'Results', href: '#recent-results', icon: CheckCircle2 },
    { id: 'teams', label: 'Teams', href: '#teams', icon: Users },
    { id: 'stats', label: 'Stats', href: '#stats', icon: BarChart2 },
  ];

  const handleLinkClick = (id: string, href: string) => {
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(id);
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-charcoal-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-plum-800/50 shadow-sm dark:shadow-elevated py-3'
          : 'bg-gradient-to-b from-white/90 via-white/60 to-transparent dark:from-plum-950/85 dark:via-plum-950/50 dark:to-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Wordmark */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('home', '#home');
            }}
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded-lg p-1"
          >
            {/* Custom SVG Ball Badminton Badge */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-plum-800 to-charcoal-900 border border-plum-700/60 shadow-subtle group-hover:border-brand-orange/50 transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                {/* Racket */}
                <ellipse cx="14" cy="13" rx="8" ry="9.5" stroke="#FF851B" strokeWidth="1.8" />
                <path d="M10 7V19 M14 5V21 M18 7V19" stroke="#B7AFBD" strokeWidth="0.75" opacity="0.6"/>
                <path d="M7 10H21 M6 13H22 M7 16H21" stroke="#B7AFBD" strokeWidth="0.75" opacity="0.6"/>
                <line x1="14" y1="22.5" x2="14" y2="29" stroke="#F8F5F2" strokeWidth="2" strokeLinecap="round" />
                {/* Yellow Wool Ball */}
                <circle cx="23" cy="21" r="5" fill="#FFDC00" stroke="#FF851B" strokeWidth="1.2" />
                <path d="M20 21C21.5 23 24.5 23 26 21" stroke="#C49000" strokeWidth="0.8" strokeLinecap="round"/>
              </svg>
              {/* Subtle live indicator dot */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-coral border-2 border-charcoal-950"></span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-soft-white group-hover:text-brand-orange transition-colors">
                  BALL BADMINTON
                </span>
                <span className="bg-brand-coral/20 text-brand-coral text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-brand-coral/40">
                  LIVE
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-muted-grey font-semibold -mt-1 hidden sm:block">
                Federation Scoring &amp; Tournaments
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-charcoal-900/60 p-1.5 rounded-full border border-slate-200/80 dark:border-charcoal-800/80 backdrop-blur-md">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick(link.id, link.href);
                  }}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white dark:bg-plum-800 text-slate-950 dark:text-soft-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-muted-grey hover:text-slate-950 dark:hover:text-soft-white hover:bg-white/60 dark:hover:bg-charcoal-800/60'
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-coral animate-pulse"></span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Actions: Theme Toggle, Admin, Login & Create Tournament */}
          <div className="hidden sm:flex items-center gap-2.5">
            <ThemeToggle />

            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-brand-orange hover:text-soft-white hover:bg-plum-800/40 border border-brand-orange/40 hover:border-brand-orange transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin</span>
            </Link>

            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-soft-white/90 hover:text-slate-950 dark:hover:text-soft-white hover:bg-slate-100 dark:hover:bg-plum-800/40 border border-slate-200 dark:border-transparent transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              <User className="w-4 h-4 text-slate-500 dark:text-muted-grey" />
              <span>Login</span>
            </button>

            <button
              onClick={onCreateTournament}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-orange hover:bg-brand-orangeHover text-charcoal-950 transition-all shadow-orange-glow hover:shadow-lg active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              <PlusCircle className="w-4 h-4 text-charcoal-950 stroke-[2.5]" />
              <span>Create Tournament</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />

            <button
              onClick={onCreateTournament}
              aria-label="Create Tournament"
              className="p-2 rounded-lg bg-brand-orange text-charcoal-950 hover:bg-brand-orangeHover transition-colors"
            >
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              className="p-2 rounded-lg bg-charcoal-900 border border-charcoal-800 text-soft-white hover:text-brand-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[65px] z-40 sm:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative bg-charcoal-900 border-b border-plum-800/60 p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-top duration-200">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                const isActive = activeSection === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleLinkClick(link.id, link.href)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      isActive
                        ? 'bg-plum-850 text-soft-white border border-plum-700/50'
                        : 'text-muted-grey hover:text-soft-white hover:bg-charcoal-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-5 h-5 ${isActive ? 'text-brand-orange' : 'text-muted-grey'}`} />
                      <span>{link.label}</span>
                    </div>
                    {link.badge ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-brand-coral/20 text-brand-coral font-bold uppercase tracking-wider">
                        {link.badge}
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-charcoal-600" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-charcoal-800 flex flex-col gap-3">
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-orange/40 text-brand-orange hover:bg-plum-950 font-semibold text-sm transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-charcoal-700 text-soft-white hover:bg-charcoal-800 font-medium text-sm transition-colors"
              >
                <User className="w-4 h-4 text-muted-grey" />
                <span>Scorer & Organizer Login</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onCreateTournament();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-orange text-charcoal-950 font-bold text-sm shadow-orange-glow transition-all"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Create Tournament</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
