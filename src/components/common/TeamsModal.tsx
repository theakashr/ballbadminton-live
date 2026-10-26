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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-charcoal-950/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-charcoal-900 border border-plum-800 rounded-2xl sm:rounded-3xl shadow-elevated overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-plum-800/80 bg-plum-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-plum-800 flex items-center justify-center text-brand-orange">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-soft-white">
                Ball Badminton Teams Directory
              </h3>
              <p className="text-xs text-muted-grey">
                Active State Associations &amp; Collegiate Fives Squads
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-grey hover:text-soft-white hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          <div className="p-3 rounded-xl bg-plum-950/60 border border-plum-800/60 text-xs text-muted-grey flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-orange shrink-0" />
            <span>
              All squads are registered under standard BBFI regulations (5 on-court players + 3 reserves).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teams.map((team) => (
              <div 
                key={team.id}
                className="p-4 rounded-xl bg-charcoal-950/80 border border-charcoal-800 hover:border-plum-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-soft-white border border-plum-700/80"
                    style={{ backgroundColor: team.logoBg }}
                  >
                    {team.shortName}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-soft-white">
                      {team.name}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-muted-grey">
                      <MapPin className="w-3 h-3 text-brand-orange" />
                      <span>{team.city}, {team.state}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-grey pt-2 border-t border-charcoal-800/80 flex items-center justify-between">
                  <span>Captain: <strong className="text-soft-white">{team.captainName}</strong></span>
                  <span className="text-brand-orange text-[10px] font-semibold bg-brand-orange/15 px-2 py-0.5 rounded">
                    5s Active Roster
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-plum-800/80 bg-charcoal-950/60 flex items-center justify-between">
          <span className="text-xs text-muted-grey">
            Phase 1 Team Directory Preview
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-plum-850 hover:bg-plum-800 text-soft-white border border-plum-700 transition-colors"
          >
            Close Directory
          </button>
        </div>

      </div>
    </div>
  );
};
