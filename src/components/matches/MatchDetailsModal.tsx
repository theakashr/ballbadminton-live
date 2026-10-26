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
        className="fixed inset-0 bg-charcoal-950/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-plum-800 rounded-2xl sm:rounded-3xl shadow-2xl dark:shadow-elevated overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header Strip */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-plum-800/80 bg-slate-50 dark:bg-plum-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLive && <Badge variant="live" pulse size="sm">LIVE</Badge>}
            {isUpcoming && <Badge variant="upcoming" size="sm">SCHEDULED</Badge>}
            {isCompleted && <Badge variant="completed" size="sm">FINAL RESULT</Badge>}
            <span className="text-xs text-slate-500 dark:text-muted-grey font-medium truncate max-w-xs sm:max-w-md">
              {match.tournamentName} • {match.stage}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-muted-grey hover:text-slate-900 dark:hover:text-soft-white hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            aria-label="Close match details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match Center Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          
          {/* Main Score Board Header */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-plum-950 dark:via-charcoal-950 dark:to-plum-950 border border-slate-200 dark:border-plum-800/80">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              
              {/* Team 1 */}
              <div className="sm:col-span-5 flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-xl text-white shrink-0 border border-slate-300 dark:border-plum-700 shadow-sm"
                  style={{ backgroundColor: match.team1.logoBg }}
                >
                  {match.team1.shortName}
                </div>
                <div>
                  <h4 className="text-lg font-display font-bold text-slate-900 dark:text-soft-white">
                    {match.team1.name}
                  </h4>
                  <div className="text-xs text-slate-500 dark:text-muted-grey">
                    {match.team1.city}, {match.team1.state}
                  </div>
                  {isLive && match.servingTeamId === match.team1.id && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-brand-orange bg-brand-orange/15 px-2 py-0.5 rounded border border-brand-orange/30">
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
                      <span className="text-3xl font-score font-bold text-slate-900 dark:text-soft-white">
                        {currentSetScore.team1Score}
                      </span>
                      <span className="text-slate-400 dark:text-muted-grey text-lg">:</span>
                      <span className="text-3xl font-score font-bold text-slate-900 dark:text-soft-white">
                        {currentSetScore.team2Score}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider mt-1">
                      Set {match.currentSet}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-muted-grey mt-0.5">
                      Sets: {match.team1SetsWon} - {match.team2SetsWon}
                    </span>
                  </>
                )}

                {isCompleted && (
                  <>
                    <div className="flex items-center gap-2 score-digits">
                      <span className={`text-3xl font-score font-bold ${
                        match.team1SetsWon > match.team2SetsWon ? 'text-brand-orange' : 'text-slate-900 dark:text-soft-white'
                      }`}>
                        {match.team1SetsWon}
                      </span>
                      <span className="text-slate-400 dark:text-muted-grey text-lg">:</span>
                      <span className={`text-3xl font-score font-bold ${
                        match.team2SetsWon > match.team1SetsWon ? 'text-brand-orange' : 'text-slate-900 dark:text-soft-white'
                      }`}>
                        {match.team2SetsWon}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-muted-grey uppercase tracking-wider mt-1">
                      Sets (Best of 3)
                    </span>
                  </>
                )}

                {isUpcoming && (
                  <div className="text-center">
                    <span className="text-xs uppercase tracking-widest text-brand-orange font-bold">
                      Starts
                    </span>
                    <div className="text-sm font-semibold text-slate-900 dark:text-soft-white mt-0.5">
                      {match.scheduledTime}
                    </div>
                  </div>
                )}
              </div>

              {/* Team 2 */}
              <div className="sm:col-span-5 flex items-center justify-end gap-4 text-right">
                <div>
                  <h4 className="text-lg font-display font-bold text-slate-900 dark:text-soft-white">
                    {match.team2.name}
                  </h4>
                  <div className="text-xs text-slate-500 dark:text-muted-grey">
                    {match.team2.city}, {match.team2.state}
                  </div>
                  {isLive && match.servingTeamId === match.team2.id && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-brand-coral bg-brand-coral/15 px-2 py-0.5 rounded border border-brand-coral/30">
                      Serving ({match.servingHand === 1 ? '1st Hand' : '2nd Hand'})
                    </span>
                  )}
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-xl text-white shrink-0 border border-slate-300 dark:border-plum-700 shadow-sm"
                  style={{ backgroundColor: match.team2.logoBg }}
                >
                  {match.team2.shortName}
                </div>
              </div>

            </div>
          </div>

          {/* Set-by-Set Score Sheet */}
          {match.setScores.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-muted-grey mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-orange" />
                <span>Official BBFI 29-Point Set Breakdown</span>
              </h5>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-charcoal-800 bg-slate-50/50 dark:bg-charcoal-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-charcoal-900/80 text-slate-600 dark:text-muted-grey uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-charcoal-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Game #</th>
                      <th className="py-2.5 px-4 font-semibold">{match.team1.shortName} Score</th>
                      <th className="py-2.5 px-4 font-semibold">{match.team2.shortName} Score</th>
                      <th className="py-2.5 px-4 font-semibold">Set Winner</th>
                      <th className="py-2.5 px-4 font-semibold">Status / Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-charcoal-800/60">
                    {match.setScores.map((set) => {
                      const isDecided = set.isCompleted;
                      const winnerName = set.winnerTeamId === match.team1.id ? match.team1.name : match.team2.name;
                      return (
                        <tr key={set.gameNumber} className="hover:bg-slate-100/60 dark:hover:bg-plum-950/40">
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-soft-white">
                            Set {set.gameNumber}
                          </td>
                          <td className={`py-3 px-4 font-score font-bold text-sm ${
                            set.team1Score > set.team2Score ? 'text-brand-orange' : 'text-slate-900 dark:text-soft-white'
                          }`}>
                            {set.team1Score}
                          </td>
                          <td className={`py-3 px-4 font-score font-bold text-sm ${
                            set.team2Score > set.team1Score ? 'text-brand-orange' : 'text-slate-900 dark:text-soft-white'
                          }`}>
                            {set.team2Score}
                          </td>
                          <td className="py-3 px-4 text-slate-900 dark:text-soft-white">
                            {isDecided ? (
                              <span className="flex items-center gap-1.5 text-slate-900 dark:text-soft-white font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-brand-orange" />
                                <span>{winnerName}</span>
                              </span>
                            ) : (
                              <span className="text-brand-orange font-semibold">Current Set in Progress</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-muted-grey">
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
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-muted-grey mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-orange" />
                <span>Starting Fives &amp; Positions</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Team 1 Roster */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-charcoal-950/70 border border-slate-200 dark:border-charcoal-800">
                  <div className="font-semibold text-sm text-slate-900 dark:text-soft-white mb-2.5 flex items-center justify-between">
                    <span>{match.team1.name}</span>
                    <span className="text-xs text-brand-orange font-normal">Coach: {match.team1.coachName || 'Federation'}</span>
                  </div>
                  <div className="space-y-1.5">
                    {match.team1.roster?.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-200 dark:border-charcoal-900 last:border-0">
                        <span className="text-slate-800 dark:text-soft-white">
                          #{p.number} {p.name} {p.isCaptain && '(C)'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-muted-grey">{p.position}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team 2 Roster */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-charcoal-950/70 border border-slate-200 dark:border-charcoal-800">
                  <div className="font-semibold text-sm text-slate-900 dark:text-soft-white mb-2.5 flex items-center justify-between">
                    <span>{match.team2.name}</span>
                    <span className="text-xs text-brand-coral font-normal">Coach: {match.team2.coachName || 'Federation'}</span>
                  </div>
                  <div className="space-y-1.5">
                    {match.team2.roster?.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-200 dark:border-charcoal-900 last:border-0">
                        <span className="text-slate-800 dark:text-soft-white">
                          #{p.number} {p.name} {p.isCaptain && '(C)'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-muted-grey">{p.position}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Venue & Official Notes */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-plum-950/60 border border-slate-200 dark:border-plum-800/70 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-muted-grey block">Court Assignment:</span>
              <span className="text-slate-900 dark:text-soft-white font-medium">{match.court}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-muted-grey block">Venue &amp; Location:</span>
              <span className="text-slate-900 dark:text-soft-white font-medium">{match.venue}, {match.city}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-muted-grey block">Chief Official:</span>
              <span className="text-slate-900 dark:text-soft-white font-medium">{match.referee || 'Federation Panel'}</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-plum-800/80 bg-slate-50 dark:bg-charcoal-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-muted-grey">
            Official 29-Point Game Rules • BBFI Certified
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-plum-850 dark:hover:bg-plum-800 text-slate-900 dark:text-soft-white border border-slate-300 dark:border-plum-700 transition-colors"
          >
            Close Match Center
          </button>
        </div>

      </div>
    </div>
  );
};
