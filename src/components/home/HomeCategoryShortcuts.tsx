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
      badgeColor: 'bg-[#D92D20]/10 text-[#D92D20] border-[#D92D20]/30',
      iconColor: 'text-[#D92D20]',
      borderColor: 'hover:border-[#D92D20]/60',
      action: () => navigate('/live'),
    },
    {
      id: 'upcoming',
      label: 'Upcoming Fixtures',
      subtitle: upcomingCount > 0 ? `${upcomingCount} scheduled` : 'Order of play',
      icon: Calendar,
      badge: upcomingCount > 0 ? `${upcomingCount} FIXTURES` : undefined,
      badgeColor: 'bg-[#FFF1E5] text-[#B54708] border-[#B54708]/30',
      iconColor: 'text-[#B54708]',
      borderColor: 'hover:border-[#B54708]/60',
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
      badgeColor: 'bg-[#FFF1E5] text-[#FF851B] border-[#FF851B]/30',
      iconColor: 'text-[#FF851B]',
      borderColor: 'hover:border-[#FF851B]/60',
      action: () => navigate('/tournaments'),
    },
    {
      id: 'results',
      label: 'Recent Results',
      subtitle: resultsCount > 0 ? `${resultsCount} completed` : 'Verified scorecards',
      icon: CheckCircle2,
      badge: resultsCount > 0 ? `${resultsCount} RESULTS` : undefined,
      badgeColor: 'bg-[#16803D]/10 text-[#16803D] border-[#16803D]/30',
      iconColor: 'text-[#16803D]',
      borderColor: 'hover:border-[#16803D]/60',
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
            className={`group relative flex flex-col justify-between p-4 rounded-2xl bg-white hover:bg-[#F0F2F6] border border-[#E4E7EC] ${item.borderColor} shadow-[0_1px_3px_rgba(16,24,40,0.05)] text-left transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange`}
          >
            <div className="flex items-start justify-between w-full mb-3">
              <div className="p-2.5 rounded-xl bg-[#F0F2F6] border border-[#E4E7EC] group-hover:scale-105 transition-transform">
                <Icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>

              {item.badge && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-display font-extrabold text-sm sm:text-base text-[#182230] group-hover:text-[#FF851B] transition-colors">
                  {item.label}
                </h4>
                <ChevronRight className="w-4 h-4 text-[#98A2B3] group-hover:text-[#FF851B] group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-[#667085] mt-0.5 line-clamp-1">
                {item.subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
