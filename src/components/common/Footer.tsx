import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Shield, BookOpen, LayoutDashboard } from 'lucide-react';

interface FooterProps {
  onCreateTournament: () => void;
  onOpenLogin: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onCreateTournament,
  onOpenLogin,
  onNavigateSection,
}) => {
  return (
    <footer className="bg-slate-100 dark:bg-charcoal-950 border-t border-slate-200 dark:border-plum-900/80 pt-16 pb-12 relative overflow-hidden transition-colors duration-300">
      
      {/* Ambient background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand-orange/5 dark:bg-plum-900/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-200 dark:border-charcoal-800/80">
          
          {/* Brand & Mission Column */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Logo */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-brand-orange dark:from-plum-800 dark:to-charcoal-900 border border-amber-400 dark:border-plum-700/60 shadow-subtle">
                  <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                    <ellipse cx="14" cy="13" rx="8" ry="9.5" stroke="#FFFFFF" strokeWidth="1.8" />
                    <path d="M10 7V19 M14 5V21 M18 7V19" stroke="#F8F5F2" strokeWidth="0.75" opacity="0.6"/>
                    <path d="M7 10H21 M6 13H22 M7 16H21" stroke="#F8F5F2" strokeWidth="0.75" opacity="0.6"/>
                    <line x1="14" y1="22.5" x2="14" y2="29" stroke="#F8F5F2" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="23" cy="21" r="5" fill="#FFDC00" stroke="#FF851B" strokeWidth="1.2" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-xl tracking-tight text-slate-900 dark:text-soft-white">
                    BALL BADMINTON
                  </span>
                  <span className="bg-brand-coral/15 text-brand-coral text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-brand-coral/40">
                    LIVE
                  </span>
                </div>
              </div>

              {/* Short Product Description */}
              <p className="text-sm text-slate-600 dark:text-muted-grey leading-relaxed max-w-sm mb-6">
                The premier live scoring and championship broadcast engine dedicated to Ball Badminton — India&apos;s fast-paced heritage racquet sport. Built for schools, colleges, state associations, and sports academies.
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-soft-white/70">
                <Shield className="w-4 h-4 text-brand-orange" />
                <span>Standard BBFI 29-Point Scoring &amp; Service Rotation Compliant</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-900 dark:text-soft-white mb-4">
              Explore Matches
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-muted-grey">
              <li>
                <a
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateSection('home');
                    document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-slate-900 dark:hover:text-soft-white transition-colors"
                >
                  Home Scoreboard
                </a>
              </li>
              <li>
                <a
                  href="#live-matches"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateSection('matches');
                    document.getElementById('live-matches')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-slate-900 dark:hover:text-soft-white transition-colors flex items-center gap-1.5"
                >
                  <span>Live Courts</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-coral animate-pulse"></span>
                </a>
              </li>
              <li>
                <a
                  href="#upcoming-matches"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('upcoming-matches')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-slate-900 dark:hover:text-soft-white transition-colors"
                >
                  Upcoming Fixtures
                </a>
              </li>
              <li>
                <a
                  href="#recent-results"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateSection('results');
                    document.getElementById('recent-results')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-slate-900 dark:hover:text-soft-white transition-colors"
                >
                  Match Results &amp; Archives
                </a>
              </li>
            </ul>
          </div>

          {/* Tournament Management Links */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-900 dark:text-soft-white mb-4">
              Tournaments
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-muted-grey">
              <li>
                <Link
                  to="/admin"
                  className="text-left text-brand-orange hover:text-brand-orangeHover transition-colors font-semibold flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Admin Dashboard</span>
                </Link>
              </li>
              <li>
                <button
                  onClick={onCreateTournament}
                  className="text-left hover:text-brand-orange transition-colors font-medium text-brand-orange"
                >
                  + Create Tournament
                </button>
              </li>
              <li>
                <a
                  href="#tournaments"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-slate-900 dark:hover:text-soft-white transition-colors"
                >
                  Organizer Features
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenLogin}
                  className="text-left hover:text-slate-900 dark:hover:text-soft-white transition-colors"
                >
                  Court Scorer Pad Login
                </button>
              </li>
              <li>
                <span className="text-slate-400 dark:text-muted-grey/60 cursor-not-allowed">
                  Bracket Generator (Phase 2)
                </span>
              </li>
            </ul>
          </div>

          {/* Support Placeholder */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-900 dark:text-soft-white mb-4">
              Platform &amp; Rules Support
            </h4>
            <p className="text-xs text-slate-600 dark:text-muted-grey leading-relaxed mb-4">
              For federation inquiries, tournament onboarding, and referee scorer training:
            </p>

            <div className="p-3 rounded-xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-800 text-xs text-slate-800 dark:text-soft-white/80 space-y-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-orange shrink-0" />
                <span className="font-mono text-[11px] text-slate-600 dark:text-muted-grey">
                  support@ballbadmintonlive.in
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-charcoal-800">
                <BookOpen className="w-4 h-4 text-slate-400 dark:text-muted-grey shrink-0" />
                <span className="text-[11px] text-slate-600 dark:text-muted-grey">
                  BBFI Rulebook 2026 Reference
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Sportsmanship */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-muted-grey">
          <div>
            &copy; {new Date().getFullYear()} Ball Badminton Live. All rights reserved.
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 dark:text-muted-grey/70">
            <span>Preserving Indian sports heritage through modern digital tech</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-brand-orange font-medium">Phase 1 Release</span>
            <span>•</span>
            <span>React + TypeScript + Vite</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
