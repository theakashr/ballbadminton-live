import React from 'react';
import { 
  X, 
  Activity, 
  Users2, 
  GitBranch, 
  TrendingUp, 
  Check, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface FeatureDetailModalProps {
  featureId: string | null;
  onClose: () => void;
  onActionClick: () => void;
}

export const FeatureDetailModal: React.FC<FeatureDetailModalProps> = ({
  featureId,
  onClose,
  onActionClick,
}) => {
  if (!featureId) return null;

  const featureDetails: Record<string, {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    bullets: string[];
    actionLabel: string;
  }> = {
    'live-scoring': {
      title: 'Real-Time Live Scoring',
      subtitle: 'Tailored for Ball Badminton 29-point sets and service rotation',
      icon: Activity,
      description: 'Traditional scoring apps only handle badminton or tennis. Ball Badminton Live tracks the unique 5s rules, 29 or 35 points per game, 1st and 2nd hand service progression, and court side switches at 15 points.',
      bullets: [
        'Instant point ticker broadcasted to fans and family online',
        'Automatic 1st Hand and 2nd Hand service turnover management',
        'Umpire single-tap interface designed for direct sunlight readability',
        'Change of ends tracker when leading team reaches 15 points',
      ],
      actionLabel: 'Watch Live Scoreboard',
    },
    'team-management': {
      title: '5s Team & Roster Management',
      subtitle: 'Official Ball Badminton Fives formation and positions',
      icon: Users2,
      description: 'Organize official squads consisting of 5 active players and 3 registered substitutes. Assign specific court positions including Front Net Smashers, Centre Pivot, Base Defenders, and designated Servers.',
      bullets: [
        'Roster cards with player jersey numbers and captain designations',
        'Substitution logs tracked with match timestamps and referee notes',
        'Inter-school and collegiate eligibility verification workflows',
        'Printable line-up forms for pre-match toss ceremonies',
      ],
      actionLabel: 'Explore Teams & Rosters',
    },
    'fixtures-brackets': {
      title: 'Automated Fixtures & Brackets',
      subtitle: 'Multi-court scheduling, pool tables, and knockout ladders',
      icon: GitBranch,
      description: 'Schedule dozens of tournament matches across up to 16 clay courts simultaneously without scheduling conflicts or umpire bottlenecks.',
      bullets: [
        'Double elimination, round-robin pool leagues, and straight knockouts',
        'Automatic court assignment with estimated start times',
        'Fair play tie-breaker formulas based on points difference ratio',
        'Real-time bracket updates as soon as match results are certified',
      ],
      actionLabel: 'View Current Fixtures',
    },
    'match-statistics': {
      title: 'Broadcast Match Statistics',
      subtitle: 'Deep insights into rallies, smash efficiency, and set duration',
      icon: TrendingUp,
      description: 'Elevate Ball Badminton coverage to the level of televised international sports with point-by-point breakdown and player impact analysis.',
      bullets: [
        'Rally point conversions and break points saved',
        'Set duration comparison across games',
        'Team head-to-head records and historical championship pedigree',
        'Official BBFI score sheet generation in standard export formats',
      ],
      actionLabel: 'View Recent Match Analytics',
    },
  };

  const current = featureDetails[featureId] || featureDetails['live-scoring'];
  const IconComponent = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-charcoal-950/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-charcoal-900 border border-plum-800 rounded-2xl sm:rounded-3xl shadow-elevated overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-plum-800/80 bg-plum-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-plum-800 flex items-center justify-center text-brand-orange">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-soft-white">
                {current.title}
              </h3>
              <p className="text-xs text-muted-grey">
                {current.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-grey hover:text-soft-white hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-soft-white/85 leading-relaxed">
            {current.description}
          </p>

          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-orange">
              Key Capabilities:
            </span>
            {current.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-muted-grey">
                <div className="w-4 h-4 rounded-full bg-plum-800 text-brand-orange flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>{bullet}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-charcoal-950/80 border border-plum-900/80 flex items-center gap-2 text-xs text-muted-grey">
            <Sparkles className="w-4 h-4 text-brand-orange shrink-0" />
            <span>Built in accordance with BBFI official rule regulations.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-plum-800/80 bg-charcoal-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-grey hover:text-soft-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onActionClick();
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-orange hover:bg-brand-orangeHover text-charcoal-950 shadow-orange-glow transition-all active:scale-95"
          >
            <span>{current.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
