import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Table, 
  GitFork, 
  Crown, 
  Medal 
} from 'lucide-react';
import { standingsService } from '../../services/standingsService';
import type { TeamStandings, Match } from '../../types';

interface TournamentStandingsAndBracketsProps {
  tournamentId: string;
  tournamentName: string;
}

export const TournamentStandingsAndBrackets: React.FC<TournamentStandingsAndBracketsProps> = ({
  tournamentId,
  tournamentName,
}) => {
  const [activeTab, setActiveTab] = useState<'standings' | 'knockout'>('standings');
  const [activeGroup, setActiveGroup] = useState<string>('all');
  
  const [standingsData, setStandingsData] = useState<{
    overall: TeamStandings[];
    groups: Record<string, TeamStandings[]>;
  }>({ overall: [], groups: {} });

  const [knockoutData, setKnockoutData] = useState<{
    quarterFinals: Match[];
    semiFinals: Match[];
    final?: Match;
    champion?: any;
  }>({ quarterFinals: [], semiFinals: [] });

  useEffect(() => {
    const standings = standingsService.calculateStandings(tournamentId);
    setStandingsData(standings);

    const tree = standingsService.generateKnockoutTree(tournamentId);
    setKnockoutData(tree);
  }, [tournamentId]);

  const groupKeys = Object.keys(standingsData.groups);
  const displayedStandings = activeGroup === 'all' 
    ? standingsData.overall 
    : (standingsData.groups[activeGroup] || []);

  return (
    <div className="bg-white border border-border-neutral rounded-2xl p-6 shadow-card text-text-primary space-y-6">
      
      {/* Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-neutral">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-orange"></span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand-orange font-bold">
              Official BBFI Standings &amp; Brackets
            </span>
          </div>
          <h3 className="text-xl font-display font-bold text-text-primary">
            {tournamentName}
          </h3>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-surface-muted border border-border-neutral">
          <button
            type="button"
            onClick={() => setActiveTab('standings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'standings'
                ? 'bg-white text-brand-orange shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Points Table</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('knockout')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'knockout'
                ? 'bg-white text-brand-orange shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Knockout Bracket</span>
          </button>
        </div>
      </div>

      {/* TAB 1: POINTS TABLE */}
      {activeTab === 'standings' && (
        <div className="space-y-4">
          {/* Group Filter Pills */}
          {groupKeys.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveGroup('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  activeGroup === 'all'
                    ? 'bg-brand-orange text-white font-bold'
                    : 'bg-surface-muted text-text-secondary hover:text-text-primary'
                }`}
              >
                Overall Standings
              </button>
              {groupKeys.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setActiveGroup(g)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    activeGroup === g
                      ? 'bg-brand-orange text-white font-bold'
                      : 'bg-surface-muted text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Mobile Standings Cards (Phones) */}
          <div className="sm:hidden space-y-2.5">
            {displayedStandings.length === 0 ? (
              <div className="py-8 text-center text-text-secondary text-xs rounded-xl bg-surface-muted border border-border-neutral">
                No teams or match records in this tournament yet.
              </div>
            ) : (
              displayedStandings.map((row, idx) => (
                <div key={row.teamId} className="p-3.5 rounded-2xl bg-white border border-border-neutral shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      idx === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      idx === 1 ? 'bg-slate-100 text-slate-800 border border-slate-300' :
                      idx === 2 ? 'bg-orange-100 text-orange-900 border border-orange-300' :
                      'bg-surface-muted text-text-secondary border border-border-neutral'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-display font-bold text-sm text-text-primary block truncate">
                        {row.teamName}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-text-secondary mt-0.5">
                        <span>P: {row.played}</span>
                        <span>•</span>
                        <span className="text-status-success font-bold">W: {row.won}</span>
                        <span>•</span>
                        <span className="text-status-error font-medium">L: {row.lost}</span>
                        <span>•</span>
                        <span>Sets: {row.setDifference >= 0 ? `+${row.setDifference}` : row.setDifference}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <span className="font-score font-black text-lg text-brand-orange block">
                      {row.points}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-text-secondary">
                      PTS
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Standings Table */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-border-neutral bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted border-b border-border-neutral text-text-secondary uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">Pos</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-3 text-center">P</th>
                  <th className="py-3 px-3 text-center">W</th>
                  <th className="py-3 px-3 text-center">L</th>
                  <th className="py-3 px-3 text-center">Sets (+/-)</th>
                  <th className="py-3 px-3 text-center">Points (+/-)</th>
                  <th className="py-3 px-4 text-center font-bold text-text-primary">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-neutral">
                {displayedStandings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-text-secondary">
                      No teams or match records in this tournament yet.
                    </td>
                  </tr>
                ) : (
                  displayedStandings.map((row, idx) => (
                    <tr key={row.teamId} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {idx === 0 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-black inline-flex items-center justify-center text-xs shadow-sm">
                            1
                          </span>
                        ) : idx === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold inline-flex items-center justify-center text-xs">
                            2
                          </span>
                        ) : idx === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 font-bold inline-flex items-center justify-center text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-text-secondary">{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-text-primary">{row.teamName}</div>
                        <div className="text-[10px] text-text-secondary">{row.shortName} • {row.groupName || 'Pool'}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{row.played}</td>
                      <td className="py-3 px-3 text-center font-mono text-status-success font-bold">{row.won}</td>
                      <td className="py-3 px-3 text-center font-mono text-status-error">{row.lost}</td>
                      <td className="py-3 px-3 text-center font-mono">
                        {row.setsWon}-{row.setsLost} ({row.setDifference >= 0 ? `+${row.setDifference}` : row.setDifference})
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-text-secondary">
                        {row.pointsFor}-{row.pointsAgainst} ({row.pointDifference >= 0 ? `+${row.pointDifference}` : row.pointDifference})
                      </td>
                      <td className="py-3 px-4 text-center font-score font-black text-sm text-brand-orange">
                        {row.points}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-text-secondary">
            * BBFI Official Scoring Rule: Win = 2 Points, Loss = 0 Points. Tie-breaks: Points &gt; Set Difference &gt; Point Difference &gt; Points For.
          </p>
        </div>
      )}

      {/* TAB 2: KNOCKOUT BRACKET */}
      {activeTab === 'knockout' && (
        <div className="space-y-6">
          {/* Champion Banner if completed */}
          {knockoutData.champion && (
            <div className="p-4 rounded-2xl bg-brand-soft border border-brand-orange/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-brand-orange" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange block">
                    Tournament Champion
                  </span>
                  <span className="text-lg font-display font-extrabold text-text-primary">
                    {knockoutData.champion.name} ({knockoutData.champion.state})
                  </span>
                </div>
              </div>
              <Medal className="w-8 h-8 text-brand-orange" />
            </div>
          )}

          {/* Bracket Rail / Grid */}
          <div className="flex md:grid md:grid-cols-3 overflow-x-auto snap-x snap-mandatory gap-4 pb-3 sm:pb-0 no-scrollbar card-rail">
            
            {/* Round 1: Quarter Finals */}
            <div className="space-y-3 min-w-[260px] sm:min-w-0 flex-shrink-0 sm:flex-shrink snap-center">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-orange pb-2 border-b border-border-neutral flex items-center justify-between">
                <span>Quarter-Finals</span>
                <span className="text-[10px] text-text-secondary">4 Fixtures</span>
              </div>

              {knockoutData.quarterFinals.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral text-xs text-text-secondary text-center">
                  Fixtures being scheduled
                </div>
              ) : (
                knockoutData.quarterFinals.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral hover:border-brand-orange/60 hover:shadow-card-hover transition-all duration-200 cursor-pointer space-y-2 text-xs group">
                    <div className="flex justify-between text-[10px] text-text-secondary">
                      <span>{m.court}</span>
                      <span className="font-semibold text-text-primary">{m.status.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-text-primary group-hover:text-brand-orange transition-colors">
                      <span>{m.team1.shortName}</span>
                      <span className="font-mono text-brand-orange font-bold">{m.team1SetsWon}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-text-primary group-hover:text-brand-orangeHover transition-colors">
                      <span>{m.team2.shortName}</span>
                      <span className="font-mono text-brand-orangeHover font-bold">{m.team2SetsWon}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Round 2: Semi Finals */}
            <div className="space-y-3 min-w-[260px] sm:min-w-0 flex-shrink-0 sm:flex-shrink snap-center">
              <div className="text-xs font-bold uppercase tracking-wider text-status-warning pb-2 border-b border-border-neutral flex items-center justify-between">
                <span>Semi-Finals</span>
                <span className="text-[10px] text-text-secondary">2 Fixtures</span>
              </div>

              {knockoutData.semiFinals.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral text-xs text-text-secondary text-center">
                  Awaiting QF winners
                </div>
              ) : (
                knockoutData.semiFinals.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral hover:border-brand-orange/60 hover:shadow-card-hover transition-all duration-200 cursor-pointer space-y-2 text-xs group">
                    <div className="flex justify-between text-[10px] text-text-secondary">
                      <span>{m.stage}</span>
                      <span className="font-semibold text-text-primary">{m.status.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-text-primary group-hover:text-brand-orange transition-colors">
                      <span>{m.team1.name}</span>
                      <span className="font-mono text-brand-orange font-bold">{m.team1SetsWon}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-text-primary group-hover:text-brand-orangeHover transition-colors">
                      <span>{m.team2.name}</span>
                      <span className="font-mono text-brand-orangeHover font-bold">{m.team2SetsWon}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Round 3: Championship Final */}
            <div className="space-y-3 min-w-[260px] sm:min-w-0 flex-shrink-0 sm:flex-shrink snap-center">
              <div className="text-xs font-bold uppercase tracking-wider text-status-success pb-2 border-b border-border-neutral flex items-center justify-between">
                <span>Grand Final</span>
                <Trophy className="w-3.5 h-3.5 text-brand-orange" />
              </div>

              {knockoutData.final ? (
                <div className="p-4 rounded-xl bg-brand-soft border-2 border-brand-orange shadow-card hover:scale-[1.01] transition-transform duration-200 space-y-2.5 text-xs">
                  <div className="flex justify-between text-[10px] text-brand-orange font-bold">
                    <span>BBFI Trophy Match</span>
                    <span>{knockoutData.final.status.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-text-primary text-sm">
                    <span className="text-brand-orange">{knockoutData.final.team1.name}</span>
                    <span className="font-score text-lg text-brand-orange">{knockoutData.final.team1SetsWon}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-text-primary text-sm">
                    <span className="text-text-primary">{knockoutData.final.team2.name}</span>
                    <span className="font-score text-lg text-text-primary">{knockoutData.final.team2SetsWon}</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-surface-muted border border-border-neutral text-xs text-text-secondary text-center">
                  Championship Final to be scheduled following Semi-Final matches.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
