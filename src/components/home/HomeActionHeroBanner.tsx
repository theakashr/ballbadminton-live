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
      <div className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E4E7EC] shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-[#15131B] min-h-[420px] sm:min-h-[460px] md:min-h-[500px] flex items-center transition-all duration-300">
        
        {/* 1. High-Resolution Genuine Sports Action Photograph Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img
            src="/images/tournament-promo.jpg"
            alt="Ball badminton players in action on the tournament court"
            width={1376}
            height={768}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center sm:object-[center_35%] transform transition-transform duration-700 ease-out group-hover:scale-105"
          />
          
          {/* 2. Cinematic Gradient Overlays for Maximum Legibility & Brand Feel */}
          {/* Desktop: Horizontal gradient from dark charcoal/plum to transparent */}
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#15131B] via-[#15131B]/85 to-transparent pointer-events-none" />
          {/* Mobile: Vertical gradient from dark bottom to subtle top */}
          <div className="md:hidden absolute inset-0 bg-gradient-to-t from-[#15131B] via-[#15131B]/90 to-[#15131B]/40 pointer-events-none" />
          
          {/* Subtle warm orange brand accent glow in top-left */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#FF851B]/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* 3. Foreground Content Layer */}
        <div className="relative z-10 w-full p-6 sm:p-10 md:p-12 lg:p-14 max-w-2xl text-left space-y-5 sm:space-y-6">
          
          {/* Platform Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-sm">
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
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-black text-white tracking-tight leading-[1.12]">
              The Game. The Passion.{' '}
              <span className="text-[#FF851B] block sm:inline">
                The Live Action.
              </span>
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base text-[#F8F5F2]/85 leading-relaxed font-normal pt-1 max-w-xl">
              Stay connected to every tournament, every rally, and every point. Follow your favorite teams with Ball Badminton Live.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
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
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-white/70">
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

        {/* 4. Ambient Floating Watermark Badge on Desktop */}
        <div className="hidden lg:flex absolute bottom-8 right-8 z-10 items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-white/80">
          <span className="w-2 h-2 rounded-full bg-[#16803D]" />
          <span>Verified Courtside Broadcast</span>
        </div>

      </div>
    </section>
  );
};
