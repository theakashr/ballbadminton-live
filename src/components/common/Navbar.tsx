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
      setIsScrolled(window.scrollY > 15);
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
    { id: 'matches', label: 'Live Matches', href: '#live-matches', icon: Flame, badge: 'Live' },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E4E7EC] shadow-[0_2px_12px_rgba(16,24,40,0.04)] py-2.5'
          : 'bg-white/90 backdrop-blur-md border-b border-[#E4E7EC] py-3.5'
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
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#FFF1E5] border border-[#FF851B]/30 shadow-sm group-hover:border-[#FF851B] transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                {/* Racket */}
                <ellipse cx="14" cy="13" rx="8" ry="9.5" stroke="#FF851B" strokeWidth="1.8" />
                <path d="M10 7V19 M14 5V21 M18 7V19" stroke="#98A2B3" strokeWidth="0.75" opacity="0.6"/>
                <path d="M7 10H21 M6 13H22 M7 16H21" stroke="#98A2B3" strokeWidth="0.75" opacity="0.6"/>
                <line x1="14" y1="22.5" x2="14" y2="29" stroke="#182230" strokeWidth="2" strokeLinecap="round" />
                {/* Yellow Wool Ball */}
                <circle cx="23" cy="21" r="5" fill="#FFDC00" stroke="#FF851B" strokeWidth="1.2" />
                <path d="M20 21C21.5 23 24.5 23 26 21" stroke="#C49000" strokeWidth="0.8" strokeLinecap="round"/>
              </svg>
              {/* Live indicator dot */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#D92D20] border-2 border-white"></span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-lg sm:text-xl tracking-tight text-[#182230] group-hover:text-[#FF851B] transition-colors">
                  BALL BADMINTON
                </span>
                <span className="bg-[#D92D20]/10 text-[#D92D20] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-[#D92D20]/30">
                  LIVE
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-[#667085] font-semibold -mt-1 hidden sm:block">
                Federation Scoring &amp; Tournaments
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#F0F2F6] p-1 rounded-full border border-[#E4E7EC]">
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
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-[#FF851B] shadow-sm font-bold'
                      : 'text-[#667085] hover:text-[#182230] hover:bg-white/60'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D92D20] animate-pulse"></span>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#FF851B] bg-[#FFF1E5] border border-[#FF851B]/30 hover:bg-[#FF851B] hover:text-white transition-all active:scale-95"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>

            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#182230] bg-[#F0F2F6] border border-[#E4E7EC] hover:bg-[#E4E7EC] transition-all active:scale-95"
            >
              <User className="w-3.5 h-3.5 text-[#667085]" />
              <span>Login</span>
            </button>

            <button
              onClick={onCreateTournament}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF851B] hover:bg-[#E96F0B] text-white shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Tournament</span>
            </button>
          </div>

          {/* Mobile Menu Trigger Button */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />

            <button
              onClick={onCreateTournament}
              aria-label="Create Tournament"
              className="p-2 rounded-xl bg-[#FF851B] text-white hover:bg-[#E96F0B] transition-colors"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              className="p-2 rounded-xl bg-[#F0F2F6] border border-[#E4E7EC] text-[#182230] hover:text-[#FF851B]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[60px] z-40 sm:hidden">
          <div 
            className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative bg-white border-b border-[#E4E7EC] p-5 shadow-elevated flex flex-col gap-3 animate-in slide-in-from-top duration-200">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                const isActive = activeSection === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleLinkClick(link.id, link.href)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#FFF1E5] text-[#FF851B]'
                        : 'text-[#667085] hover:text-[#182230] hover:bg-[#F0F2F6]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#FF851B]' : 'text-[#667085]'}`} />
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-[#D92D20]/10 text-[#D92D20] text-[10px] font-bold">
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#E4E7EC] flex flex-col gap-2">
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#FFF1E5] text-[#FF851B] font-bold text-xs"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin &amp; Scorer Console</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
