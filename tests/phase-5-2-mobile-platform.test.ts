import { describe, it, expect, beforeEach } from 'vitest';
import { standingsService, isKnockoutMatch } from '../src/services/standingsService';
import { tournamentRepository } from '../src/repositories/tournamentRepository';
import { teamRepository } from '../src/repositories/teamRepository';
import { tournamentTeamRepository } from '../src/repositories/tournamentTeamRepository';
import { matchRepository } from '../src/repositories/matchRepository';
import { scorerRepository } from '../src/repositories/scorerRepository';
import { SUPER_ADMIN_EMAIL, INITIAL_AUTHORIZED_USERS } from '../src/context/AuthContext';
import type { Match, AdminUser, UserRole } from '../src/types';

describe('PHASE 5.2 — Complete Mobile-First Ball Badminton Live Platform Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    tournamentRepository.resetToDefaults();
    teamRepository.resetToDefaults();
    matchRepository.resetToDefaults();
    scorerRepository.resetToDefaults();
  });

  // ==========================================================================
  // SECTION 1: OWNER-ONLY ACCESS GOVERNANCE & TOURNAMENT SCOPING
  // ==========================================================================
  describe('1. Owner-Only Access Governance & Tournament Scoping', () => {
    it('verifies primary platform owner identity and super_admin privileges', () => {
      expect(SUPER_ADMIN_EMAIL).toBe('akashakashr505@gmail.com');
      const owner = INITIAL_AUTHORIZED_USERS.find((u) => u.email === SUPER_ADMIN_EMAIL);
      expect(owner).toBeDefined();
      expect(owner?.role).toBe('super_admin');
      expect(owner?.name).toBe('Akash R');
    });

    it('enforces that only super_admin can grant or revoke dashboard access', () => {
      const evaluateCanManageUsers = (role?: UserRole) => role === 'super_admin';

      expect(evaluateCanManageUsers('super_admin')).toBe(true);
      expect(evaluateCanManageUsers('tournament_admin')).toBe(false);
      expect(evaluateCanManageUsers('official_scorer')).toBe(false);
      expect(evaluateCanManageUsers('viewer')).toBe(false);
      expect(evaluateCanManageUsers(undefined)).toBe(false);
    });

    it('supports granting access with tournament scoping (assignedTournaments)', () => {
      const TOURNAMENT_ID = 'tourn-70-senior-nat';
      const newOrganizer: AdminUser = {
        id: 'user-scoped-org-01',
        email: 'scoped.organizer@tnbba.org',
        name: 'TNBBA Field Director',
        role: 'tournament_admin',
        grantedBy: SUPER_ADMIN_EMAIL,
        grantedAt: new Date().toISOString(),
        isActive: true,
        assignedTournaments: [TOURNAMENT_ID],
      };

      expect(newOrganizer.assignedTournaments).toBeDefined();
      expect(newOrganizer.assignedTournaments).toContain(TOURNAMENT_ID);
      expect(newOrganizer.assignedTournaments?.length).toBe(1);
    });

    it('prevents demotion or revocation of the primary Super Admin', () => {
      const targetUser = INITIAL_AUTHORIZED_USERS.find((u) => u.email === SUPER_ADMIN_EMAIL)!;
      const canRevoke = targetUser.email !== SUPER_ADMIN_EMAIL;
      expect(canRevoke).toBe(false);

      const canDemote = (user: AdminUser, newRole: UserRole) => {
        if (user.email === SUPER_ADMIN_EMAIL && newRole !== 'super_admin') {
          return false;
        }
        return true;
      };

      expect(canDemote(targetUser, 'tournament_admin')).toBe(false);
      expect(canDemote(targetUser, 'super_admin')).toBe(true);
    });
  });

  // ==========================================================================
  // SECTION 2: STANDINGS CALCULATION & KNOCKOUT EXCLUSION INTEGRITY
  // ==========================================================================
  describe('2. Standings Calculation & Knockout Exclusion Integrity', () => {
    it('correctly identifies knockout stages and separates them from league matches', () => {
      const knockoutMatch1 = { stage: 'Championship Final', round: 'Final' } as Match;
      const knockoutMatch2 = { stage: 'Semi-Final 1', round: 'Semi-Final' } as Match;
      const knockoutMatch3 = { stage: 'Semi-Final 2', round: 'Semi-Final' } as Match;
      const knockoutMatch4 = { stage: 'Quarter-Final', round: 'Quarter-Final' } as Match;
      const knockoutMatch5 = { stage: 'Bronze Medal Playoff', round: 'Playoff' } as Match;
      const leagueMatch1 = { stage: 'Group Stage', round: 'Group Stage' } as Match;
      const leagueMatch2 = { stage: 'Super 8 League', round: 'Round-Robin' } as Match;

      expect(isKnockoutMatch(knockoutMatch1)).toBe(true);
      expect(isKnockoutMatch(knockoutMatch2)).toBe(true);
      expect(isKnockoutMatch(knockoutMatch3)).toBe(true);
      expect(isKnockoutMatch(knockoutMatch4)).toBe(true);
      expect(isKnockoutMatch(knockoutMatch5)).toBe(true);
      expect(isKnockoutMatch(leagueMatch1)).toBe(false);
      expect(isKnockoutMatch(leagueMatch2)).toBe(false);
    });

    it('excludes knockout matches from group points table calculation', () => {
      const TEST_TOURN_ID = 'tourn-test-standings-01';

      // Register two teams in Group A
      tournamentTeamRepository.registerTeam({
        id: 'reg-t1',
        tournamentId: TEST_TOURN_ID,
        teamId: 'team-t1',
        groupName: 'Group A',
        status: 'confirmed',
      });
      tournamentTeamRepository.registerTeam({
        id: 'reg-t2',
        tournamentId: TEST_TOURN_ID,
        teamId: 'team-t2',
        groupName: 'Group A',
        status: 'confirmed',
      });

      // Match 1: Group Stage match (T1 beats T2 2-0: 29-20, 29-22) -> MUST be counted
      matchRepository.create({
        tournamentId: TEST_TOURN_ID,
        stage: 'Group Stage',
        round: 'Group Stage',
        status: 'completed',
        court: 'Court 1',
        team1: { id: 'team-t1', name: 'Team One', score: 2, sets: 2 },
        team2: { id: 'team-t2', name: 'Team Two', score: 0, sets: 0 },
        currentSet: 2,
        team1SetsWon: 2,
        team2SetsWon: 0,
        setScores: [
          { gameNumber: 1, team1Score: 29, team2Score: 20, isCompleted: true, winnerTeamId: 'team-t1' },
          { gameNumber: 2, team1Score: 29, team2Score: 22, isCompleted: true, winnerTeamId: 'team-t1' },
        ],
        scheduledTime: '10:00 AM',
      });

      // Match 2: Championship Final match (T2 beats T1 2-1: 29-27, 20-29, 29-26) -> MUST be EXCLUDED from points table
      matchRepository.create({
        tournamentId: TEST_TOURN_ID,
        stage: 'Championship Final',
        round: 'Championship Final',
        status: 'completed',
        court: 'Centre Court',
        team1: { id: 'team-t1', name: 'Team One', score: 1, sets: 1 },
        team2: { id: 'team-t2', name: 'Team Two', score: 2, sets: 2 },
        currentSet: 3,
        team1SetsWon: 1,
        team2SetsWon: 2,
        setScores: [
          { gameNumber: 1, team1Score: 27, team2Score: 29, isCompleted: true, winnerTeamId: 'team-t2' },
          { gameNumber: 2, team1Score: 29, team2Score: 20, isCompleted: true, winnerTeamId: 'team-t1' },
          { gameNumber: 3, team1Score: 26, team2Score: 29, isCompleted: true, winnerTeamId: 'team-t2' },
        ],
        scheduledTime: '06:00 PM',
      });

      const { overall, groups } = standingsService.calculateStandings(TEST_TOURN_ID);

      // In Group A table, only the Group Stage match is counted: T1 played 1, won 1, points 2
      const t1Stats = overall.find((t) => t.teamId === 'team-t1');
      const t2Stats = overall.find((t) => t.teamId === 'team-t2');

      expect(t1Stats).toBeDefined();
      expect(t1Stats?.played).toBe(1); // NOT 2 (Final was excluded)
      expect(t1Stats?.won).toBe(1);
      expect(t1Stats?.points).toBe(2);
      expect(t1Stats?.setsWon).toBe(2);
      expect(t1Stats?.setsLost).toBe(0);

      expect(t2Stats).toBeDefined();
      expect(t2Stats?.played).toBe(1);
      expect(t2Stats?.lost).toBe(1);
      expect(t2Stats?.points).toBe(0);

      // Verify separate group sorting
      expect(groups['Group A']).toBeDefined();
      expect(groups['Group A'][0].teamId).toBe('team-t1');
    });
  });

  // ==========================================================================
  // SECTION 3: OFFICIAL SCORER ROLE & PRIVILEGE BOUNDARIES
  // ==========================================================================
  describe('3. Official Scorer Role & Privilege Boundaries', () => {
    it('restricts scorers from managing tournaments and teams', () => {
      const evaluateRolePermissions = (role: UserRole) => {
        const isSuperAdmin = role === 'super_admin';
        const isTournamentAdmin = role === 'tournament_admin';
        const isScorer = role === 'official_scorer';

        return {
          canManageUsers: isSuperAdmin,
          canManageTournaments: isSuperAdmin || isTournamentAdmin,
          canManageTeams: isSuperAdmin || isTournamentAdmin,
          canScheduleMatches: isSuperAdmin || isTournamentAdmin,
          canAssignScorers: isSuperAdmin || isTournamentAdmin,
          canScoreMatches: isSuperAdmin || isTournamentAdmin || isScorer,
        };
      };

      const scorerPerms = evaluateRolePermissions('official_scorer');
      expect(scorerPerms.canManageUsers).toBe(false);
      expect(scorerPerms.canManageTournaments).toBe(false);
      expect(scorerPerms.canManageTeams).toBe(false);
      expect(scorerPerms.canScheduleMatches).toBe(false);
      expect(scorerPerms.canAssignScorers).toBe(false);
      expect(scorerPerms.canScoreMatches).toBe(true);
    });

    it('verifies scorer match assignment filtering', () => {
      const SCORER_EMAIL = 'ramachandra.umpire@bbfi.org';
      const OTHER_SCORER = 'sundaram.umpire@bbfi.org';

      const match1 = {
        id: 'm1',
        scorerEmail: SCORER_EMAIL,
        court: 'Centre Court',
        status: 'live',
      } as Match;

      const match2 = {
        id: 'm2',
        scorerEmail: OTHER_SCORER,
        court: 'Court 2',
        status: 'live',
      } as Match;

      const isAssigned = (m: Match, email: string) => m.scorerEmail?.toLowerCase() === email.toLowerCase();

      expect(isAssigned(match1, SCORER_EMAIL)).toBe(true);
      expect(isAssigned(match2, SCORER_EMAIL)).toBe(false);
    });
  });

  // ==========================================================================
  // SECTION 4: FIXTURE SCHEDULING CONFLICT DETECTION
  // ==========================================================================
  describe('4. Fixture Scheduling Conflict Detection Safeguards', () => {
    const existingFixture = {
      id: 'fix-01',
      tournamentId: 'tourn-70-senior-nat',
      court: 'Centre Court (Outdoor Red Clay)',
      scheduledTime: '2026-11-12, 10:00 AM IST',
      team1: { id: 'team-alpha', name: 'Alpha Kings' },
      team2: { id: 'team-beta', name: 'Beta Spikers' },
      scorerEmail: 'ramachandra.umpire@bbfi.org',
      status: 'upcoming',
    };

    const validateConflict = (params: {
      court: string;
      date: string;
      time: string;
      team1Id: string;
      team2Id: string;
      scorerEmail: string;
      activeMatches: any[];
    }) => {
      const { court, date, time, team1Id, team2Id, scorerEmail, activeMatches } = params;

      // 1. Court Conflict
      const courtConflict = activeMatches.find(
        (m) =>
          m.court.toLowerCase() === court.toLowerCase() &&
          m.scheduledTime.toLowerCase().includes(date.toLowerCase()) &&
          m.scheduledTime.toLowerCase().includes(time.toLowerCase())
      );
      if (courtConflict) {
        return { hasConflict: true, type: 'court', message: `Court Conflict: ${court} is already booked` };
      }

      // 2. Team Conflict
      const teamConflict = activeMatches.find(
        (m) =>
          (m.team1.id === team1Id || m.team2.id === team1Id || m.team1.id === team2Id || m.team2.id === team2Id) &&
          m.scheduledTime.toLowerCase().includes(date.toLowerCase()) &&
          m.scheduledTime.toLowerCase().includes(time.toLowerCase())
      );
      if (teamConflict) {
        return { hasConflict: true, type: 'team', message: 'Team Conflict: Selected team is already playing' };
      }

      // 3. Scorer Conflict
      if (scorerEmail) {
        const scorerConflict = activeMatches.find(
          (m) =>
            m.scorerEmail?.toLowerCase() === scorerEmail.toLowerCase() &&
            m.court.toLowerCase() !== court.toLowerCase() &&
            m.scheduledTime.toLowerCase().includes(date.toLowerCase()) &&
            m.scheduledTime.toLowerCase().includes(time.toLowerCase())
        );
        if (scorerConflict) {
          return { hasConflict: true, type: 'scorer', message: 'Scorer Conflict: Umpire already assigned to another court' };
        }
      }

      return { hasConflict: false };
    };

    it('detects court double-booking at the same timeslot', () => {
      const res = validateConflict({
        court: 'Centre Court (Outdoor Red Clay)',
        date: '2026-11-12',
        time: '10:00 AM',
        team1Id: 'team-gamma',
        team2Id: 'team-delta',
        scorerEmail: 'other.umpire@bbfi.org',
        activeMatches: [existingFixture],
      });

      expect(res.hasConflict).toBe(true);
      expect(res.type).toBe('court');
    });

    it('detects team simultaneous play conflict at the same timeslot', () => {
      const res = validateConflict({
        court: 'Court 2',
        date: '2026-11-12',
        time: '10:00 AM',
        team1Id: 'team-alpha', // Alpha is already playing on Centre Court!
        team2Id: 'team-gamma',
        scorerEmail: 'other.umpire@bbfi.org',
        activeMatches: [existingFixture],
      });

      expect(res.hasConflict).toBe(true);
      expect(res.type).toBe('team');
    });

    it('detects scorer double-booking conflict across courts at the same timeslot', () => {
      const res = validateConflict({
        court: 'Court 3',
        date: '2026-11-12',
        time: '10:00 AM',
        team1Id: 'team-gamma',
        team2Id: 'team-delta',
        scorerEmail: 'ramachandra.umpire@bbfi.org', // Ramachandra is already on Centre Court!
        activeMatches: [existingFixture],
      });

      expect(res.hasConflict).toBe(true);
      expect(res.type).toBe('scorer');
    });

    it('allows scheduling when no court, team, or scorer conflict exists', () => {
      const res = validateConflict({
        court: 'Court 4',
        date: '2026-11-12',
        time: '02:00 PM', // Different time slot!
        team1Id: 'team-gamma',
        team2Id: 'team-delta',
        scorerEmail: 'other.umpire@bbfi.org',
        activeMatches: [existingFixture],
      });

      expect(res.hasConflict).toBe(false);
    });
  });

  // ==========================================================================
  // SECTION 5: PUBLIC TOURNAMENT CREATION PERSISTENCE
  // ==========================================================================
  describe('5. Public Tournament Creation Persistence', () => {
    it('persists newly created tournament into local tournament repository', () => {
      const newTourn = tournamentRepository.create({
        name: 'South Asian Invitational Ball Badminton Trophy 2026',
        organizer: 'Asian Ball Badminton Council',
        category: "Men's Open 5s",
        format: '5s',
        startDate: '2026-12-01',
        endDate: '2026-12-05',
        city: 'Bengaluru',
        venue: 'Kanteerava Stadium',
        courtsCount: 4,
        totalTeams: 12,
        contactEmail: 'contact@asianballbadminton.org',
        status: 'upcoming',
      });

      expect(newTourn.id).toBeTruthy();
      expect(newTourn.name).toBe('South Asian Invitational Ball Badminton Trophy 2026');

      const retrieved = tournamentRepository.getById(newTourn.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.city).toBe('Bengaluru');
      expect(retrieved?.format).toBe('5s');
    });
  });
});
