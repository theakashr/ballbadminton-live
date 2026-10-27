import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Table, 
  GitFork, 
  Crown, 
  Medal,
  ChevronRight,
  Flame,
  LayoutGrid,
  Columns3
} from 'lucide-react';
import { standingsService } from '../../services/standingsService';
import { nativeHaptics } from '../../lib/nativeBridge';
import type { TeamStandings, Match } from '../../types';

interface TournamentStandingsAndBracketsProps {
  tournamentId: string;
  tournamentName: string;
  initialTab?: 'standings' | 'knockout';
}

export const TournamentStandingsAndBrackets: React.FC<TournamentStandingsAndBracketsProps> = ({
  tournamentId,
  tournamentName,
  initialTab = 'standings',
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'standings' | 'knockout'>(initialTab);
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [mobileKnockoutStage, setMobileKnockoutStage] = useState<'qf' | 'sf' | 'final'>('qf');
  const [mobileViewStyle, setMobileViewStyle] = useState<'stage' | 'tree'>('stage');
  
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
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const standings = standingsService.calculateStandings(tournamentId);
    setStandingsData(standings);

    const tree = standingsService.generateKnockoutTree(tournamentId);
    setKnockoutData(tree);

    // Auto-select the most active stage for mobile
    if (tree.final && (tree.final.status === 'live' || tree.final.status === 'completed')) {
      setMobileKnockoutStage('final');
    } else if (tree.semiFinals.some(m => m.status === 'live' || m.status === 'completed')) {
      setMobileKnockoutStage('sf');
    } else {
      setMobileKnockoutStage('qf');
    }
  }, [tournamentId]);

  const groupKeys = Object.keys(standingsData.groups);
  const displayedStandings = activeGroup === 'all' 
    ? standingsData.overall 
    : (standingsData.groups[activeGroup] || []);

  const handleMatchClick = (matchId: string) => {
    nativeHaptics.selection();
    navigate(`/matches/${matchId}`);
  };

  // Render a single high-quality mobile-friendly match bracket card
  const renderBracketMatchCard = (m: Match, isFinal: boolean = false) => {
    const isTeam1Winner = m.status === 'completed' && m.team1SetsWon > m.team2SetsWon;
    const isTeam2Winner = m.status === 'completed' && m.team2SetsWon > m.team1SetsWon;
    const isLive = m.status === 'live';

    return (
      <div
        key={m.id}
        onClick={() => handleMatchClick(m.id)}
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-xs active:scale-[0.99] group shadow-sm ${
          isFinal
            ? 'bg-amber-500/5 border-brand-orange shadow-card hover:border-brand-orange hover:shadow-card-hover'
            : isLive
            ? 'bg-white border-rose-300 ring-1 ring-rose-200 hover:border-rose-400'
            : 'bg-white border-border-neutral hover:border-brand-orange/60 hover:shadow-card-hover'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-neutral/70 text-[10px]">
          <div className="flex items-center gap-1.5 font-medium text-text-secondary">
            <span>{m.stage || (isFinal ? 'Championship Final' : 'Match')}</span>
            <span>•</span>
            <span className="truncate max-w-[120px]">{m.court}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isLive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-status-live font-bold uppercase tracking-wider text-[9px] border border-rose-200 animate-pulse">
                <Flame className="w-2.5 h-2.5" />
                <span>Live</span>
              </span>
            ) : m.status === 'completed' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-status-success font-semibold text-[9px] border border-emerald-200">
                <span>Final</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary font-medium text-[9px]">
                <span>{m.scheduledTime || 'Scheduled'}</span>
              </span>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-text-secondary/60 group-hover:text-brand-orange transition-colors" />
          </div>
        </div>

        {/* Team 1 Row */}
        <div className={`flex items-center justify-between py-1.5 px-2 rounded-xl transition-colors ${
          isTeam1Winner ? 'bg-amber-500/10 font-bold' : ''
        }`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-xs"
              style={{ backgroundColor: m.team1.logoBg || '#182230' }}
            >
              {m.team1.shortName}
            </span>
            <span className={`truncate text-sm ${isTeam1Winner ? 'text-brand-orange font-extrabold' : 'text-text-primary'}`}>
              {m.team1.name}
            </span>
            {isTeam1Winner && (
              <Crown className="w-3 h-3 text-brand-orange shrink-0 fill-current" />
            )}
          </div>
          <span className={`font-score text-base ml-2 shrink-0 ${
            isTeam1Winner ? 'text-brand-orange font-black' : isLive && m.servingTeamId === m.team1.id ? 'text-brand-orange font-bold' : 'text-text-primary font-bold'
          }`}>
            {m.team1SetsWon}
          </span>
        </div>

        {/* Team 2 Row */}
        <div className={`flex items-center justify-between py-1.5 px-2 rounded-xl mt-0.5 transition-colors ${
          isTeam2Winner ? 'bg-amber-500/10 font-bold' : ''
        }`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-xs"
              style={{ backgroundColor: m.team2.logoBg || '#182230' }}
            >
              {m.team2.shortName}
            </span>
            <span className={`truncate text-sm ${isTeam2Winner ? 'text-brand-orange font-extrabold' : 'text-text-primary'}`}>
              {m.team2.name}
            </span>
            {isTeam2Winner && (
              <Crown className="w-3 h-3 text-brand-orange shrink-0 fill-current" />
            )}
          </div>
          <span className={`font-score text-base ml-2 shrink-0 ${
            isTeam2Winner ? 'text-brand-orange font-black' : isLive && m.servingTeamId === m.team2.id ? 'text-brand-orange font-bold' : 'text-text-primary font-bold'
          }`}>
            {m.team2SetsWon}
          </span>
        </div>

        {/* Set-by-Set Scores breakdown if recorded */}
        {m.setScores && m.setScores.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border-neutral/60 flex items-center gap-2 text-[10px] text-text-secondary font-mono flex-wrap">
            <span className="text-[9px] uppercase font-bold text-text-secondary tracking-wider">Sets:</span>
            {m.setScores.map((s, idx) => (
              <span key={idx} className="px-1.5 py-0.5 rounded bg-surface-muted border border-border-neutral/60">
                G{idx + 1}: {s.team1Score}-{s.team2Score}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

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
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-brand-soft to-amber-500/10 border-2 border-brand-orange/50 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-brand-orange flex items-center justify-center text-white shadow-md">
                  <Crown className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange block">
                    Tournament Champion
                  </span>
                  <span className="text-base sm:text-lg font-display font-black text-text-primary">
                    {knockoutData.champion.name}
                  </span>
                  <span className="text-xs text-text-secondary block">
                    {knockoutData.champion.city ? `${knockoutData.champion.city}, ` : ''}{knockoutData.champion.state} Association
                  </span>
                </div>
              </div>
              <Medal className="w-8 h-8 text-brand-orange shrink-0 animate-bounce" />
            </div>
          )}

          {/* Mobile Stage Selector & View Mode Switcher (< md) */}
          <div className="md:hidden space-y-3">
            {/* View Style Switcher (Cards vs Tree) */}
            <div className="flex items-center justify-between pb-2 border-b border-border-neutral">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Knockout Rounds
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-surface-muted border border-border-neutral text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    nativeHaptics.selection();
                    setMobileViewStyle('stage');
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                    mobileViewStyle === 'stage'
                      ? 'bg-white text-brand-orange shadow-xs font-bold'
                      : 'text-text-secondary'
                  }`}
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>Stage View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    nativeHaptics.selection();
                    setMobileViewStyle('tree');
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                    mobileViewStyle === 'tree'
                      ? 'bg-white text-brand-orange shadow-xs font-bold'
                      : 'text-text-secondary'
                  }`}
                >
                  <Columns3 className="w-3 h-3" />
                  <span>Full Tree</span>
                </button>
              </div>
            </div>

            {/* Stage Selector Pills (when in Stage View) */}
            {mobileViewStyle === 'stage' && (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-muted border border-border-neutral overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    nativeHaptics.selection();
                    setMobileKnockoutStage('qf');
                  }}
                  className={`flex-1 min-w-[95px] py-2 px-2.5 rounded-lg text-xs font-bold text-center transition-all ${
                    mobileKnockoutStage === 'qf'
                      ? 'bg-brand-orange text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Quarter-Finals ({knockoutData.quarterFinals.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    nativeHaptics.selection();
                    setMobileKnockoutStage('sf');
                  }}
                  className={`flex-1 min-w-[95px] py-2 px-2.5 rounded-lg text-xs font-bold text-center transition-all ${
                    mobileKnockoutStage === 'sf'
                      ? 'bg-brand-orange text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Semi-Finals ({knockoutData.semiFinals.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    nativeHaptics.selection();
                    setMobileKnockoutStage('final');
                  }}
                  className={`flex-1 min-w-[95px] py-2 px-2.5 rounded-lg text-xs font-bold text-center transition-all ${
                    mobileKnockoutStage === 'final'
                      ? 'bg-brand-orange text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Grand Final
                </button>
              </div>
            )}

            {/* Mobile Stage Cards Content */}
            {mobileViewStyle === 'stage' && (
              <div className="space-y-3 pt-1">
                {mobileKnockoutStage === 'qf' && (
                  <>
                    {knockoutData.quarterFinals.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-surface-muted border border-border-neutral text-xs text-text-secondary text-center">
                        Quarter-Final fixtures are being scheduled.
                      </div>
                    ) : (
                      knockoutData.quarterFinals.map((m) => renderBracketMatchCard(m))
                    )}
                  </>
                )}

                {mobileKnockoutStage === 'sf' && (
                  <>
                    {knockoutData.semiFinals.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-surface-muted border border-border-neutral text-xs text-text-secondary text-center">
                        Semi-Final fixtures awaiting Quarter-Final results.
                      </div>
                    ) : (
                      knockoutData.semiFinals.map((m) => renderBracketMatchCard(m))
                    )}
                  </>
                )}

                {mobileKnockoutStage === 'final' && (
                  <>
                    {knockoutData.final ? (
                      renderBracketMatchCard(knockoutData.final, true)
                    ) : (
                      <div className="p-8 rounded-2xl bg-surface-muted border border-border-neutral text-xs text-text-secondary text-center space-y-1">
                        <Trophy className="w-8 h-8 text-brand-orange mx-auto opacity-70 mb-2" />
                        <span className="font-bold text-text-primary block">Championship Final</span>
                        <p>Grand final will be scheduled following the conclusion of Semi-Finals.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Desktop Bracket Rail OR Mobile Tree View */}
          <div className={`${mobileViewStyle === 'tree' ? 'flex' : 'hidden md:grid'} md:grid-cols-3 overflow-x-auto snap-x snap-mandatory gap-4 pb-3 sm:pb-0 no-scrollbar card-rail`}>
            
            {/* Round 1: Quarter Finals */}
            <div className="space-y-3 min-w-[280px] sm:min-w-0 flex-shrink-0 sm:flex-shrink snap-center">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-orange pb-2 border-b border-border-neutral flex items-center justify-between">
                <span>Quarter-Finals</span>
                <span className="text-[10px] text-text-secondary font-mono">{knockoutData.quarterFinals.length} Fixtures</span>
              </div>

              {knockoutData.quarterFinals.length === 0 ? (
                <div className="p-6 rounded-2xl bg-surface-muted border border-border-neutral text-xs text-text-secondary text-center">
                  Fixtures being scheduled
                </div>
              ) : (
                knockoutData.quarterFinals.map((m) => renderBracketMatchCard(m))
              )}
            </div>

            {/* Round 2: Semi Finals */}
            <div className="space-y-3 min-w-[280px] sm:min-w-0 flex-shrink-0 sm:flex-shrink snap-center">
              <div className="text-xs font-bold uppercase tracking-wider text-status-warning pb-2 border-b border-border-neutral flex items-center justify-between">
                <span>Semi-Finals</span>
                <span className="text-[10px] text-text-secondary font-mono">{knockoutData.semiFinals.length} Fixtures</span>
              </div>

              {knockoutData.semiFinals.length === 0 ? (
                <div className="p-6 rounded-2xl bg-surface-muted border border-border-neutral text-xs text-text-secondary text-center">
                  Awaiting QF winners
                </div>
              ) : (
                knockoutData.semiFinals.map((m) => renderBracketMatchCard(m))
              )}
            </div>

            {/* Round 3: Championship Final */}
            <div className="space-y-3 min-w-[280px] sm:min-w-0 flex-shrink-0 sm:flex-shrink snap-center">
              <div className="text-xs font-bold uppercase tracking-wider text-status-success pb-2 border-b border-border-neutral flex items-center justify-between">
                <span>Grand Final</span>
                <Trophy className="w-3.5 h-3.5 text-brand-orange" />
              </div>

              {knockoutData.final ? (
                renderBracketMatchCard(knockoutData.final, true)
              ) : (
                <div className="p-6 rounded-2xl bg-surface-muted border border-border-neutral text-xs text-text-secondary text-center">
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
