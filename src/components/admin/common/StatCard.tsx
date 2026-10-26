import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    neutral?: boolean;
  };
  accentColor?: 'orange' | 'coral' | 'yellow' | 'plum' | 'purple';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'orange',
  onClick,
}) => {
  const colorMap = {
    orange: {
      border: 'hover:border-brand-orange/40',
      iconBg: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
      glow: 'group-hover:shadow-orange-glow',
    },
    coral: {
      border: 'hover:border-brand-coral/40',
      iconBg: 'bg-brand-coral/15 text-brand-coral border-brand-coral/30',
      glow: 'group-hover:shadow-coral-glow',
    },
    yellow: {
      border: 'hover:border-brand-yellow/40',
      iconBg: 'bg-brand-yellow/15 text-brand-yellow border-brand-yellow/30',
      glow: '',
    },
    plum: {
      border: 'hover:border-plum-600/40',
      iconBg: 'bg-plum-800 text-soft-white border-plum-700',
      glow: '',
    },
    purple: {
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
      glow: '',
    },
  };

  const style = colorMap[accentColor];

  return (
    <div
      onClick={onClick}
      className={`group relative p-5 rounded-2xl bg-charcoal-900 border border-plum-800/80 shadow-subtle transition-all duration-200 ${
        style.border
      } ${style.glow} ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-grey">
            {title}
          </p>
          <p className="text-3xl font-display font-bold text-soft-white tracking-tight">
            {value}
          </p>
        </div>
        <div
          className={`p-3 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${style.iconBg}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-charcoal-800/80 flex items-center justify-between text-xs">
          {subtitle && <span className="text-muted-grey">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ${
                trend.neutral
                  ? 'text-muted-grey'
                  : trend.isPositive
                  ? 'text-emerald-400'
                  : 'text-brand-coral'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
