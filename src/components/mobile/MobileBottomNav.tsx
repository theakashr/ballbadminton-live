import React from 'react';
import { Flame, Trophy, CheckCircle2, MoreHorizontal, Radio } from 'lucide-react';
import { nativeHaptics } from '../../lib/nativeBridge';

export type MobileTab = 'home' | 'live' | 'tournaments' | 'results' | 'more';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  liveMatchCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  liveMatchCount = 1,
}) => {
  const handleTabPress = (tab: MobileTab) => {
    nativeHaptics.selection();
    onTabChange(tab);
  };

  const navItems = [
    {
      id: 'home' as MobileTab,
      label: 'Home',
      icon: Flame,
    },
    {
      id: 'live' as MobileTab,
      label: 'Live',
      icon: Radio,
      badgeCount: liveMatchCount,
    },
    {
      id: 'tournaments' as MobileTab,
      label: 'Tournaments',
      icon: Trophy,
    },
    {
      id: 'results' as MobileTab,
      label: 'Results',
      icon: CheckCircle2,
    },
    {
      id: 'more' as MobileTab,
      label: 'More',
      icon: MoreHorizontal,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-charcoal-950/95 dark:bg-charcoal-950/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-plum-800/60 pb-safe shadow-elevated"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleTabPress(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-brand-orange font-bold'
                  : 'text-slate-500 dark:text-muted-grey hover:text-slate-800 dark:hover:text-soft-white'
              }`}
            >
              {/* Active Tab Accent Pill */}
              {isActive && (
                <span className="absolute inset-x-2 inset-y-1 bg-brand-orange/15 rounded-xl -z-10 animate-fade-in-up" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />

                {/* Live Match Notification Ping Badge */}
                {item.id === 'live' && item.badgeCount && item.badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-coral opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-coral border-2 border-charcoal-950" />
                  </span>
                )}
              </div>

              <span className="text-[11px] font-medium tracking-tight mt-1 leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
