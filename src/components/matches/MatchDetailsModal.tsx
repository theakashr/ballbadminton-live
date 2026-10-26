import React from 'react';
import { 
  X, 
  Users, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import type { Match } from '../../types';
import { Badge } from '../common/Badge';

interface MatchDetailsModalProps {
  match: Match | null;
  onClose: () => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  onClose,
}) => {
  if (!match) return null;

  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const isUpcoming = match.status === 'upcoming';

  const currentSetScore = match.setScores[match.currentSet - 1] || { team1Score: 0, team2Score: 0 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white border border-border-neutral rounded-2xl sm:rounded-3xl shadow-card-hover overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header Strip */}
        <div className="px-6 py-4 border-b border-border-neutral bg-surface-muted flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLive && <Badge variant="live" pulse size="sm">LIVE</Badge>}
            {isUpcoming && <Badge variant="upcoming" size="sm">SCHEDULED</Badge>}
            {isCompleted && <Badge variant="completed" size="sm">FINAL RESULT</Badge>}
            <span className="text-xs text-text-secondary font-medium truncate max-w-xs sm:max-w-md">
              {match.tournamentName} • {match.stage}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-border-neutral transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            aria-label="Close match details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match Center Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          
          {/* Main Score Board Header */}
          <div className="p-6 rounded-2xl bg-surface-muted border border-border-neutral">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              
              {/* Team 1 */}
              <div className="sm:col-span-5 flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-xl text-white shrink-0 border border-border-neutral shadow-sm"
                  style={{ backgroundColor: match.team1.logoBg || '#182230' }}
                >
                  {match.team1.shortName}
                </div>
                <div>
                  <h4 className="text-lg font-display font-bold text-text-primary">
                    {match.team1.name}
                  </h4>
                  <div className="text-xs text-text-secondary">
                    {match.team1.city}, {match.team1.state}
                  </div>
                  {isLive && match.servingTeamId === match.team1.id && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-brand-orange bg-brand-soft px-2 py-0.5 rounded border border-brand-orange/30">
                      Serving ({match.servingHand === 1 ? '1st Hand' : '2nd Hand'})
                    </span>
                  )}
                </div>
              </div>

              {/* Central Score Digits */}
              <div className="sm:col-span-2 flex flex-col items-center justify-center text-center">
                {isLive && (
                  <>
                    <div className="flex items-center gap-2 score-digits">
                      <span className="text-3xl font-score font-bold text-text-primary">
                        {currentSetScore.team1Score}
                      </span>
                      <span className="text-text-secondary text-lg">:</span>
                      <span className="text-3xl font-score font-bold text-text-primary">
                        {currentSetScore.team2Score}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider mt-1">
                      Set {match.currentSet}
                    </span>
                    <span className="text-[11px] text-text-secondary mt-0.5">
                      Sets: {match.team1SetsWon} - {match.team2SetsWon}
                    </span>
                  </>
                )}

                {isCompleted && (
                  <>
                    <div className="flex items-center gap-2 score-digits">
                      <span className={`text-3xl font-score font-bold ${
                        match.team1SetsWon > match.team2SetsWon ? 'text-brand-orange' : 'text-text-primary'
                      }`}>
                        {match.team1SetsWon}
                      </span>
                      <span className="text-text-secondary text-lg">:</span>
                      <span className={`text-3xl font-score font-bold ${
                        match.team2SetsWon > match.team1SetsWon ? 'text-brand-orange' : 'text-text-primary'
                      }`}>
                        {match.team2SetsWon}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mt-1">
                      Sets (Best of 3)
                    </span>
                  </>
                )}

                {isUpcoming && (
                  <div className="text-center">
                    <span className="text-xs uppercase tracking-widest text-brand-orange font-bold">
                      Starts
                    </span>
                    <div className="text-sm font-semibold text-text-primary mt-0.5">
                      {match.scheduledTime}
                    </div>
                  </div>
                )}
              </div>

              {/* Team 2 */}
              <div className="sm:col-span-5 flex items-center justify-end gap-4 text-right">
                <div>
                  <h4 className="text-lg font-display font-bold text-text-primary">
                    {match.team2.name}
                  </h4>
                  <div className="text-xs text-text-secondary">
                    {match.team2.city}, {match.team2.state}
                  </div>
                  {isLive && match.servingTeamId === match.team2.id && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-brand-orangeHover bg-brand-soft px-2 py-0.5 rounded border border-brand-orange/30">
                      Serving ({match.servingHand === 1 ? '1st Hand' : '2nd Hand'})
                    </span>
                  )}
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-xl text-white shrink-0 border border-border-neutral shadow-sm"
                  style={{ backgroundColor: match.team2.logoBg || '#475467' }}
                >
                  {match.team2.shortName}
                </div>
              </div>

            </div>
          </div>

          {/* Set-by-Set Score Sheet */}
          {match.setScores.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-orange" />
                <span>Official BBFI 29-Point Set Breakdown</span>
              </h5>

              <div className="overflow-x-auto rounded-xl border border-border-neutral bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted text-text-secondary uppercase tracking-wider text-[10px] border-b border-border-neutral">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Game #</th>
                      <th className="py-2.5 px-4 font-semibold">{match.team1.shortName} Score</th>
                      <th className="py-2.5 px-4 font-semibold">{match.team2.shortName} Score</th>
                      <th className="py-2.5 px-4 font-semibold">Set Winner</th>
                      <th className="py-2.5 px-4 font-semibold">Status / Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-neutral">
                    {match.setScores.map((set) => {
                      const isDecided = set.isCompleted;
                      const winnerName = set.winnerTeamId === match.team1.id ? match.team1.name : match.team2.name;
                      return (
                        <tr key={set.gameNumber} className="hover:bg-surface-muted/50">
                          <td className="py-3 px-4 font-medium text-text-primary">
                            Set {set.gameNumber}
                          </td>
                          <td className={`py-3 px-4 font-score font-bold text-sm ${
                            set.team1Score > set.team2Score ? 'text-brand-orange' : 'text-text-primary'
                          }`}>
                            {set.team1Score}
                          </td>
                          <td className={`py-3 px-4 font-score font-bold text-sm ${
                            set.team2Score > set.team1Score ? 'text-brand-orange' : 'text-text-primary'
                          }`}>
                            {set.team2Score}
                          </td>
                          <td className="py-3 px-4 text-text-primary">
                            {isDecided ? (
                              <span className="flex items-center gap-1.5 text-text-primary font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-brand-orange" />
                                <span>{winnerName}</span>
                              </span>
                            ) : (
                              <span className="text-brand-orange font-semibold">Current Set in Progress</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-text-secondary">
                            {set.durationMinutes ? `${set.durationMinutes} mins` : 'Live'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rosters / Lineups (If Available) */}
          {(match.team1.roster || match.team2.roster) && (
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-orange" />
                <span>Starting Fives &amp; Positions</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Team 1 Roster */}
                <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral">
                  <div className="font-semibold text-sm text-text-primary mb-2.5 flex items-center justify-between">
                    <span>{match.team1.name}</span>
                    <span className="text-xs text-brand-orange font-normal">Coach: {match.team1.coachName || 'Federation'}</span>
                  </div>
                  <div className="space-y-1.5">
                    {match.team1.roster?.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-border-neutral last:border-0">
                        <span className="text-text-primary">
                          #{p.number} {p.name} {p.isCaptain && '(C)'}
                        </span>
                        <span className="text-[11px] text-text-secondary bg-white px-2 py-0.5 rounded border border-border-neutral">{p.position}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team 2 Roster */}
                <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral">
                  <div className="font-semibold text-sm text-text-primary mb-2.5 flex items-center justify-between">
                    <span>{match.team2.name}</span>
                    <span className="text-xs text-brand-orangeHover font-normal">Coach: {match.team2.coachName || 'Federation'}</span>
                  </div>
                  <div className="space-y-1.5">
                    {match.team2.roster?.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-border-neutral last:border-0">
                        <span className="text-text-primary">
                          #{p.number} {p.name} {p.isCaptain && '(C)'}
                        </span>
                        <span className="text-[11px] text-text-secondary bg-white px-2 py-0.5 rounded border border-border-neutral">{p.position}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Venue & Official Notes */}
          <div className="p-4 rounded-xl bg-brand-soft border border-brand-orange/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-text-secondary block">Court Assignment:</span>
              <span className="text-text-primary font-medium">{match.court}</span>
            </div>
            <div>
              <span className="text-text-secondary block">Venue &amp; Location:</span>
              <span className="text-text-primary font-medium">{match.venue}, {match.city}</span>
            </div>
            <div>
              <span className="text-text-secondary block">Chief Official:</span>
              <span className="text-text-primary font-medium">{match.referee || 'Federation Panel'}</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border-neutral bg-surface-muted flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            Official 29-Point Game Rules • BBFI Certified
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-surface-muted text-text-primary border border-border-neutral transition-colors shadow-sm"
          >
            Close Match Center
          </button>
        </div>

      </div>
    </div>
  );
};
