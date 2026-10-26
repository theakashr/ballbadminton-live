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
    <footer className="bg-[#F0F2F6] border-t border-[#E4E7EC] text-[#182230] pt-14 pb-12 relative overflow-hidden transition-colors duration-200">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#E4E7EC]">
          
          {/* Brand & Mission Column */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Logo */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FFF1E5] border border-[#FF851B]/30 shadow-sm">
                  <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                    <ellipse cx="14" cy="13" rx="8" ry="9.5" stroke="#FF851B" strokeWidth="1.8" />
                    <path d="M10 7V19 M14 5V21 M18 7V19" stroke="#98A2B3" strokeWidth="0.75" opacity="0.6"/>
                    <path d="M7 10H21 M6 13H22 M7 16H21" stroke="#98A2B3" strokeWidth="0.75" opacity="0.6"/>
                    <line x1="14" y1="22.5" x2="14" y2="29" stroke="#182230" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="23" cy="21" r="5" fill="#FFDC00" stroke="#FF851B" strokeWidth="1.2" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-xl tracking-tight text-[#182230]">
                    BALL BADMINTON
                  </span>
                  <span className="bg-[#D92D20]/10 text-[#D92D20] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-[#D92D20]/30">
                    LIVE
                  </span>
                </div>
              </div>

              {/* Short Product Description */}
              <p className="text-sm text-[#667085] leading-relaxed max-w-sm mb-6 font-normal">
                The premier live scoring and championship broadcast engine dedicated to Ball Badminton — India&apos;s fast-paced heritage racquet sport. Built for schools, colleges, state associations, and sports academies.
              </p>

              <div className="flex items-center gap-2 text-xs text-[#667085] font-medium">
                <Shield className="w-4 h-4 text-[#FF851B]" />
                <span>Standard BBFI 29-Point Scoring &amp; Service Rotation Compliant</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#182230] mb-4">
              Explore Matches
            </h4>
            <ul className="space-y-2.5 text-xs text-[#667085]">
              <li>
                <a
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateSection('home');
                    document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-[#182230] transition-colors"
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
                  className="hover:text-[#182230] transition-colors flex items-center gap-1.5"
                >
                  <span>Live Courts</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D92D20] animate-pulse"></span>
                </a>
              </li>
              <li>
                <a
                  href="#upcoming-matches"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('upcoming-fixtures-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-[#182230] transition-colors"
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
                    document.getElementById('recent-results-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-[#182230] transition-colors"
                >
                  Match Results &amp; Archives
                </a>
              </li>
            </ul>
          </div>

          {/* Tournament Management Links */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#182230] mb-4">
              Tournaments
            </h4>
            <ul className="space-y-2.5 text-xs text-[#667085]">
              <li>
                <Link
                  to="/admin"
                  className="text-left text-[#FF851B] hover:text-[#E96F0B] transition-colors font-semibold flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Admin Dashboard</span>
                </Link>
              </li>
              <li>
                <button
                  onClick={onCreateTournament}
                  className="text-left hover:text-[#E96F0B] transition-colors font-semibold text-[#FF851B]"
                >
                  + Create Tournament
                </button>
              </li>
              <li>
                <Link
                  to="/tournaments"
                  className="hover:text-[#182230] transition-colors"
                >
                  Browse Tournaments
                </Link>
              </li>
              <li>
                <button
                  onClick={onOpenLogin}
                  className="text-left hover:text-[#182230] transition-colors"
                >
                  Court Scorer Pad Login
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#182230] mb-4">
              Platform &amp; Rules Support
            </h4>
            <p className="text-xs text-[#667085] leading-relaxed mb-4">
              For federation inquiries, tournament onboarding, and referee scorer training:
            </p>

            <div className="p-3.5 rounded-xl bg-white border border-[#E4E7EC] text-xs text-[#182230] space-y-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FF851B] shrink-0" />
                <span className="font-mono text-[11px] text-[#667085]">
                  support@ballbadmintonlive.in
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-[#E4E7EC]">
                <BookOpen className="w-4 h-4 text-[#667085] shrink-0" />
                <span className="text-[11px] text-[#667085]">
                  BBFI Rulebook 2026 Reference
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Sportsmanship */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#667085]">
          <div>
            &copy; 2026 Ball Badminton Live. All rights reserved.
          </div>

          <div className="flex items-center gap-1.5 text-[#667085]">
            <span>Preserving Indian sports heritage through modern digital technology</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-[#FF851B] font-semibold">Premium Light Edition</span>
            <span>•</span>
            <span>BBFI Certified Platform</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
