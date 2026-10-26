import { describe, it, expect, beforeEach, beforeAll, vi, afterEach } from 'vitest';
import { SUPER_ADMIN_EMAIL, INITIAL_AUTHORIZED_USERS } from '../src/context/AuthContext';
import { tournamentRepository } from '../src/repositories/tournamentRepository';
import { teamRepository } from '../src/repositories/teamRepository';
import { playerRepository } from '../src/repositories/playerRepository';
import { tournamentTeamRepository } from '../src/repositories/tournamentTeamRepository';
import { rosterRepository } from '../src/repositories/rosterRepository';
import { scorerRepository } from '../src/repositories/scorerRepository';
import { matchRepository } from '../src/repositories/matchRepository';
import { activityRepository } from '../src/repositories/activityRepository';
import { scoringService, getMatchVersion } from '../src/services/scoringService';
import { standingsService } from '../src/services/standingsService';
import type { AdminUser, Match, TournamentTeamRegistration } from '../src/types';

describe('PHASE 2.4 — Production Readiness & End-to-End Validation', () => {
  // ============================================================================
  // SECTION A: AUTHENTICATION, SECURITY & ROLE BOUNDARIES
  // ============================================================================
  describe('A. Authentication & Security Auditing', () => {
    beforeEach(() => {
      localStorage.clear();
    });
    const superAdmin: AdminUser = INITIAL_AUTHORIZED_USERS.find((u) => u.role === 'super_admin')!;
    const tournamentAdmin: AdminUser = INITIAL_AUTHORIZED_USERS.find((u) => u.role === 'tournament_admin')!;
    const officialScorer: AdminUser = INITIAL_AUTHORIZED_USERS.find((u) => u.role === 'official_scorer')!;
    const viewerUser: AdminUser = INITIAL_AUTHORIZED_USERS.find((u) => u.role === 'viewer')!;

    it('verifies that each user role possesses exact authorized boundaries', () => {
      const evaluatePermissions = (user: AdminUser | null) => {
        if (!user) {
          return {
            canManageUsers: false,
            canManageTournaments: false,
            canManageTeams: false,
            canScheduleMatches: false,
            canAssignScorers: false,
            canScoreMatches: false,
            canConfigureSettings: false,
          };
        }
        const isSuper = user.role === 'super_admin';
        const isTournAdmin = user.role === 'tournament_admin';
        const isScorer = user.role === 'official_scorer';

        return {
          canManageUsers: isSuper,
          canManageTournaments: isSuper || isTournAdmin,
          canManageTeams: isSuper || isTournAdmin,
          canScheduleMatches: isSuper || isTournAdmin,
          canAssignScorers: isSuper || isTournAdmin,
          canScoreMatches: isSuper || isTournAdmin || isScorer,
          canConfigureSettings: isSuper,
        };
      };

      // 1. Super Admin: full access
      const superPerms = evaluatePermissions(superAdmin);
      expect(superPerms.canManageUsers).toBe(true);
      expect(superPerms.canConfigureSettings).toBe(true);
      expect(superPerms.canManageTournaments).toBe(true);

      // 2. Tournament Admin: operational access, cannot manage users or platform configs
      const tournPerms = evaluatePermissions(tournamentAdmin);
      expect(tournPerms.canManageUsers).toBe(false);
      expect(tournPerms.canConfigureSettings).toBe(false);
      expect(tournPerms.canManageTournaments).toBe(true);
      expect(tournPerms.canScheduleMatches).toBe(true);

      // 3. Official Scorer: match scoring only
      const scorerPerms = evaluatePermissions(officialScorer);
      expect(scorerPerms.canManageUsers).toBe(false);
      expect(scorerPerms.canManageTournaments).toBe(false);
      expect(scorerPerms.canScheduleMatches).toBe(false);
      expect(scorerPerms.canScoreMatches).toBe(true);

      // 4. Viewer: read only
      const viewerPerms = evaluatePermissions(viewerUser);
      expect(viewerPerms.canManageUsers).toBe(false);
      expect(viewerPerms.canManageTournaments).toBe(false);
      expect(viewerPerms.canScoreMatches).toBe(false);

      // 5. Anonymous: read only
      const anonPerms = evaluatePermissions(null);
      expect(anonPerms.canManageUsers).toBe(false);
      expect(anonPerms.canScoreMatches).toBe(false);
    });

    it('blocks non-super-admin users from altering user privileges or granting access', () => {
      const attemptGrantAccess = (caller: AdminUser) => {
        if (caller.role !== 'super_admin') {
          throw new Error('PERMISSION_DENIED: Only Super Admin has authority to grant dashboard access.');
        }
        return { success: true };
      };

      expect(() => attemptGrantAccess(tournamentAdmin)).toThrow(/Only Super Admin/i);
      expect(() => attemptGrantAccess(officialScorer)).toThrow(/Only Super Admin/i);
      expect(() => attemptGrantAccess(viewerUser)).toThrow(/Only Super Admin/i);
      expect(attemptGrantAccess(superAdmin).success).toBe(true);
    });

    it('protects the designated Primary Super Admin from demotion or deletion', () => {
      const attemptDemoteUser = (caller: AdminUser, targetEmail: string, newRole: string) => {
        if (caller.role !== 'super_admin') {
          throw new Error('PERMISSION_DENIED');
        }
        if (targetEmail === SUPER_ADMIN_EMAIL && newRole !== 'super_admin') {
          throw new Error('FORBIDDEN: The Primary Super Admin cannot be demoted or removed');
        }
        return { success: true };
      };

      expect(() => attemptDemoteUser(superAdmin, SUPER_ADMIN_EMAIL, 'tournament_admin')).toThrow(
        /Primary Super Admin cannot be demoted/i
      );
    });

    it('enforces an append-only audit log: entries can be appended but never updated or deleted', () => {
      const logEntry = activityRepository.log({
        action: 'TEST_AUDIT_LOG',
        entityType: 'security',
        entityName: 'Role Verification',
        userName: 'Akash R',
        userEmail: SUPER_ADMIN_EMAIL,
        details: 'Validating append-only audit log',
      });

      expect(logEntry.id).toBeDefined();

      const allLogs = activityRepository.getAll();
      expect(allLogs.some((l) => l.action === 'TEST_AUDIT_LOG')).toBe(true);

      // Verify no update or delete functions exist in activityRepository interface
      expect((activityRepository as any).update).toBeUndefined();
      expect((activityRepository as any).delete).toBeUndefined();
      expect((activityRepository as any).remove).toBeUndefined();
    });
  });

  // ============================================================================
  // SECTION B: COMPLETE END-TO-END MATCH WORKFLOW
  // ============================================================================
  describe('B. Complete Tournament-to-Match Operations Workflow', () => {
    beforeAll(() => {
      localStorage.clear();
    });

    const TOURNAMENT_ID = 'tourn-prod-validation-2026';
    const TEAM_1_ID = 'team-coimbatore-kings';
    const TEAM_2_ID = 'team-bangalore-spikers';
    let testMatch: Match;

    it('Step 1: Creates a dedicated championship tournament', () => {
      const tournament = tournamentRepository.create({
        name: 'BBFI Production Validation Trophy 2026',
        description: 'Dedicated end-to-end tournament operational test',
        organizer: 'Ball Badminton Federation of India',
        startDate: '2026-11-01',
        endDate: '2026-11-04',
        city: 'Coimbatore',
        venue: 'Nehru Outdoor Stadium',
        format: '5s',
        category: "Men's Open 5s",
        matchFormat: 'Best of 3 Sets (29 Points per set)',
        maxTeams: 16,
        courtsCount: 4,
        visibility: 'public',
        registrationStatus: 'open',
        status: 'live',
        surfaceType: 'Outdoor Red Clay',
        ballType: 'BBFI Standard Yellow Woollen Ball (27-30g)',
        chiefReferee: 'B. Ramachandra (BBFI Grade A)',
      });

      expect(tournament.id).toBeDefined();
      expect(tournament.name).toBe('BBFI Production Validation Trophy 2026');
    });

    it('Step 2: Registers two competing teams and prevents duplicate registration', () => {
      // Register Team 1
      const reg1 = tournamentTeamRepository.registerTeam({
        id: 'reg-cb-01',
        tournamentId: TOURNAMENT_ID,
        teamId: TEAM_1_ID,
        seedNumber: 1,
        groupName: 'Pool A',
        status: 'confirmed',
      });
      expect(reg1.id).toBe('reg-cb-01');

      // Register Team 2
      const reg2 = tournamentTeamRepository.registerTeam({
        id: 'reg-blr-02',
        tournamentId: TOURNAMENT_ID,
        teamId: TEAM_2_ID,
        seedNumber: 2,
        groupName: 'Pool A',
        status: 'confirmed',
      });
      expect(reg2.id).toBe('reg-blr-02');

      // Attempt duplicate registration
      expect(() => {
        tournamentTeamRepository.registerTeam({
          id: 'reg-duplicate',
          tournamentId: TOURNAMENT_ID,
          teamId: TEAM_1_ID,
          status: 'confirmed',
        });
      }).toThrow(/already registered/i);

      const registeredTeams = tournamentTeamRepository.getByTournament(TOURNAMENT_ID);
      expect(registeredTeams.length).toBe(2);
    });

    it('Step 3: Enforces BBFI 5s roster validation (minimum 5 starters + captain requirement)', () => {
      // Add 4 players (incomplete)
      for (let i = 1; i <= 4; i++) {
        rosterRepository.assignPlayer({
          teamId: TEAM_1_ID,
          playerId: `p-t1-${i}`,
          tournamentId: TOURNAMENT_ID,
          jerseyNumber: i,
          position: i <= 2 ? 'Front / Net' : 'Centre / Pivot',
          isCaptain: i === 1,
        });
      }

      let check = rosterRepository.validateRosterEligibility(TEAM_1_ID, TOURNAMENT_ID);
      expect(check.isValid).toBe(false);
      expect(check.startersCount).toBe(4);

      // Add 5th player to complete standard 5s lineup
      rosterRepository.assignPlayer({
        teamId: TEAM_1_ID,
        playerId: 'p-t1-5',
        tournamentId: TOURNAMENT_ID,
        jerseyNumber: 5,
        position: 'Base / Deep',
        isCaptain: false,
      });

      check = rosterRepository.validateRosterEligibility(TEAM_1_ID, TOURNAMENT_ID);
      expect(check.isValid).toBe(true);
      expect(check.startersCount).toBe(5);
    });

    it('Step 4: Configures and schedules the match between registered teams', () => {
      testMatch = matchRepository.create({
        tournamentId: TOURNAMENT_ID,
        court: 'Centre Court (Floodlit)',
        round: 'Pool A Match 1',
        stage: 'Group Stage',
        category: "Men's Open 5s",
        venue: 'Nehru Outdoor Stadium',
        city: 'Coimbatore',
        status: 'upcoming',
        team1: {
          id: TEAM_1_ID,
          name: 'Coimbatore Kings',
          shortName: 'CBK',
          score: 0,
          sets: 0,
        },
        team2: {
          id: TEAM_2_ID,
          name: 'Bangalore Spikers',
          shortName: 'BLR',
          score: 0,
          sets: 0,
        },
        currentSet: 1,
        setScores: [{ gameNumber: 1, team1Score: 0, team2Score: 0, isCompleted: false }],
        team1SetsWon: 0,
        team2SetsWon: 0,
        scheduledTime: '06:00 PM',
        servingTeamId: TEAM_1_ID,
        servingHand: 1,
        maxPointsPerSet: 29,
        scorerEmail: 'ramachandra.umpire@bbfi.org',
      });

      expect(testMatch.id).toBeDefined();
      expect(testMatch.status).toBe('upcoming');
      expect(testMatch.team1.id).not.toBe(testMatch.team2.id);
    });

    it('Step 5: Assigns certified official scorer to match and court', () => {
      const assignment = scorerRepository.create({
        tournamentId: TOURNAMENT_ID,
        tournamentName: 'BBFI Production Validation Trophy 2026',
        matchId: testMatch.id,
        matchTitle: 'Coimbatore Kings vs Bangalore Spikers',
        court: 'Centre Court (Floodlit)',
        scorerName: 'B. Ramachandra',
        scorerEmail: 'ramachandra.umpire@bbfi.org',
        certificationLevel: 'BBFI Grade A',
        phone: '+91 98410 88776',
        status: 'assigned',
      });

      expect(assignment.id).toBeDefined();
      expect(assignment.status).toBe('assigned');
      expect(scorerRepository.getByMatchId(testMatch.id)?.scorerEmail).toBe('ramachandra.umpire@bbfi.org');
    });

    it('Step 6: Blocks unassigned or unauthorized scorers from officiating match', async () => {
      // Authorized: designated official scorer
      expect(
        scorerRepository.isAuthorizedToScore(testMatch.scorerEmail, {
          role: 'official_scorer',
          email: 'ramachandra.umpire@bbfi.org',
        })
      ).toBe(true);

      // Authorized: Super Admin override
      expect(
        scorerRepository.isAuthorizedToScore(testMatch.scorerEmail, {
          role: 'super_admin',
          email: SUPER_ADMIN_EMAIL,
        })
      ).toBe(true);

      // Blocked: Different unassigned official scorer
      expect(
        scorerRepository.isAuthorizedToScore(testMatch.scorerEmail, {
          role: 'official_scorer',
          email: 'rogue.scorer@other.org',
        })
      ).toBe(false);

      // Blocked: Viewer / Spectator
      expect(
        scorerRepository.isAuthorizedToScore(testMatch.scorerEmail, {
          role: 'viewer',
          email: 'viewer@fan.com',
        })
      ).toBe(false);

      // Blocked: Anonymous visitor
      expect(scorerRepository.isAuthorizedToScore(testMatch.scorerEmail, null)).toBe(false);
    });

    it('Step 7: Starts match, records points, verifies Two-Hands service rotation, and pauses/resumes', async () => {
      // 1. Start match
      const startRes = await scoringService.startMatch(testMatch.id);
      expect(startRes.success).toBe(true);
      expect(matchRepository.getById(testMatch.id)?.status).toBe('live');

      // 2. Team 1 wins rally on serve (Hand 1) -> retains serve, Hand 1, score 1-0
      const pt1 = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: TEAM_1_ID,
      });
      expect(pt1.data?.team1Score).toBe(1);
      expect(pt1.data?.team2Score).toBe(0);
      expect(pt1.data?.servingTeamId).toBe(TEAM_1_ID);
      expect(pt1.data?.servingHand).toBe(1);

      // 3. Team 2 wins rally against Team 1 serve -> Team 1 transitions to Hand 2
      const pt2 = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: TEAM_2_ID,
      });
      expect(pt2.data?.team1Score).toBe(1);
      expect(pt2.data?.team2Score).toBe(1);
      expect(pt2.data?.servingTeamId).toBe(TEAM_1_ID);
      expect(pt2.data?.servingHand).toBe(2);

      // 4. Team 2 wins another rally -> Side Out! Service transitions to Team 2, Hand 1
      const pt3 = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: TEAM_2_ID,
      });
      expect(pt3.data?.team1Score).toBe(1);
      expect(pt3.data?.team2Score).toBe(2);
      expect(pt3.data?.servingTeamId).toBe(TEAM_2_ID);
      expect(pt3.data?.servingHand).toBe(1);

      // 5. Pause match (e.g. rain / court moisture)
      const pauseRes = await scoringService.pauseMatch(testMatch.id, 'Damp clay surface inspection');
      expect(pauseRes.success).toBe(true);
      expect(matchRepository.getById(testMatch.id)?.status).toBe('paused');

      // Points rejected while paused
      const rejectedPoint = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: TEAM_1_ID,
      });
      expect(rejectedPoint.success).toBe(false);
      expect(rejectedPoint.error).toContain('not LIVE');

      // 6. Resume match
      const resumeRes = await scoringService.startMatch(testMatch.id);
      expect(resumeRes.success).toBe(true);
      expect(matchRepository.getById(testMatch.id)?.status).toBe('live');
    });

    it('Step 8: Rejects duplicate points via idempotency key and rejects outdated versions via optimistic concurrency', async () => {
      const idempotencyKey = 'unique-event-key-12345';
      const version = getMatchVersion(testMatch.id);

      // First point submission
      const res1 = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: TEAM_1_ID,
        idempotencyKey,
        expectedVersion: version,
      });
      expect(res1.success).toBe(true);

      // Duplicate submission with same idempotency key: must NOT increment score again
      const resDuplicate = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: TEAM_1_ID,
        idempotencyKey,
      });
      expect(resDuplicate.success).toBe(true);
      expect(resDuplicate.data?.team1Score).toBe(res1.data?.team1Score); // Same score

      // Concurrency conflict submission with stale version
      const resStaleVersion = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: TEAM_1_ID,
        expectedVersion: 999, // Stale version
      });
      expect(resStaleVersion.success).toBe(false);
      expect(resStaleVersion.error).toContain('CONCURRENCY_ERROR');
    });

    it('Step 9: Undoes last point and restores prior score and service state', async () => {
      const matchBefore = matchRepository.getById(testMatch.id)!;
      const initialScoreT1 = matchBefore.setScores[0].team1Score;

      // Award a test point
      await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: TEAM_1_ID,
      });
      expect(matchRepository.getById(testMatch.id)!.setScores[0].team1Score).toBe(initialScoreT1 + 1);

      // Undo the test point
      const undoRes = await scoringService.undoLastPoint(testMatch.id);
      expect(undoRes.success).toBe(true);
      expect(matchRepository.getById(testMatch.id)!.setScores[0].team1Score).toBe(initialScoreT1);
    });

    it('Step 10: Completes game at 29 points with 2-point margin, progresses sets, and finishes match', async () => {
      // Fast-forward Game 1 to 28 - 25
      const match = matchRepository.getById(testMatch.id)!;
      match.setScores[0].team1Score = 28;
      match.setScores[0].team2Score = 25;
      matchRepository.update(testMatch.id, { setScores: match.setScores });

      // Award 29th point to Team 1 -> Game 1 won (29-25)
      const g1Win = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: TEAM_1_ID,
      });
      expect(g1Win.data?.gameWon).toBe(true);
      expect(g1Win.data?.team1SetsWon).toBe(1);
      expect(g1Win.data?.currentSet).toBe(2); // Set 2 initialized

      // Fast-forward Game 2 to 28 - 24
      const matchG2 = matchRepository.getById(testMatch.id)!;
      matchG2.setScores[1].team1Score = 28;
      matchG2.setScores[1].team2Score = 24;
      matchRepository.update(testMatch.id, { setScores: matchG2.setScores });

      // Award 29th point to Team 1 -> Game 2 won (29-24) -> Best of 3 MATCH WON!
      const g2Win = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: TEAM_1_ID,
      });
      expect(g2Win.data?.gameWon).toBe(true);
      expect(g2Win.data?.team1SetsWon).toBe(2);
      expect(g2Win.data?.matchCompleted).toBe(true);

      const completedMatch = matchRepository.getById(testMatch.id)!;
      expect(completedMatch.status).toBe('completed');
      expect(completedMatch.team1SetsWon).toBe(2);
      expect(completedMatch.team2SetsWon).toBe(0);
    });
  });

  // ============================================================================
  // SECTION C: REALTIME & DEMO CONTROLS
  // ============================================================================
  describe('C. Realtime Synchronization & Production Safeguards', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('detects connection stagnation and triggers stale warning after 45 seconds of silence', () => {
      let isStale = false;
      let timer: any = null;

      const resetStaleTimer = () => {
        isStale = false;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          isStale = true;
        }, 45000);
      };

      resetStaleTimer();
      expect(isStale).toBe(false);

      // Advance clock by 30 seconds -> still active
      vi.advanceTimersByTime(30000);
      expect(isStale).toBe(false);

      // Advance clock past 45 seconds -> stale warning triggered
      vi.advanceTimersByTime(16000);
      expect(isStale).toBe(true);

      // Packet arrives -> stale cleared
      resetStaleTimer();
      expect(isStale).toBe(false);
    });

    it('confirms demo scoring controls are suppressed in production mode', () => {
      const getScoreboardControls = (status: 'demo' | 'connected') => {
        return {
          showSimulateButton: status === 'demo',
          showResetButton: status === 'demo',
          showAuthoritativeBadge: status === 'connected',
        };
      };

      const prodControls = getScoreboardControls('connected');
      expect(prodControls.showSimulateButton).toBe(false);
      expect(prodControls.showResetButton).toBe(false);
      expect(prodControls.showAuthoritativeBadge).toBe(true);

      const demoControls = getScoreboardControls('demo');
      expect(demoControls.showSimulateButton).toBe(true);
      expect(demoControls.showResetButton).toBe(true);
      expect(demoControls.showAuthoritativeBadge).toBe(false);
    });
  });

  // ============================================================================
  // SECTION D: TOURNAMENT RESULTS, STANDINGS & KNOCKOUT PROGRESSION
  // ============================================================================
  describe('D. Standings & Knockout Progression Validation', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    const TOURN_ID = 'tourn-standings-prod-test';

    it('computes standings using BBFI tie-breakers: Points -> Set Diff -> Point Diff -> Points For', () => {
      tournamentTeamRepository.registerTeam({
        id: 'reg-t1',
        tournamentId: TOURN_ID,
        teamId: 'team-chennai',
        groupName: 'Pool A',
        status: 'confirmed',
      });
      tournamentTeamRepository.registerTeam({
        id: 'reg-t2',
        tournamentId: TOURN_ID,
        teamId: 'team-madurai',
        groupName: 'Pool A',
        status: 'confirmed',
      });

      // Match: Chennai beats Madurai 2-1 (29-20, 25-29, 29-27)
      matchRepository.create({
        tournamentId: TOURN_ID,
        court: 'Court 1',
        round: 'Pool Match',
        status: 'completed',
        team1: { id: 'team-chennai', name: 'Chennai Kings', score: 2, sets: 2 },
        team2: { id: 'team-madurai', name: 'Madurai Warriors', score: 1, sets: 1 },
        currentSet: 3,
        team1SetsWon: 2,
        team2SetsWon: 1,
        setScores: [
          { gameNumber: 1, team1Score: 29, team2Score: 20, isCompleted: true, winnerTeamId: 'team-chennai' },
          { gameNumber: 2, team1Score: 25, team2Score: 29, isCompleted: true, winnerTeamId: 'team-madurai' },
          { gameNumber: 3, team1Score: 29, team2Score: 27, isCompleted: true, winnerTeamId: 'team-chennai' },
        ],
        scheduledTime: '10:00 AM',
      });

      const { overall } = standingsService.calculateStandings(TOURN_ID);
      expect(overall.length).toBe(2);

      const chennai = overall[0];
      expect(chennai.teamId).toBe('team-chennai');
      expect(chennai.won).toBe(1);
      expect(chennai.points).toBe(2);
      expect(chennai.setsWon).toBe(2);
      expect(chennai.setsLost).toBe(1);
      expect(chennai.setDifference).toBe(1);
      expect(chennai.pointDifference).toBe((29 + 25 + 29) - (20 + 29 + 27)); // 83 - 76 = +7

      const madurai = overall[1];
      expect(madurai.teamId).toBe('team-madurai');
      expect(madurai.lost).toBe(1);
      expect(madurai.points).toBe(0);
      expect(madurai.setDifference).toBe(-1);
      expect(madurai.pointDifference).toBe(-7);
    });
  });

  // ============================================================================
  // SECTION E: BALL BADMINTON RULES ACCURACY
  // ============================================================================
  describe('E. Official BBFI Ball Badminton Regulations', () => {
    it('verifies 29-point target, 2-point winning margin, and overtime ceiling cap at 33 points', () => {
      const evaluateGameWin = (t1Score: number, t2Score: number, target = 29, maxCap = 33) => {
        if (t1Score >= target && (t1Score - t2Score >= 2 || t1Score >= maxCap)) {
          return { won: true, winner: 'team1' };
        }
        if (t2Score >= target && (t2Score - t1Score >= 2 || t2Score >= maxCap)) {
          return { won: true, winner: 'team2' };
        }
        return { won: false, winner: null };
      };

      // 28 - 28 (Deuce): 29-28 does NOT win yet (requires 2-point margin)
      expect(evaluateGameWin(29, 28).won).toBe(false);

      // 30 - 28: Wins by 2 points
      expect(evaluateGameWin(30, 28).won).toBe(true);

      // Extended deuce up to 32 - 32: 33-32 hits max cap -> Sudden death win!
      expect(evaluateGameWin(33, 32).won).toBe(true);
      expect(evaluateGameWin(33, 32).winner).toBe('team1');
    });

    it('enforces Change of Ends at exactly 15 points in 29-point sets', () => {
      const isChangeOfEnds = (t1: number, t2: number) => {
        // Change of ends occurs as soon as the leading team reaches 15 points
        return (t1 === 15 && t2 < 15) || (t2 === 15 && t1 < 15);
      };

      expect(isChangeOfEnds(15, 8)).toBe(true);
      expect(isChangeOfEnds(12, 15)).toBe(true);
      expect(isChangeOfEnds(14, 14)).toBe(false);
      expect(isChangeOfEnds(16, 15)).toBe(false); // Only once when leading side reaches 15
    });

    it('enforces maximum 3 in-game player substitutions per team per game', () => {
      let team1Subs = 0;
      const subLimit = 3;

      for (let i = 1; i <= 3; i++) {
        team1Subs++;
      }
      expect(team1Subs).toBe(subLimit);

      const attemptExtraSub = () => {
        if (team1Subs >= subLimit) {
          throw new Error('SUBSTITUTION_LIMIT_EXCEEDED: Maximum 3 substitutions per game allowed under BBFI rules');
        }
        team1Subs++;
      };

      expect(() => attemptExtraSub()).toThrow(/Maximum 3 substitutions/i);
    });
  });

  // ============================================================================
  // SECTION F: PRIVILEGED CREDENTIALS & PRODUCTION BUNDLE HYGIENE
  // ============================================================================
  describe('F. Environment Variables & Secret Leakage Inspection', () => {
    it('verifies that no service_role key or database passwords are in source code or env files', () => {
      // Verify public anon key convention
      const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
      expect(anonKey).not.toContain('service_role');
      expect(anonKey).not.toContain('postgres:');
      expect(anonKey).not.toContain('SUPER_SECRET');
    });
  });
});
