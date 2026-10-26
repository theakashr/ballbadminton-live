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
    coral: 'bg-[#D92D20]/10 text-[#D92D20] border-[#D92D20]/30',
    orange: 'bg-[#FFF1E5] text-[#FF851B] border-[#FF851B]/30',
    emerald: 'bg-[#16803D]/10 text-[#16803D] border-[#16803D]/30',
  }[pulseColor];

  const dotClasses = {
    coral: 'bg-[#D92D20]',
    orange: 'bg-[#FF851B]',
    emerald: 'bg-[#16803D]',
  }[pulseColor];

  const radarClasses = {
    coral: 'bg-[#D92D20]/40',
    orange: 'bg-[#FF851B]/40',
    emerald: 'bg-[#16803D]/40',
  }[pulseColor];

  const textClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border backdrop-blur-sm ${bgClasses} ${textClasses}`}
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
