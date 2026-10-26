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
      iconBg: 'bg-brand-soft text-brand-orange border-brand-orange/20',
      glow: '',
    },
    coral: {
      border: 'hover:border-status-live/40',
      iconBg: 'bg-red-50 text-status-live border-red-200',
      glow: '',
    },
    yellow: {
      border: 'hover:border-amber-400/40',
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
      glow: '',
    },
    plum: {
      border: 'hover:border-purple-300',
      iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
      glow: '',
    },
    purple: {
      border: 'hover:border-purple-300',
      iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
      glow: '',
    },
  };

  const style = colorMap[accentColor];

  return (
    <div
      onClick={onClick}
      className={`group relative p-5 rounded-2xl bg-white border border-border-neutral shadow-card transition-all duration-200 hover:shadow-md ${
        style.border
      } ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {title}
          </p>
          <p className="text-3xl font-display font-bold text-text-primary tracking-tight">
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
        <div className="mt-4 pt-3 border-t border-border-neutral flex items-center justify-between text-xs">
          {subtitle && <span className="text-text-secondary">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ${
                trend.neutral
                  ? 'text-text-secondary'
                  : trend.isPositive
                  ? 'text-status-success'
                  : 'text-status-live'
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
