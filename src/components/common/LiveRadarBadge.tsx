import React from 'react';

interface LiveRadarBadgeProps {
  label?: string;
  size?: 'sm' | 'md';
  pulseColor?: 'orange' | 'coral' | 'emerald';
}

export const LiveRadarBadge: React.FC<LiveRadarBadgeProps> = ({
  label = 'LIVE',
  size = 'md',
  pulseColor = 'coral',
}) => {
  const bgClasses = {
    coral: 'bg-brand-coral/15 text-brand-coral border-brand-coral/30',
    orange: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  }[pulseColor];

  const dotClasses = {
    coral: 'bg-brand-coral',
    orange: 'bg-brand-orange',
    emerald: 'bg-emerald-400',
  }[pulseColor];

  const radarClasses = {
    coral: 'bg-brand-coral/40',
    orange: 'bg-brand-orange/40',
    emerald: 'bg-emerald-400/40',
  }[pulseColor];

  const textClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-bold uppercase tracking-wider border backdrop-blur-sm ${bgClasses} ${textClasses}`}
    >
      <span className="relative flex h-2 w-2 items-center justify-center">
        {/* Animated expanding radar ring */}
        <span
          className={`absolute inline-flex h-full w-full rounded-full animate-radar-ping ${radarClasses}`}
        />
        {/* Center core dot */}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotClasses}`} />
      </span>
      <span>{label}</span>
    </span>
  );
};
