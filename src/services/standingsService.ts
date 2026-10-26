import type { Match, TeamStandings, Team } from '../types';
import { tournamentTeamRepository } from '../repositories/tournamentTeamRepository';
import { teamRepository } from '../repositories/teamRepository';
import { matchRepository } from '../repositories/matchRepository';

export interface BracketNode {
  matchId?: string;
  stage: string;
  stageLabel: string;
  order: number;
  court?: string;
  scheduledTime?: string;
  status?: string;
  team1?: Team;
  team2?: Team;
  team1Score?: number;
  team2Score?: number;
  winnerTeamId?: string;
}

/**
 * Determines whether a match belongs to the knockout elimination bracket.
 * Knockout matches (Quarter-Finals, Semi-Finals, Finals, Bronze Playoff)
 * are excluded from group/round-robin points tables.
 */
export const isKnockoutMatch = (match: Match): boolean => {
  const stage = (match.stage || '').toLowerCase();
  const round = (match.round || '').toLowerCase();
  const knockoutIndicators = [
    'quarter',
    'semi',
    'final',
    'bronze',
    'playoff',
    'knockout',
    'round of 16',
    'round of 32',
    'elimination',
  ];
  return knockoutIndicators.some((term) => stage.includes(term) || round.includes(term));
};

export const standingsService = {
  /**
   * Computes official BBFI standings for a tournament (overall or grouped).
   * Ranking criteria: Points (2 per win) -> Set Diff -> Point Diff -> Points For.
   * Knockout matches are strictly excluded to preserve group/league integrity.
   */
  calculateStandings(tournamentId: string): {
    overall: TeamStandings[];
    groups: Record<string, TeamStandings[]>;
  } {
    const registrations = tournamentTeamRepository.getByTournament(tournamentId);
    // Filter to completed group/league matches only
    const matches = matchRepository.getAll().filter(
      (m) => m.tournamentId === tournamentId && m.status === 'completed' && !isKnockoutMatch(m)
    );
    const allTeams = teamRepository.getAll();

    // Map of teamId -> stats
    const statsMap = new Map<string, TeamStandings>();

    // Initialize all registered teams with zero stats
    for (const reg of registrations) {
      const team = allTeams.find((t) => t.id === reg.teamId);
      statsMap.set(reg.teamId, {
        teamId: reg.teamId,
        teamName: team?.name || `Team ${reg.teamId}`,
        shortName: team?.shortName || 'TM',
        groupName: reg.groupName || 'Group A',
        played: 0,
        won: 0,
        lost: 0,
        setsWon: 0,
        setsLost: 0,
        setDifference: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifference: 0,
        points: 0,
      });
    }

    // Ingest completed group match outcomes with de-duplication
    const seenMatchIds = new Set<string>();
    for (const match of matches) {
      if (seenMatchIds.has(match.id)) continue;
      seenMatchIds.add(match.id);

      const t1Id = match.team1.id;
      const t2Id = match.team2.id;

      if (!statsMap.has(t1Id)) {
        const reg1 = registrations.find((r) => r.teamId === t1Id);
        statsMap.set(t1Id, {
          teamId: t1Id,
          teamName: match.team1.name,
          shortName: match.team1.shortName,
          groupName: reg1?.groupName || 'Group A',
          played: 0,
          won: 0,
          lost: 0,
          setsWon: 0,
          setsLost: 0,
          setDifference: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          pointDifference: 0,
          points: 0,
        });
      }
      if (!statsMap.has(t2Id)) {
        const reg2 = registrations.find((r) => r.teamId === t2Id);
        statsMap.set(t2Id, {
          teamId: t2Id,
          teamName: match.team2.name,
          shortName: match.team2.shortName,
          groupName: reg2?.groupName || 'Group A',
          played: 0,
          won: 0,
          lost: 0,
          setsWon: 0,
          setsLost: 0,
          setDifference: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          pointDifference: 0,
          points: 0,
        });
      }

      const t1Stats = statsMap.get(t1Id)!;
      const t2Stats = statsMap.get(t2Id)!;

      t1Stats.played += 1;
      t2Stats.played += 1;

      // Sets
      t1Stats.setsWon += match.team1SetsWon;
      t1Stats.setsLost += match.team2SetsWon;
      t2Stats.setsWon += match.team2SetsWon;
      t2Stats.setsLost += match.team1SetsWon;

      // Cumulative points scored across sets
      let t1TotalPoints = 0;
      let t2TotalPoints = 0;
      for (const set of match.setScores) {
        t1TotalPoints += set.team1Score;
        t2TotalPoints += set.team2Score;
      }

      t1Stats.pointsFor += t1TotalPoints;
      t1Stats.pointsAgainst += t2TotalPoints;
      t2Stats.pointsFor += t2TotalPoints;
      t2Stats.pointsAgainst += t1TotalPoints;

      // Match Win/Loss: BBFI 2 points per win
      if (match.team1SetsWon > match.team2SetsWon) {
        t1Stats.won += 1;
        t1Stats.points += 2;
        t2Stats.lost += 1;
      } else if (match.team2SetsWon > match.team1SetsWon) {
        t2Stats.won += 1;
        t2Stats.points += 2;
        t1Stats.lost += 1;
      }
    }

    // Finalize differences & sorting comparator
    const sortStandings = (a: TeamStandings, b: TeamStandings) => {
      // 1. Points
      if (b.points !== a.points) return b.points - a.points;
      // 2. Set Difference
      if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
      // 3. Point Difference
      if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
      // 4. Points Scored For
      return b.pointsFor - a.pointsFor;
    };

    const overallList = Array.from(statsMap.values()).map((row) => ({
      ...row,
      setDifference: row.setsWon - row.setsLost,
      pointDifference: row.pointsFor - row.pointsAgainst,
    })).sort(sortStandings);

    // Grouping: preserve separate group standings per groupName
    const groups: Record<string, TeamStandings[]> = {};
    for (const row of overallList) {
      const gName = row.groupName || 'General Pool';
      if (!groups[gName]) groups[gName] = [];
      groups[gName].push(row);
    }

    // Sort each group table individually
    for (const gName in groups) {
      groups[gName].sort(sortStandings);
    }

    return {
      overall: overallList,
      groups,
    };
  },

  /**
   * Constructs the knockout elimination tree with round progression
   */
  generateKnockoutTree(tournamentId: string): {
    quarterFinals: Match[];
    semiFinals: Match[];
    final?: Match;
    champion?: Team;
  } {
    const tournamentMatches = matchRepository.getAll().filter(
      (m) => m.tournamentId === tournamentId
    );

    const quarterFinals = tournamentMatches.filter(
      (m) => m.stage === 'Quarter-Final' || m.round === 'Quarter-Final'
    );
    const semiFinals = tournamentMatches.filter(
      (m) => m.stage === 'Semi-Final 1' || m.round === 'Semi-Final 1' || 
             m.stage === 'Semi-Final 2' || m.round === 'Semi-Final 2'
    );
    const final = tournamentMatches.find(
      (m) => m.stage === 'Championship Final' || m.round === 'Championship Final' || m.round === 'Final'
    );

    let champion: Team | undefined = undefined;
    if (final && final.status === 'completed') {
      champion = final.team1SetsWon > final.team2SetsWon ? final.team1 : final.team2;
    }

    return {
      quarterFinals,
      semiFinals,
      final,
      champion,
    };
  },
};
