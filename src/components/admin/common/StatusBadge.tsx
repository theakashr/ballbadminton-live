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

  let bg = 'bg-surface-muted text-text-secondary border-border-neutral';
  let dotColor = 'bg-text-secondary/60';
  let label = status;

  switch (norm) {
    case 'live':
    case 'active_scoring':
      bg = 'bg-red-50 text-status-live border-red-200';
      dotColor = 'bg-status-live';
      label = norm === 'active_scoring' ? 'Scoring Live' : 'LIVE';
      break;
    case 'upcoming':
    case 'assigned':
      bg = 'bg-brand-soft text-brand-orange border-brand-orange/20';
      dotColor = 'bg-brand-orange';
      label = norm === 'assigned' ? 'Assigned' : 'Upcoming';
      break;
    case 'completed':
    case 'closed':
      bg = 'bg-slate-100 text-slate-700 border-slate-200';
      dotColor = 'bg-slate-500';
      label = norm === 'closed' ? 'Closed' : 'Completed';
      break;
    case 'open':
    case 'available':
      bg = 'bg-emerald-50 text-status-success border-emerald-200';
      dotColor = 'bg-status-success';
      label = norm === 'open' ? 'Reg Open' : 'Available';
      break;
    case 'archived':
    case 'offline':
      bg = 'bg-surface-muted text-text-secondary border-border-neutral';
      dotColor = 'bg-text-secondary/40';
      label = norm === 'archived' ? 'Archived' : 'Offline';
      break;
    case 'super_admin':
      bg = 'bg-amber-50 text-amber-800 border-amber-200';
      dotColor = 'bg-amber-600';
      label = 'Super Admin';
      break;
    case 'tournament_admin':
      bg = 'bg-purple-50 text-purple-700 border-purple-200';
      dotColor = 'bg-purple-600';
      label = 'Tourn Admin';
      break;
    case 'official_scorer':
      bg = 'bg-brand-soft text-brand-orange border-brand-orange/30';
      dotColor = 'bg-brand-orange';
      label = 'Official Scorer';
      break;
    case 'viewer':
      bg = 'bg-surface-muted text-text-secondary border-border-neutral';
      dotColor = 'bg-text-secondary/60';
      label = 'Viewer';
      break;
    case 'invite-only':
      bg = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      label = 'Invite Only';
      break;
    case 'public':
      bg = 'bg-emerald-50 text-status-success border-emerald-200';
      dotColor = 'bg-status-success';
      label = 'Public';
      break;
    case 'draft':
      bg = 'bg-surface-muted text-text-secondary border-border-neutral';
      dotColor = 'bg-text-secondary/60';
      label = 'Draft';
      break;
    case 'unlisted':
      bg = 'bg-purple-50 text-purple-700 border-purple-200';
      dotColor = 'bg-purple-500';
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
