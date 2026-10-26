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
    <div className="bg-charcoal-900 border border-plum-800 rounded-3xl p-6 shadow-elevated text-soft-white space-y-6">
      
      {/* Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-plum-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-orange"></span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand-orange font-bold">
              Official BBFI Standings &amp; Brackets
            </span>
          </div>
          <h3 className="text-xl font-display font-bold text-soft-white">
            {tournamentName}
          </h3>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-charcoal-950 border border-charcoal-800">
          <button
            type="button"
            onClick={() => setActiveTab('standings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'standings'
                ? 'bg-plum-800 text-brand-orange shadow'
                : 'text-muted-grey hover:text-soft-white'
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
                ? 'bg-plum-800 text-brand-orange shadow'
                : 'text-muted-grey hover:text-soft-white'
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
                    ? 'bg-brand-orange text-charcoal-950 font-bold'
                    : 'bg-charcoal-950 text-muted-grey hover:text-soft-white'
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
                      ? 'bg-brand-orange text-charcoal-950 font-bold'
                      : 'bg-charcoal-950 text-muted-grey hover:text-soft-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Standings Table */}
          <div className="overflow-x-auto rounded-2xl border border-charcoal-800 bg-charcoal-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-plum-950/70 border-b border-plum-900 text-muted-grey uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">Pos</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-3 text-center">P</th>
                  <th className="py-3 px-3 text-center">W</th>
                  <th className="py-3 px-3 text-center">L</th>
                  <th className="py-3 px-3 text-center">Sets (+/-)</th>
                  <th className="py-3 px-3 text-center">Points (+/-)</th>
                  <th className="py-3 px-4 text-center font-bold text-soft-white">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {displayedStandings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-grey">
                      No teams or match records in this tournament yet.
                    </td>
                  </tr>
                ) : (
                  displayedStandings.map((row, idx) => (
                    <tr key={row.teamId} className="hover:bg-plum-950/40 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {idx === 0 ? (
                          <span className="w-6 h-6 rounded-full bg-brand-yellow/20 text-brand-yellow font-black inline-flex items-center justify-center text-xs shadow-sm">
                            1
                          </span>
                        ) : idx === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 font-bold inline-flex items-center justify-center text-xs">
                            2
                          </span>
                        ) : idx === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-700/25 text-amber-500 font-bold inline-flex items-center justify-center text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-muted-grey">{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-soft-white">{row.teamName}</div>
                        <div className="text-[10px] text-muted-grey">{row.shortName} • {row.groupName || 'Pool'}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{row.played}</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-400 font-bold">{row.won}</td>
                      <td className="py-3 px-3 text-center font-mono text-brand-coral">{row.lost}</td>
                      <td className="py-3 px-3 text-center font-mono">
                        {row.setsWon}-{row.setsLost} ({row.setDifference >= 0 ? `+${row.setDifference}` : row.setDifference})
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-muted-grey">
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

          <p className="text-[11px] text-muted-grey">
            * BBFI Official Scoring Rule: Win = 2 Points, Loss = 0 Points. Tie-breaks: Points &gt; Set Difference &gt; Point Difference &gt; Points For.
          </p>
        </div>
      )}

      {/* TAB 2: KNOCKOUT BRACKET */}
      {activeTab === 'knockout' && (
        <div className="space-y-6">
          {/* Champion Banner if completed */}
          {knockoutData.champion && (
            <div className="p-4 rounded-2xl bg-brand-orange/20 border border-brand-orange/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-brand-yellow" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange block">
                    Tournament Champion
                  </span>
                  <span className="text-lg font-display font-extrabold text-soft-white">
                    {knockoutData.champion.name} ({knockoutData.champion.state})
                  </span>
                </div>
              </div>
              <Medal className="w-8 h-8 text-brand-orange" />
            </div>
          )}

          {/* Bracket Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Round 1: Quarter Finals */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-orange pb-2 border-b border-charcoal-800 flex items-center justify-between">
                <span>Quarter-Finals</span>
                <span className="text-[10px] text-muted-grey">4 Fixtures</span>
              </div>

              {knockoutData.quarterFinals.length === 0 ? (
                <div className="p-4 rounded-xl bg-charcoal-950 border border-charcoal-800 text-xs text-muted-grey text-center">
                  Fixtures being scheduled
                </div>
              ) : (
                knockoutData.quarterFinals.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-2xl bg-charcoal-950 border border-charcoal-800 hover:border-brand-orange/60 hover:shadow-orange-glow transition-all duration-200 cursor-pointer space-y-2 text-xs group">
                    <div className="flex justify-between text-[10px] text-muted-grey">
                      <span>{m.court}</span>
                      <span className="font-semibold text-soft-white">{m.status.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-soft-white group-hover:text-brand-orange transition-colors">
                      <span>{m.team1.shortName}</span>
                      <span className="font-mono text-brand-orange font-bold">{m.team1SetsWon}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-soft-white group-hover:text-brand-coral transition-colors">
                      <span>{m.team2.shortName}</span>
                      <span className="font-mono text-brand-coral font-bold">{m.team2SetsWon}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Round 2: Semi Finals */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-yellow pb-2 border-b border-charcoal-800 flex items-center justify-between">
                <span>Semi-Finals</span>
                <span className="text-[10px] text-muted-grey">2 Fixtures</span>
              </div>

              {knockoutData.semiFinals.length === 0 ? (
                <div className="p-4 rounded-xl bg-charcoal-950 border border-charcoal-800 text-xs text-muted-grey text-center">
                  Awaiting QF winners
                </div>
              ) : (
                knockoutData.semiFinals.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-2xl bg-charcoal-950 border border-plum-800 hover:border-brand-yellow/60 hover:shadow-orange-glow transition-all duration-200 cursor-pointer space-y-2 text-xs group">
                    <div className="flex justify-between text-[10px] text-muted-grey">
                      <span>{m.stage}</span>
                      <span className="font-semibold text-soft-white">{m.status.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-soft-white group-hover:text-brand-orange transition-colors">
                      <span>{m.team1.name}</span>
                      <span className="font-mono text-brand-orange font-bold">{m.team1SetsWon}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-soft-white group-hover:text-brand-coral transition-colors">
                      <span>{m.team2.name}</span>
                      <span className="font-mono text-brand-coral font-bold">{m.team2SetsWon}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Round 3: Championship Final */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 pb-2 border-b border-charcoal-800 flex items-center justify-between">
                <span>Grand Final</span>
                <Trophy className="w-3.5 h-3.5 text-brand-orange" />
              </div>

              {knockoutData.final ? (
                <div className="p-4 rounded-2xl bg-plum-950 border-2 border-brand-orange shadow-orange-glow hover:scale-[1.02] transition-transform duration-200 space-y-2.5 text-xs">
                  <div className="flex justify-between text-[10px] text-brand-yellow font-bold">
                    <span>BBFI Trophy Match</span>
                    <span>{knockoutData.final.status.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-soft-white text-sm">
                    <span className="text-brand-orange">{knockoutData.final.team1.name}</span>
                    <span className="font-score text-lg text-brand-orange">{knockoutData.final.team1SetsWon}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-soft-white text-sm">
                    <span className="text-brand-coral">{knockoutData.final.team2.name}</span>
                    <span className="font-score text-lg text-brand-coral">{knockoutData.final.team2SetsWon}</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-charcoal-950 border border-charcoal-800 text-xs text-muted-grey text-center">
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
