import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'live' | 'upcoming' | 'completed' | 'neutral' | 'orange' | 'outline';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs tracking-wider';

  const variantClasses = {
    live: 'bg-brand-coral/20 text-brand-coral border border-brand-coral/40 font-semibold',
    upcoming: 'bg-brand-orange/15 text-brand-orange border border-brand-orange/30 font-medium',
    completed: 'bg-muted-grey/15 text-muted-grey border border-muted-grey/25 font-medium',
    neutral: 'bg-charcoal-800 text-soft-white/80 border border-charcoal-700 font-normal',
    orange: 'bg-brand-orange text-charcoal-950 font-semibold shadow-sm',
    outline: 'bg-transparent text-soft-white/70 border border-charcoal-700',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full uppercase ${sizeClasses} ${variantClasses} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-coral opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-coral"></span>
        </span>
      )}
      {children}
    </span>
  );
};
