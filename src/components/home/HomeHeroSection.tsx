import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Radio, Flame, Sparkles, Activity } from 'lucide-react';
import { nativeHaptics } from '../../lib/nativeBridge';

interface HomeHeroSectionProps {
  liveCount?: number;
  tournamentsCount?: number;
}

export const HomeHeroSection: React.FC<HomeHeroSectionProps> = ({
  liveCount = 0,
  tournamentsCount = 0,
}) => {
  return (
    <section 
      aria-label="Ball Badminton Live Hero"
      className="w-full rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_4px_20px_-2px_rgba(16,24,40,0.06)] overflow-hidden mb-6 transition-all"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        
        {/* Left Column: Headlines, Description & Core CTAs */}
        <div className="lg:col-span-7 p-5 sm:p-7 lg:p-9 flex flex-col justify-between space-y-4 sm:space-y-5">
          <div className="space-y-3 sm:space-y-3.5">
            
            {/* Top Pill / Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1E5] border border-[#FF851B]/30 text-[11px] sm:text-xs font-bold text-[#FF851B] uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#FF851B] animate-pulse" />
                <span>BBFI Official Platform</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F2F6] border border-[#E4E7EC] text-[11px] font-semibold text-[#667085]">
                <Sparkles className="w-3 h-3 text-[#FF851B]" />
                <span>29-Point Standard Sets</span>
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-display font-black text-[#182230] tracking-tight leading-[1.12]">
              Every Match. Every Point.{' '}
              <span className="text-[#FF851B] underline decoration-[#FF851B]/30 decoration-wavy decoration-2">
                Live.
              </span>
            </h1>

            {/* Platform Description */}
            <p className="text-xs sm:text-sm md:text-base text-[#667085] leading-relaxed max-w-xl">
              Welcome to <strong>Ball Badminton Live</strong> — the authoritative platform for discovering premier state and national championships, real-time courtside rallies, upcoming fixtures, instant scorecards, and official BBFI points tables.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
            <Link
              to="/tournaments"
              onClick={() => nativeHaptics.selection()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF851B] hover:bg-[#E96F0B] text-white font-display font-extrabold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
            >
              <Trophy className="w-4 h-4" />
              <span>Explore Tournaments {tournamentsCount > 0 ? `(${tournamentsCount})` : ''}</span>
            </Link>

            <Link
              to="/live"
              onClick={() => nativeHaptics.selection()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F0F2F6] hover:bg-[#E4E7EC] border border-[#E4E7EC] text-[#182230] font-display font-bold text-xs sm:text-sm transition-all active:scale-95"
            >
              <Radio className="w-4 h-4 text-[#D92D20]" />
              <span>View Live Scores {liveCount > 0 ? `(${liveCount})` : ''}</span>
            </Link>
          </div>

          {/* Highlights Mini Stats Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-[#E4E7EC] text-left">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">Format</span>
              <span className="text-xs sm:text-sm font-bold text-[#182230]">5-Player Court</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">Service</span>
              <span className="text-xs sm:text-sm font-bold text-[#182230]">1st &amp; 2nd Hands</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">Updates</span>
              <span className="text-xs sm:text-sm font-bold text-[#FF851B] flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                <span>Instant Realtime</span>
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: High Quality Genuine Sports Court Image */}
        <div className="lg:col-span-5 relative w-full h-48 sm:h-64 lg:h-auto min-h-[190px] sm:min-h-[240px] lg:min-h-[340px] bg-[#F0F2F6] overflow-hidden border-t lg:border-t-0 lg:border-l border-[#E4E7EC]">
          <img
            src="/images/hero-court.jpg"
            alt="Badminton court match action and equipment"
            width={1376}
            height={768}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover object-center transform transition-transform duration-500 hover:scale-105"
          />
          
          {/* Subtle lighting gradient to ensure crisp boundary with light theme */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-white/30 lg:via-transparent lg:to-black/20 pointer-events-none" />

          {/* Floating Courtside Pill */}
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 right-3 sm:right-auto px-3 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-[#E4E7EC] shadow-sm flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FFF1E5] flex items-center justify-center text-[#FF851B] shrink-0 border border-[#FF851B]/30">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF851B]" />
            </div>
            <div className="text-left">
              <span className="text-[11px] sm:text-xs font-bold text-[#182230] block leading-tight">
                Courtside Action
              </span>
              <span className="text-[10px] text-[#667085] block">
                Live scores, points &amp; set results
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
