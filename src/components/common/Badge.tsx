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
    live: 'bg-[#D92D20]/10 text-[#D92D20] border border-[#D92D20]/30 font-semibold',
    upcoming: 'bg-[#FFF1E5] text-[#B54708] border border-[#B54708]/30 font-semibold',
    completed: 'bg-[#16803D]/10 text-[#16803D] border border-[#16803D]/30 font-semibold',
    neutral: 'bg-[#F0F2F6] text-[#667085] border border-[#E4E7EC] font-medium',
    orange: 'bg-[#FF851B] text-white font-semibold shadow-sm',
    outline: 'bg-transparent text-[#667085] border border-[#E4E7EC]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full uppercase ${sizeClasses} ${variantClasses} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D92D20] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D92D20]"></span>
        </span>
      )}
      {children}
    </span>
  );
};
