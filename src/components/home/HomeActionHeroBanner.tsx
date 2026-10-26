import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Radio, ArrowRight, Sparkles, Flame, ShieldCheck } from 'lucide-react';
import { nativeHaptics } from '../../lib/nativeBridge';

export const HomeActionHeroBanner: React.FC = () => {
  return (
    <section 
      aria-label="Ball Badminton Action Showcase"
      className="w-full mt-10 sm:mt-14 mb-4"
    >
      <div className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E4E7EC] shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-[#15131B] flex flex-col md:flex-row md:items-center md:min-h-[500px] transition-all duration-300">
        
        {/* 1. High-Resolution Genuine Sports Action Photograph */}
        {/* On mobile: displayed as a full, dedicated image showcase on top so the players & action are 100% visible */}
        {/* On desktop: positioned absolute inset-0 to create a wide cinematic backdrop with smooth gradient */}
        <div className="relative md:absolute md:inset-0 w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-auto md:h-full overflow-hidden bg-[#15131B]">
          <img
            src="/images/tournament-promo.jpg"
            alt="Ball badminton players in action on the tournament court"
            width={1376}
            height={768}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-[78%_center] md:object-[center_35%] transform transition-transform duration-700 ease-out group-hover:scale-105"
          />
          
          {/* Gradients */}
          {/* Desktop gradient: left-to-right fade so text on left is crystal clear while players on right are vivid */}
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#15131B] via-[#15131B]/85 to-transparent pointer-events-none" />
          {/* Mobile bottom fade: smooth seamless transition into the text area below */}
          <div className="md:hidden absolute inset-0 bg-gradient-to-t from-[#15131B] via-transparent to-black/20 pointer-events-none" />

          {/* Floating Pill on mobile image */}
          <div className="md:hidden absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#FF851B] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF851B]">Ball Badminton Live</span>
            <span className="text-white/40">•</span>
            <span className="text-[10px] text-white/90">Championship Action</span>
          </div>

          <div className="md:hidden absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-semibold text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16803D]" />
            <span>Courtside Broadcast</span>
          </div>
        </div>

        {/* 2. Content Layer: Below the image on mobile, Over the left side on desktop */}
        <div className="relative z-10 w-full p-5 sm:p-8 md:p-12 lg:p-14 max-w-2xl text-left space-y-4 sm:space-y-5 md:space-y-6">
          
          {/* Desktop Platform Badge (hidden on mobile since it's on top of the image) */}
          <div className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#FF851B] animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#FF851B]">
              Ball Badminton Live
            </span>
            <span className="text-white/40">•</span>
            <span className="text-[11px] sm:text-xs font-medium text-white/90">
              Championship Action
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-1.5 sm:space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-black text-white tracking-tight leading-[1.12]">
              The Game. The Passion.{' '}
              <span className="text-[#FF851B] block sm:inline">
                The Live Action.
              </span>
            </h2>

            {/* Kannada Situation-Matching Tagline */}
            <p className="text-xs sm:text-sm md:text-base font-bold text-[#FFDC00] tracking-wide pt-0.5">
              ಆಟದ ರೋಮಾಂಚನ, ಕ್ರೀಡೆಯ ಸಂಭ್ರಮ — ನೇರ ಸ್ಕೋರ್ ನಿಮ್ಮೊಂದಿಗೆ!
            </p>

            {/* Description */}
            <p className="text-xs sm:text-sm md:text-base text-[#F8F5F2]/85 leading-relaxed font-normal pt-1 max-w-xl">
              Stay connected to every tournament, every rally, and every point. Follow your favorite teams with Ball Badminton Live.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 sm:pt-2">
            <Link
              to="/tournaments"
              onClick={() => nativeHaptics.selection()}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#FF851B] hover:bg-[#E96F0B] text-white font-display font-extrabold text-sm sm:text-base shadow-lg shadow-[#FF851B]/25 transition-all active:scale-95 group/btn"
            >
              <Trophy className="w-4 h-4" />
              <span>Explore Tournaments</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </Link>

            <Link
              to="/live"
              onClick={() => nativeHaptics.selection()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white font-display font-bold text-sm sm:text-base transition-all active:scale-95"
            >
              <Radio className="w-4 h-4 text-[#FF851B]" />
              <span>View Live Scores</span>
            </Link>
          </div>

          {/* Micro-Trust Highlights */}
          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-white/70">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#FF851B]" />
              <span>Official 29-Pt BBFI Scoring</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FFDC00]" />
              <span>Realtime Courtside Updates</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16803D]" />
              <span>Verified Federation Draws</span>
            </div>
          </div>

        </div>

        {/* 3. Ambient Floating Watermark Badge on Desktop */}
        <div className="hidden lg:flex absolute bottom-8 right-8 z-10 items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-white/80">
          <span className="w-2 h-2 rounded-full bg-[#16803D]" />
          <span>Verified Courtside Broadcast</span>
        </div>

      </div>
    </section>
  );
};
