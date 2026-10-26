import React from 'react';

interface SectionHeadingProps {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  align?: 'left' | 'center';
  theme?: 'dark' | 'light';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  kicker,
  title,
  description,
  action,
  align = 'left',
  theme = 'dark',
  className = '',
}) => {
  const isLight = theme === 'light';

  return (
    <div
      className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 ${
        align === 'center' ? 'text-center md:text-center items-center' : ''
      } ${className}`}
    >
      <div>
        {kicker && (
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-brand-orange"></span>
            <span className="text-xs uppercase tracking-widest font-bold text-brand-orange">
              {kicker}
            </span>
          </div>
        )}
        <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold tracking-tight ${
          isLight ? 'text-slate-950' : 'text-soft-white'
        }`}>
          {title}
        </h2>
        {description && (
          <p className={`mt-2 text-sm sm:text-base max-w-2xl ${
            isLight ? 'text-slate-600 font-normal' : 'text-muted-grey'
          }`}>
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
