import React from 'react';

export type StatusBadgeType = 
  | 'live' 
  | 'upcoming' 
  | 'completed' 
  | 'archived' 
  | 'open' 
  | 'closed' 
  | 'invite-only' 
  | 'super_admin' 
  | 'tournament_admin' 
  | 'official_scorer' 
  | 'viewer' 
  | 'active_scoring' 
  | 'assigned' 
  | 'available' 
  | 'offline'
  | 'public'
  | 'draft'
  | 'unlisted';

interface StatusBadgeProps {
  status: StatusBadgeType | string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md',
  pulse = false 
}) => {
  const norm = status.toLowerCase();

  let bg = 'bg-charcoal-800 text-muted-grey border-charcoal-700';
  let dotColor = 'bg-muted-grey';
  let label = status;

  switch (norm) {
    case 'live':
    case 'active_scoring':
      bg = 'bg-brand-coral/15 text-brand-coral border-brand-coral/30';
      dotColor = 'bg-brand-coral';
      label = norm === 'active_scoring' ? 'Scoring Live' : 'LIVE';
      break;
    case 'upcoming':
    case 'assigned':
      bg = 'bg-brand-orange/15 text-brand-orange border-brand-orange/30';
      dotColor = 'bg-brand-orange';
      label = norm === 'assigned' ? 'Assigned' : 'Upcoming';
      break;
    case 'completed':
    case 'closed':
      bg = 'bg-plum-800/60 text-soft-white border-plum-700/60';
      dotColor = 'bg-soft-white/60';
      label = norm === 'closed' ? 'Closed' : 'Completed';
      break;
    case 'open':
    case 'available':
      bg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      dotColor = 'bg-emerald-400';
      label = norm === 'open' ? 'Reg Open' : 'Available';
      break;
    case 'archived':
    case 'offline':
      bg = 'bg-charcoal-900 text-muted-grey/80 border-charcoal-800';
      dotColor = 'bg-muted-grey/50';
      label = norm === 'archived' ? 'Archived' : 'Offline';
      break;
    case 'super_admin':
      bg = 'bg-brand-yellow/15 text-brand-yellow border-brand-yellow/30';
      dotColor = 'bg-brand-yellow';
      label = 'Super Admin';
      break;
    case 'tournament_admin':
      bg = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      dotColor = 'bg-purple-400';
      label = 'Tourn Admin';
      break;
    case 'official_scorer':
      bg = 'bg-brand-orange/20 text-brand-orange border-brand-orange/30';
      dotColor = 'bg-brand-orange';
      label = 'Official Scorer';
      break;
    case 'viewer':
      bg = 'bg-charcoal-800 text-muted-grey border-charcoal-700';
      dotColor = 'bg-muted-grey';
      label = 'Viewer';
      break;
    case 'invite-only':
      bg = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      dotColor = 'bg-amber-400';
      label = 'Invite Only';
      break;
    case 'public':
      bg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      dotColor = 'bg-emerald-400';
      label = 'Public';
      break;
    case 'draft':
      bg = 'bg-charcoal-800/80 text-muted-grey border-charcoal-700';
      dotColor = 'bg-muted-grey';
      label = 'Draft';
      break;
    case 'unlisted':
      bg = 'bg-plum-900/60 text-purple-300 border-plum-800';
      dotColor = 'bg-purple-400';
      label = 'Unlisted';
      break;
    default:
      break;
  }

  const isLive = norm === 'live' || norm === 'active_scoring' || pulse;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border tracking-wide uppercase ${bg} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
          isLive ? 'animate-pulse' : ''
        }`}
      />
      <span>{label}</span>
    </span>
  );
};
