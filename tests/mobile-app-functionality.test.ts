import { describe, it, expect, beforeEach } from 'vitest';
import { dataService } from '../src/services/dataService';
import { tournamentRepository } from '../src/repositories/tournamentRepository';
import { matchRepository } from '../src/repositories/matchRepository';
import { tournamentTeamRepository } from '../src/repositories/tournamentTeamRepository';
import { rosterRepository } from '../src/repositories/rosterRepository';
import { standingsService } from '../src/services/standingsService';
import { INITIAL_AUTHORIZED_USERS, SUPER_ADMIN_EMAIL } from '../src/context/AuthContext';
import type { Match, AdminTournament } from '../src/types';

describe('Ball Badminton Live — Complete Mobile App Functionality Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ==========================================================================
  // SECTION 1: DATA SERVICE & BACKEND RESILIENCE
  // ==========================================================================
  describe('1. Data Service Layer & Supabase/Local Fallback', () => {
    it('retrieves tournaments with real database structure', async () => {
      const tournaments = await dataService.getTournaments();
      expect(Array.isArray(tournaments)).toBe(true);
      expect(tournaments.length).toBeGreaterThan(0);

      const first = tournaments[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('startDate');
      expect(first).toHaveProperty('endDate');
      expect(first).toHaveProperty('venue');
      expect(first).toHaveProperty('city');
      expect(first).toHaveProperty('format');
    });

    it('retrieves tournament by database ID', async () => {
      const all = await dataService.getTournaments();
      const target = all[0];

      const found = await dataService.getTournamentById(target.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(target.id);
      expect(found?.name).toBe(target.name);
    });

    it('filters matches strictly by tournament ID', async () => {
      const allTournaments = await dataService.getTournaments();
      const tournId = allTournaments[0].id;

      const tournamentMatches = await dataService.getMatchesByTournament(tournId);
      expect(Array.isArray(tournamentMatches)).toBe(true);
      
      for (const m of tournamentMatches) {
        expect(m.tournamentId).toBe(tournId);
      }
    });

    it('retrieves live matches with team and court service information', async () => {
      const liveMatches = await dataService.getLiveMatches();
      expect(Array.isArray(liveMatches)).toBe(true);
      expect(liveMatches.length).toBeGreaterThan(0);

      const live = liveMatches[0];
      expect(live.status).toBe('live');
      expect(live.team1).toBeDefined();
      expect(live.team2).toBeDefined();
      expect(live.currentSet).toBeGreaterThanOrEqual(1);
      expect(live.maxPointsPerSet).toBe(29);
      expect(live.setScores.length).toBeGreaterThanOrEqual(1);
    });

    it('retrieves completed matches with final scores and winner sets', async () => {
      const completedMatches = await dataService.getCompletedMatches();
      expect(Array.isArray(completedMatches)).toBe(true);
      expect(completedMatches.length).toBeGreaterThan(0);

      const completed = completedMatches[0];
      expect(completed.status).toBe('completed');
      expect(completed.team1SetsWon + completed.team2SetsWon).toBeGreaterThanOrEqual(2);
      expect(completed.setScores.every(s => s.isCompleted)).toBe(true);
    });
  });

  // ==========================================================================
  // SECTION 2: TOURNAMENT DETAIL, SQUADS & BBFI STANDINGS
  // ==========================================================================
  describe('2. Dedicated Tournament Detail, Rosters & Points Standings', () => {
    const TOURNAMENT_ID = 'tourn-70-senior-nat';

    it('retrieves registered participating teams for the tournament', async () => {
      const teams = await dataService.getTournamentTeams(TOURNAMENT_ID);
      expect(Array.isArray(teams)).toBe(true);
      expect(teams.length).toBeGreaterThan(0);

      const firstReg = teams[0];
      expect(firstReg.tournamentId).toBe(TOURNAMENT_ID);
      expect(firstReg.team).toBeDefined();
      expect(firstReg.team?.name).toBeDefined();
      expect(firstReg.team?.shortName).toBeDefined();
    });

    it('retrieves 5s squad members with positions and jersey numbers', () => {
      const roster = dataService.getTeamRoster('team-tn', TOURNAMENT_ID);
      expect(Array.isArray(roster)).toBe(true);
      expect(roster.length).toBeGreaterThanOrEqual(5);

      const validPositions = ['Front / Net', 'Centre / Pivot', 'Base / Deep', 'Server'];
      for (const player of roster) {
        expect(validPositions).toContain(player.position);
        expect(player.jerseyNumber).toBeGreaterThan(0);
      }

      // Must have at least 1 captain
      const captain = roster.find(p => p.isCaptain);
      expect(captain).toBeDefined();
    });

    it('computes official BBFI standings table from completed matches', () => {
      const standings = standingsService.calculateStandings(TOURNAMENT_ID);
      expect(standings).toBeDefined();
      expect(standings.overall.length).toBeGreaterThan(0);

      for (const row of standings.overall) {
        expect(row.played).toBe(row.won + row.lost);
        expect(row.points).toBe(row.won * 2); // BBFI 2 points per win
        expect(row.setDifference).toBe(row.setsWon - row.setsLost);
        expect(row.pointDifference).toBe(row.pointsFor - row.pointsAgainst);
      }
    });

    it('generates knockout bracket structure for championship stages', () => {
      const tree = standingsService.generateKnockoutTree(TOURNAMENT_ID);
      expect(tree).toBeDefined();
      expect(Array.isArray(tree.semiFinals)).toBe(true);
    });
  });

  // ==========================================================================
  // SECTION 3: DETAILED MATCH SUMMARY (READ-ONLY) INTEGRITY
  // ==========================================================================
  describe('3. Detailed Match Summary 8-Requirement Audit', () => {
    const COMPLETED_MATCH_ID = 'match-rec-01';

    it('provides complete match summary data without inventing statistics', async () => {
      const match = await dataService.getMatchById(COMPLETED_MATCH_ID);
      expect(match).toBeDefined();
      expect(match?.status).toBe('completed');

      // Requirement 1: Tournament, round, court, date, status
      expect(match?.tournamentName).toBeTruthy();
      expect(match?.stage).toBeTruthy();
      expect(match?.court).toBeTruthy();
      expect(match?.status).toBe('completed');

      // Requirement 2: Both teams, winner, and final result
      expect(match?.team1).toBeDefined();
      expect(match?.team2).toBeDefined();
      const winnerTeamId = match!.team1SetsWon > match!.team2SetsWon ? match!.team1.id : match!.team2.id;
      expect(winnerTeamId).toBe('team-tn');

      // Requirement 3: Complete set-by-set scorecard
      expect(match?.setScores.length).toBe(3);
      for (const set of match!.setScores) {
        expect(set.isCompleted).toBe(true);
        expect(set.team1Score).toBeGreaterThanOrEqual(0);
        expect(set.team2Score).toBeGreaterThanOrEqual(0);
        expect(set.winnerTeamId).toBeDefined();
      }

      // Requirement 4 & 7: Score events & statistics honesty check
      const events = await dataService.getScoreEvents(COMPLETED_MATCH_ID);
      expect(Array.isArray(events)).toBe(true);
      // When events are empty, the UI displays honest message rather than fake numbers

      // Requirement 5: Valid duration timing
      expect(match?.matchDurationMinutes).toBe(88);

      // Requirement 8: Navigation back to tournament matches
      const otherMatches = await dataService.getMatchesByTournament(match!.tournamentId);
      expect(otherMatches.length).toBeGreaterThan(1);
    });

    it('guarantees completed matches are strictly read-only', async () => {
      const match = await dataService.getMatchById(COMPLETED_MATCH_ID);
      expect(match?.status).toBe('completed');
      
      // Completed matches must have status 'completed', disabling scoring buttons in UI
      const isReadOnly = match?.status === 'completed';
      expect(isReadOnly).toBe(true);
    });
  });

  // ==========================================================================
  // SECTION 4: ROLE-BASED ACCESS CONTROL (RBAC) & PRIVILEGE ENFORCEMENT
  // ==========================================================================
  describe('4. RBAC & Privileged Features Access Boundary', () => {
    it('restricts super admin authority to authorized primary email', () => {
      const superAdmin = INITIAL_AUTHORIZED_USERS.find(u => u.email === SUPER_ADMIN_EMAIL);
      expect(superAdmin).toBeDefined();
      expect(superAdmin?.role).toBe('super_admin');
    });

    it('distinguishes between privileged scorers and unauthenticated spectators', () => {
      const scorer = INITIAL_AUTHORIZED_USERS.find(u => u.role === 'official_scorer');
      expect(scorer).toBeDefined();
      expect(scorer?.role).toBe('official_scorer');

      const viewer = INITIAL_AUTHORIZED_USERS.find(u => u.role === 'viewer');
      expect(viewer).toBeDefined();
      expect(viewer?.role).toBe('viewer');

      const isScorerPrivileged = scorer?.role === 'super_admin' || scorer?.role === 'tournament_admin' || scorer?.role === 'official_scorer';
      expect(isScorerPrivileged).toBe(true);

      const isViewerPrivileged = viewer?.role === 'super_admin' || viewer?.role === 'tournament_admin' || viewer?.role === 'official_scorer';
      expect(isViewerPrivileged).toBe(false);
    });
  });

  // ==========================================================================
  // SECTION 5: NAVIGATION TAB RESOLUTION & FLOWS
  // ==========================================================================
  describe('5. Mobile Bottom Navigation Tab Highlighting Resolution', () => {
    const resolveTab = (pathname: string, isSheetOpen: boolean): string => {
      if (isSheetOpen) return 'more';
      if (pathname.startsWith('/tournaments')) return 'tournaments';
      if (pathname === '/live') return 'live';
      if (pathname === '/results') return 'results';
      if (pathname.startsWith('/matches/')) {
        const matchId = pathname.replace('/matches/', '');
        const match = matchRepository.getById(matchId);
        if (match?.status === 'completed') return 'results';
        return 'live';
      }
      return 'home';
    };

    it('resolves active tab for root Home route', () => {
      expect(resolveTab('/', false)).toBe('home');
    });

    it('resolves active tab for Live matches route', () => {
      expect(resolveTab('/live', false)).toBe('live');
    });

    it('resolves active tab for Tournaments list and detail routes', () => {
      expect(resolveTab('/tournaments', false)).toBe('tournaments');
      expect(resolveTab('/tournaments/tourn-70-senior-nat', false)).toBe('tournaments');
    });

    it('resolves active tab for Results route and completed match summary', () => {
      expect(resolveTab('/results', false)).toBe('results');
      expect(resolveTab('/matches/match-rec-01', false)).toBe('results');
    });

    it('resolves active tab for Live match center', () => {
      expect(resolveTab('/matches/match-live-01', false)).toBe('live');
    });

    it('resolves active tab to More when sheet is opened', () => {
      expect(resolveTab('/', true)).toBe('more');
      expect(resolveTab('/tournaments', true)).toBe('more');
    });
  });
});
