import React from 'react';
import { X, Users, MapPin, Shield } from 'lucide-react';
import { LIVE_MATCHES, RECENT_RESULTS } from '../../data/mockData';

interface TeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamsModal: React.FC<TeamsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Extract unique teams from mock data
  const teamsMap = new Map();
  [...LIVE_MATCHES, ...RECENT_RESULTS].forEach((m) => {
    teamsMap.set(m.team1.id, m.team1);
    teamsMap.set(m.team2.id, m.team2);
  });
  const teams = Array.from(teamsMap.values());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto pt-safe pb-safe">
      <div 
        className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl min-h-screen sm:min-h-0 bg-white border-0 sm:border border-border-neutral rounded-none sm:rounded-3xl shadow-card-hover overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-0 sm:my-8 flex flex-col">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border-neutral bg-surface-muted flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-display font-bold text-text-primary">
                Ball Badminton Teams Directory
              </h3>
              <p className="text-xs text-text-secondary">
                Active State Associations &amp; Collegiate Squads
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-border-neutral transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          <div className="p-3 rounded-xl bg-brand-soft border border-brand-orange/30 text-xs text-text-secondary flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-orange shrink-0" />
            <span>
              All squads are registered under standard BBFI regulations (5 on-court players + 3 reserves).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teams.map((team) => (
              <div 
                key={team.id}
                className="p-4 rounded-xl bg-surface-muted border border-border-neutral hover:border-brand-orange/60 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white border border-border-neutral"
                    style={{ backgroundColor: team.logoBg || '#182230' }}
                  >
                    {team.shortName}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      {team.name}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-text-secondary">
                      <MapPin className="w-3 h-3 text-brand-orange" />
                      <span>{team.city}, {team.state}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-text-secondary pt-2 border-t border-border-neutral flex items-center justify-between">
                  <span>Captain: <strong className="text-text-primary">{team.captainName}</strong></span>
                  <span className="text-brand-orange text-[10px] font-semibold bg-brand-soft px-2 py-0.5 rounded border border-brand-orange/20">
                    5s Active Roster
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-neutral bg-surface-muted flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            Phase 1 Team Directory Preview
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-surface-muted text-text-primary border border-border-neutral transition-colors shadow-sm"
          >
            Close Directory
          </button>
        </div>

      </div>
    </div>
  );
};
