import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Calendar, Trophy, CheckCircle2, ChevronRight } from 'lucide-react';
import { nativeHaptics } from '../../lib/nativeBridge';

interface HomeCategoryShortcutsProps {
  liveCount: number;
  upcomingCount: number;
  tournamentsCount: number;
  resultsCount: number;
  onScrollToUpcoming?: () => void;
}

export const HomeCategoryShortcuts: React.FC<HomeCategoryShortcutsProps> = ({
  liveCount,
  upcomingCount,
  tournamentsCount,
  resultsCount,
  onScrollToUpcoming,
}) => {
  const navigate = useNavigate();

  const shortcuts = [
    {
      id: 'live',
      label: 'Live Matches',
      subtitle: liveCount > 0 ? `${liveCount} in play now` : 'Watch realtime feed',
      icon: Radio,
      badge: liveCount > 0 ? `${liveCount} LIVE` : undefined,
      badgeColor: 'bg-brand-coral/20 text-brand-coral border-brand-coral/40',
      iconColor: 'text-brand-coral',
      borderColor: 'hover:border-brand-coral/60',
      action: () => navigate('/live'),
    },
    {
      id: 'upcoming',
      label: 'Upcoming Fixtures',
      subtitle: upcomingCount > 0 ? `${upcomingCount} scheduled` : 'Order of play',
      icon: Calendar,
      badge: upcomingCount > 0 ? `${upcomingCount} MATCHES` : undefined,
      badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
      iconColor: 'text-sky-400',
      borderColor: 'hover:border-sky-500/60',
      action: () => {
        if (onScrollToUpcoming) {
          onScrollToUpcoming();
        } else {
          navigate('/live');
        }
      },
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      subtitle: tournamentsCount > 0 ? `${tournamentsCount} championships` : 'Draws & pools',
      icon: Trophy,
      badge: tournamentsCount > 0 ? `${tournamentsCount} ACTIVE` : undefined,
      badgeColor: 'bg-brand-orange/20 text-brand-orange border-brand-orange/40',
      iconColor: 'text-brand-orange',
      borderColor: 'hover:border-brand-orange/60',
      action: () => navigate('/tournaments'),
    },
    {
      id: 'results',
      label: 'Recent Results',
      subtitle: resultsCount > 0 ? `${resultsCount} completed` : 'Verified scorecards',
      icon: CheckCircle2,
      badge: resultsCount > 0 ? `${resultsCount} RESULTS` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      iconColor: 'text-emerald-400',
      borderColor: 'hover:border-emerald-500/60',
      action: () => navigate('/results'),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6 sm:my-8">
      {shortcuts.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => {
              nativeHaptics.impact('light');
              item.action();
            }}
            className={`group relative flex flex-col justify-between p-3.5 sm:p-5 rounded-2xl bg-charcoal-900/90 hover:bg-plum-950/90 border border-plum-800/60 ${item.borderColor} shadow-subtle text-left transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange`}
          >
            <div className="flex items-start justify-between w-full mb-3">
              <div className="p-2.5 rounded-xl bg-charcoal-800/90 border border-plum-800/80 group-hover:scale-105 transition-transform">
                <Icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>

              {item.badge && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-display font-extrabold text-sm sm:text-base text-soft-white group-hover:text-brand-orange transition-colors">
                  {item.label}
                </h4>
                <ChevronRight className="w-4 h-4 text-plum-600 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-muted-grey mt-0.5 line-clamp-1">
                {item.subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
