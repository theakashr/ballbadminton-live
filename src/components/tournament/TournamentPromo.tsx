import React from 'react';
import { 
  Trophy, 
  PlusCircle, 
  Check, 
  Smartphone, 
  Share2, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';

interface TournamentPromoProps {
  onCreateTournament: () => void;
}

export const TournamentPromo: React.FC<TournamentPromoProps> = ({
  onCreateTournament,
}) => {
  const highlights = [
    {
      title: 'Digital Court Umpire Pad',
      desc: 'Mobile-first live scorer pad that counts points, tracks 1st/2nd hand rotation, and flags game points automatically.',
      icon: Smartphone,
    },
    {
      title: 'Live Spectator Broadcast',
      desc: 'Share a clean public link. Students, alumni, and parents can follow every point in real-time from anywhere in the world.',
      icon: Share2,
    },
    {
      title: 'Automated Pool & Knockouts',
      desc: 'Input registered teams; our system calculates point differentials, sets won/lost ratios, and advances winners seamlessly.',
      icon: Trophy,
    },
    {
      title: 'Federation Standard Sheets',
      desc: 'Export official match sheets ready for state association submissions with signatures, set times, and referee notes.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="tournaments" className="py-20 bg-slate-50 dark:bg-charcoal-950 transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Promo Banner with Photography Integration */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-plum-800/80 bg-white dark:bg-plum-950 shadow-xl dark:shadow-elevated transition-colors duration-300">
          
          {/* Background tournament court image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/tournament-promo.jpg"
              alt="Ball Badminton championship tournament match under floodlights with active players, referee stand, and cheering crowd"
              className="w-full h-full object-cover object-center opacity-40 lg:opacity-55 dark:opacity-30 dark:lg:opacity-45"
            />
            {/* Gradient overlays to guarantee pristine typography in light and dark mode */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40 dark:from-plum-950 dark:via-plum-950/90 dark:to-charcoal-950/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-plum-950 dark:via-transparent dark:to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 p-6 sm:p-10 lg:p-16">
            <div className="max-w-3xl">
              
              {/* Kicker */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/15 dark:bg-brand-orange/20 border border-brand-orange/40 text-brand-orange text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tournament Management Engine</span>
              </div>

              {/* Exact required headline */}
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-slate-900 dark:text-soft-white leading-[1.1] mb-6">
                Your tournament deserves a better stage.
              </h2>

              {/* Exact required description */}
              <p className="text-lg sm:text-xl text-slate-700 dark:text-soft-white/80 font-normal leading-relaxed mb-8">
                Manage teams, fixtures, courts, and live scores from one place.
              </p>

              <p className="text-sm sm:text-base text-slate-600 dark:text-muted-grey max-w-xl mb-10 leading-relaxed">
                Whether you&apos;re organizing an inter-collegiate cup, a district invitational, or a state-level championship, 
                Ball Badminton Live turns pen-and-paper clipboards into an instant, televised-feel digital experience.
              </p>

              {/* Exact CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-14">
                <button
                  onClick={onCreateTournament}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold bg-brand-orange hover:bg-brand-orangeHover text-charcoal-950 shadow-orange-glow transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  <PlusCircle className="w-5 h-5 text-charcoal-950 stroke-[2.5]" />
                  <span>Create Your Tournament</span>
                </button>

                <div className="text-xs text-slate-500 dark:text-muted-grey flex items-center justify-center sm:justify-start gap-2">
                  <Check className="w-4 h-4 text-brand-orange" />
                  <span>No credit card required • Open access for colleges &amp; clubs</span>
                </div>
              </div>

              {/* 4 Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-slate-200 dark:border-plum-800/60">
                {highlights.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={index}
                      className="p-4 rounded-xl bg-white/80 dark:bg-charcoal-900/60 border border-slate-200 dark:border-plum-900/80 shadow-sm backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-plum-800/80 text-brand-orange">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-soft-white">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-muted-grey leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
