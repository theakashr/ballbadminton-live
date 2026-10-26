import React from 'react';
import { 
  Play, 
  PlusCircle, 
  Activity, 
  Users2, 
  GitBranch, 
  TrendingUp, 
  Radio, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { nativeHaptics } from '../../lib/nativeBridge';

interface HeroSectionProps {
  onWatchLive: () => void;
  onCreateTournament: () => void;
  onFeatureClick: (featureId: string) => void;
  liveMatchCount?: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onWatchLive,
  onCreateTournament,
  onFeatureClick,
  liveMatchCount = 3,
}) => {
  const featurePills = [
    { id: 'live-scoring', label: 'Live Scoring', icon: Activity, desc: 'Real-time points & serving hand' },
    { id: 'team-management', label: 'Team Management', icon: Users2, desc: '5s rosters & player line-ups' },
    { id: 'fixtures-brackets', label: 'Fixtures & Brackets', icon: GitBranch, desc: 'Pool tables & knockout seeds' },
    { id: 'match-statistics', label: 'Match Statistics', icon: TrendingUp, desc: 'Smash rates & set analysis' },
  ];

  return (
    <section 
      id="home"
      className="relative min-h-[85vh] lg:min-h-screen flex items-center pt-6 sm:pt-24 pb-12 sm:pb-16 overflow-hidden bg-white dark:bg-charcoal-950 transition-colors duration-300"
    >
      {/* Background Image with Cinematic Outdoor Sunset Court */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/images/hero-court.jpg"
          alt="Outdoor Ball Badminton clay court at sunset with authentic wooden racquet, official yellow wool ball, and tournament net"
          className="w-full h-full object-cover object-center lg:object-[68%_center] opacity-85 sm:opacity-90 dark:opacity-60 dark:lg:opacity-75 scale-100 transition-all duration-700 ease-out"
        />

        {/* Directional contrast gradient: in white mode, keeps court picture, racquet & ball completely visible on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-plum-950 dark:via-plum-950/85 dark:to-transparent lg:w-[58%] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent dark:from-charcoal-950 dark:via-charcoal-950/60 dark:to-transparent pointer-events-none" />
        <div className="hidden dark:block absolute inset-0 bg-radial-gradient from-transparent via-plum-950/30 to-charcoal-950/90 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Asymmetric Brand Statement */}
          <div className="lg:col-span-7 xl:col-span-7 pt-4 lg:pt-0">
            {/* Live Indicator Chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-plum-900/90 border border-slate-200 dark:border-plum-700/70 shadow-sm backdrop-blur-md mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-coral opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-coral"></span>
              </span>
              <span className="text-xs font-bold tracking-wider uppercase text-slate-800 dark:text-soft-white/90">
                Official BBFI Format
              </span>
              <span className="text-slate-400 dark:text-muted-grey text-xs">•</span>
              <span className="text-xs text-brand-orange font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 text-brand-coral" />
                {liveMatchCount} Matches Live Now
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-display font-extrabold tracking-tight text-slate-950 dark:text-soft-white leading-[1.08] mb-6">
              Ball Badminton.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-brand-coral to-slate-900 dark:to-soft-white">
                Live.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-900 dark:text-soft-white/85 max-w-xl font-bold leading-relaxed mb-4 text-balance">
              Every rally. Every point. Every tournament — all in one place.
            </p>

            <p className="text-sm sm:text-base text-slate-600 dark:text-muted-grey max-w-lg mb-8 leading-relaxed font-medium">
              Designed specifically for the speed of India&apos;s heritage racquet sport. 
              Track 29-point sets, 1st &amp; 2nd hand service rotations, and multi-court brackets with broadcast-grade precision.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-12">
              <button
                onClick={() => {
                  nativeHaptics.impact('light');
                  onWatchLive();
                }}
                className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-xl text-base font-bold bg-brand-orange hover:bg-brand-orangeHover text-charcoal-950 shadow-orange-glow transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <Play className="w-5 h-5 fill-charcoal-950 stroke-none" />
                <span>Watch Live Matches</span>
              </button>

              <button
                onClick={() => {
                  nativeHaptics.impact('light');
                  onCreateTournament();
                }}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-base font-bold bg-white dark:bg-plum-900/80 hover:bg-slate-50 dark:hover:bg-plum-850 text-slate-900 dark:text-soft-white border-2 border-slate-300 dark:border-plum-700/80 hover:border-brand-orange shadow-sm backdrop-blur-md transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <PlusCircle className="w-5 h-5 text-brand-orange stroke-[2.5]" />
                <span>Create Tournament</span>
              </button>
            </div>

            {/* Four Compact Feature Links */}
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-muted-grey font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                <span>Engineered for Ball Badminton Competitions</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {featurePills.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <button
                      key={feature.id}
                      onClick={() => onFeatureClick(feature.id)}
                      className="group flex flex-col text-left p-3 rounded-xl bg-white/95 dark:bg-charcoal-900/60 hover:bg-white dark:hover:bg-plum-900/80 border border-slate-200 dark:border-charcoal-800/80 hover:border-brand-orange/60 shadow-sm hover:shadow-md backdrop-blur-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-brand-orange group-hover:text-brand-coral transition-colors" />
                        <span className="text-xs font-bold text-slate-900 dark:text-soft-white group-hover:text-brand-orange transition-colors">
                          {feature.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-muted-grey leading-tight line-clamp-1 font-medium">
                        {feature.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Floating Broadcast Teaser Card */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col items-center lg:items-end justify-center">
            <div className="w-full max-w-md bg-white/95 dark:bg-charcoal-900/80 border border-slate-200 dark:border-plum-800/80 rounded-2xl p-5 shadow-xl dark:shadow-elevated backdrop-blur-md relative overflow-hidden group">
              {/* Top ambient glow line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange via-brand-coral to-transparent" />
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-coral opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-coral"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-coral">
                    Centre Court • Live Final
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-muted-grey bg-slate-100 dark:bg-charcoal-800 px-2 py-0.5 rounded border border-slate-200 dark:border-charcoal-700">
                  Set 3 of 3
                </span>
              </div>

              {/* Mini Match Scoreboard snippet */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-plum-950/60 border border-slate-200/80 dark:border-plum-900/60">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded bg-brand-orange/20 dark:bg-plum-800 flex items-center justify-center font-bold text-xs text-brand-orange border border-brand-orange/30 dark:border-plum-700">
                      TN
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-soft-white">Tamil Nadu Kings</div>
                      <div className="text-[10px] text-brand-orange font-semibold">Serving • 1st Hand</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 dark:text-muted-grey font-semibold">1 set</span>
                    <span className="text-2xl font-score font-black text-slate-900 dark:text-soft-white">24</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-plum-950/60 border border-slate-200/80 dark:border-plum-900/60">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded bg-brand-coral/20 dark:bg-charcoal-800 flex items-center justify-center font-bold text-xs text-brand-coral border border-brand-coral/30 dark:border-charcoal-700">
                      KA
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-soft-white">Karnataka Spikers</div>
                      <div className="text-[10px] text-slate-500 dark:text-muted-grey font-medium">Receiver</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 dark:text-muted-grey font-semibold">1 set</span>
                    <span className="text-2xl font-score font-black text-slate-900 dark:text-soft-white/80">21</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-charcoal-800/80">
                <span className="text-[11px] font-medium text-slate-500 dark:text-muted-grey">
                  70th Senior National Championship
                </span>
                <button
                  onClick={onWatchLive}
                  className="text-xs font-bold text-brand-orange hover:text-brand-coral flex items-center gap-1 transition-colors"
                >
                  <span>Scoreboard</span>
                  <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
