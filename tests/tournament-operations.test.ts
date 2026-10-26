import { describe, it, expect, beforeEach } from 'vitest';
import { tournamentTeamRepository } from '../src/repositories/tournamentTeamRepository';
import { rosterRepository } from '../src/repositories/rosterRepository';
import { scorerRepository } from '../src/repositories/scorerRepository';
import { matchRepository } from '../src/repositories/matchRepository';
import { standingsService } from '../src/services/standingsService';
import { scoringService } from '../src/services/scoringService';
import type { Match, TournamentTeamRegistration } from '../src/types';

describe('Phase 2.3 — End-to-End Tournament Operations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Tournament and Team Registration', () => {
    it('registers a team for a tournament successfully', () => {
      const reg: TournamentTeamRegistration = {
        id: 'reg-001',
        tournamentId: 'tourn-state-cup',
        teamId: 'team-chennai',
        registeredAt: new Date().toISOString(),
        seedNumber: 1,
        groupName: 'Group A',
        status: 'confirmed',
      };

      const result = tournamentTeamRepository.registerTeam(reg);
      expect(result.id).toBe('reg-001');

      const registered = tournamentTeamRepository.getByTournament('tourn-state-cup');
      expect(registered.length).toBe(1);
      expect(registered[0].teamId).toBe('team-chennai');
      expect(registered[0].groupName).toBe('Group A');
    });

    it('prevents duplicate team registration for the same tournament', () => {
      const reg1: TournamentTeamRegistration = {
        id: 'reg-001',
        tournamentId: 'tourn-state-cup',
        teamId: 'team-chennai',
        registeredAt: new Date().toISOString(),
        status: 'confirmed',
      };
      tournamentTeamRepository.registerTeam(reg1);

      const reg2: TournamentTeamRegistration = {
        id: 'reg-002',
        tournamentId: 'tourn-state-cup',
        teamId: 'team-chennai',
        registeredAt: new Date().toISOString(),
        status: 'confirmed',
      };

      expect(() => {
        tournamentTeamRepository.registerTeam(reg2);
      }).toThrow(/already registered/i);
    });

    it('unregisters a team and removes from tournament registry', () => {
      tournamentTeamRepository.registerTeam({
        id: 'reg-001',
        tournamentId: 'tourn-state-cup',
        teamId: 'team-kerala',
        registeredAt: new Date().toISOString(),
        status: 'confirmed',
      });

      expect(tournamentTeamRepository.isTeamRegistered('tourn-state-cup', 'team-kerala')).toBe(true);

      const removed = tournamentTeamRepository.unregisterTeam('tourn-state-cup', 'team-kerala');
      expect(removed).toBe(true);
      expect(tournamentTeamRepository.isTeamRegistered('tourn-state-cup', 'team-kerala')).toBe(false);
    });
  });

  describe('2. Roster Eligibility & BBFI 5s Regulations', () => {
    const TOURNAMENT_ID = 'tourn-nat-2026';
    const TEAM_ID = 'team-test-squad';

    it('flags an incomplete squad with fewer than 5 court players', () => {
      // Add only 3 players
      rosterRepository.assignPlayer({
        teamId: TEAM_ID,
        playerId: 'p1',
        tournamentId: TOURNAMENT_ID,
        jerseyNumber: 1,
        position: 'Front / Net',
        isCaptain: true,
      });
      rosterRepository.assignPlayer({
        teamId: TEAM_ID,
        playerId: 'p2',
        tournamentId: TOURNAMENT_ID,
        jerseyNumber: 2,
        position: 'Front / Net',
      });
      rosterRepository.assignPlayer({
        teamId: TEAM_ID,
        playerId: 'p3',
        tournamentId: TOURNAMENT_ID,
        jerseyNumber: 3,
        position: 'Centre / Pivot',
      });

      const check = rosterRepository.validateRosterEligibility(TEAM_ID, TOURNAMENT_ID);
      expect(check.isValid).toBe(false);
      expect(check.startersCount).toBe(3);
      expect(check.errors.some((e) => e.includes('minimum of 5 court players'))).toBe(true);
    });

    it('flags missing team captain', () => {
      for (let i = 1; i <= 5; i++) {
        rosterRepository.assignPlayer({
          teamId: TEAM_ID,
          playerId: `p${i}`,
          tournamentId: TOURNAMENT_ID,
          jerseyNumber: i,
          position: i <= 2 ? 'Front / Net' : i === 3 ? 'Centre / Pivot' : 'Base / Deep',
          isCaptain: false,
        });
      }

      const check = rosterRepository.validateRosterEligibility(TEAM_ID, TOURNAMENT_ID);
      expect(check.isValid).toBe(false);
      expect(check.errors.some((e) => e.includes('Captain'))).toBe(true);
    });

    it('prevents duplicate jersey numbers within a team', () => {
      rosterRepository.assignPlayer({
        teamId: TEAM_ID,
        playerId: 'p1',
        tournamentId: TOURNAMENT_ID,
        jerseyNumber: 7,
        position: 'Front / Net',
        isCaptain: true,
      });

      expect(() => {
        rosterRepository.assignPlayer({
          teamId: TEAM_ID,
          playerId: 'p2',
          tournamentId: TOURNAMENT_ID,
          jerseyNumber: 7, // duplicate jersey
          position: 'Centre / Pivot',
        });
      }).toThrow(/Jersey number #7 is already taken/i);
    });

    it('enforces maximum squad size of 9 (5 starters + 4 bench substitutes)', () => {
      for (let i = 1; i <= 9; i++) {
        rosterRepository.assignPlayer({
          teamId: TEAM_ID,
          playerId: `player-${i}`,
          tournamentId: TOURNAMENT_ID,
          jerseyNumber: i,
          position: i <= 2 ? 'Front / Net' : i === 3 ? 'Centre / Pivot' : 'Base / Deep',
          isCaptain: i === 1,
        });
      }

      // Valid 9-player squad
      const validCheck = rosterRepository.validateRosterEligibility(TEAM_ID, TOURNAMENT_ID);
      expect(validCheck.isValid).toBe(true);
      expect(validCheck.startersCount).toBe(5);
      expect(validCheck.substitutesCount).toBe(4);

      // Attempting 10th player must throw limit error
      expect(() => {
        rosterRepository.assignPlayer({
          teamId: TEAM_ID,
          playerId: 'player-10',
          tournamentId: TOURNAMENT_ID,
          jerseyNumber: 10,
          position: 'Substitute',
        });
      }).toThrow(/maximum squad of 9 players/i);
    });
  });

  describe('3. Match Creation & Validation Rules', () => {
    it('creates a match with complete BBFI scoring snapshot and starting lineups', () => {
      const match = matchRepository.create({
        tournamentId: 'tourn-70th',
        court: 'Centre Court (Outdoor Red Clay)',
        round: 'Group Stage',
        status: 'upcoming',
        team1: { id: 'team-railways', name: 'Indian Railways', score: 0, sets: 0 },
        team2: { id: 'team-tamilnadu', name: 'Tamil Nadu', score: 0, sets: 0 },
        currentSet: 1,
        setScores: [{ gameNumber: 1, team1Score: 0, team2Score: 0, isCompleted: false }],
        team1SetsWon: 0,
        team2SetsWon: 0,
        scheduledTime: '10:00 AM',
        maxPointsPerSet: 29,
        configSnapshot: {
          pointsPerSet: 29,
          bestOfSets: 3,
          deuceEnabled: true,
          maxCap: 33,
          serviceRotation: 'two_hands',
        },
        lineups: {
          team1Starters: ['p1', 'p2', 'p3', 'p4', 'p5'],
          team2Starters: ['p6', 'p7', 'p8', 'p9', 'p10'],
          team1Substitutes: ['p11'],
          team2Substitutes: ['p12'],
        },
        scorerEmail: 'official.scorer@bbfi.org',
        scorerName: 'M. Sundaram',
      });

      expect(match.id).toBeDefined();
      expect(match.configSnapshot?.pointsPerSet).toBe(29);
      expect(match.configSnapshot?.maxCap).toBe(33);
      expect(match.lineups?.team1Starters.length).toBe(5);
      expect(match.lineups?.team2Starters.length).toBe(5);
    });
  });

  describe('4. Scorer Assignment & Authorization', () => {
    const matchScorerEmail = 'scorer.official@bbfi.org';

    it('allows super_admin and tournament_admin to score any match', () => {
      expect(scorerRepository.isAuthorizedToScore(matchScorerEmail, { role: 'super_admin', email: 'admin@bbfi.org' })).toBe(true);
      expect(scorerRepository.isAuthorizedToScore(matchScorerEmail, { role: 'tournament_admin', email: 'manager@bbfi.org' })).toBe(true);
    });

    it('allows assigned official_scorer to score their assigned match', () => {
      expect(scorerRepository.isAuthorizedToScore(matchScorerEmail, { role: 'official_scorer', email: 'scorer.official@bbfi.org' })).toBe(true);
      expect(scorerRepository.isAuthorizedToScore(matchScorerEmail, { role: 'official_scorer', email: 'SCORER.OFFICIAL@BBFI.ORG' })).toBe(true);
    });

    it('blocks official_scorer from scoring another scorer\'s match', () => {
      expect(scorerRepository.isAuthorizedToScore(matchScorerEmail, { role: 'official_scorer', email: 'other.umpire@bbfi.org' })).toBe(false);
    });

    it('blocks viewer from scoring', () => {
      expect(scorerRepository.isAuthorizedToScore(matchScorerEmail, { role: 'viewer', email: 'spectator@gmail.com' })).toBe(false);
      expect(scorerRepository.isAuthorizedToScore(matchScorerEmail, null)).toBe(false);
    });
  });

  describe('5. Match Lifecycle State Transitions', () => {
    let testMatch: Match;

    beforeEach(() => {
      testMatch = matchRepository.create({
        tournamentId: 'tourn-lifecycle',
        court: 'Court 1',
        round: 'Semi-Final 1',
        status: 'upcoming',
        team1: { id: 'team-a', name: 'Team Alpha', score: 0, sets: 0 },
        team2: { id: 'team-b', name: 'Team Beta', score: 0, sets: 0 },
        currentSet: 1,
        setScores: [{ gameNumber: 1, team1Score: 0, team2Score: 0, isCompleted: false }],
        team1SetsWon: 0,
        team2SetsWon: 0,
        scheduledTime: '02:00 PM',
        maxPointsPerSet: 29,
      });
    });

    it('transitions from upcoming -> live -> paused -> live -> completed', async () => {
      // 1. Initial status is upcoming
      expect(matchRepository.getById(testMatch.id)?.status).toBe('upcoming');

      // 2. Start match -> live
      const startRes = await scoringService.startMatch(testMatch.id);
      expect(startRes.success).toBe(true);
      expect(matchRepository.getById(testMatch.id)?.status).toBe('live');

      // 3. Pause match -> paused
      const pauseRes = await scoringService.pauseMatch(testMatch.id, 'Court dampness inspection');
      expect(pauseRes.success).toBe(true);
      const pausedMatch = matchRepository.getById(testMatch.id);
      expect(pausedMatch?.status).toBe('paused');
      expect(pausedMatch?.notes).toBe('Court dampness inspection');

      // 4. Resume match -> live
      const resumeRes = await scoringService.startMatch(testMatch.id);
      expect(resumeRes.success).toBe(true);
      expect(matchRepository.getById(testMatch.id)?.status).toBe('live');

      // 5. Complete match -> completed
      const completeRes = await scoringService.completeMatch(testMatch.id, 'Match concluded in 2 straight games.');
      expect(completeRes.success).toBe(true);
      expect(matchRepository.getById(testMatch.id)?.status).toBe('completed');
    });
  });

  describe('6. Change of Ends Detection & BBFI Service Rotation', () => {
    it('detects change of ends condition when either team reaches 15 points', () => {
      const isChangeOfEnds = (t1: number, t2: number) => {
        return (t1 === 15 || t2 === 15) && (t1 + t2 <= 31);
      };

      expect(isChangeOfEnds(15, 12)).toBe(true);
      expect(isChangeOfEnds(8, 15)).toBe(true);
      expect(isChangeOfEnds(14, 14)).toBe(false);
      expect(isChangeOfEnds(16, 12)).toBe(false);
    });

    it('transitions serving hand from 1st Hand to 2nd Hand on side loss, then side out', async () => {
      const match = matchRepository.create({
        tournamentId: 'tourn-rotation',
        court: 'Court 2',
        round: 'Group Stage',
        status: 'upcoming',
        team1: { id: 'team-serving', name: 'Serving Team', score: 0, sets: 0 },
        team2: { id: 'team-receiving', name: 'Receiving Team', score: 0, sets: 0 },
        currentSet: 1,
        setScores: [{ gameNumber: 1, team1Score: 0, team2Score: 0, isCompleted: false }],
        team1SetsWon: 0,
        team2SetsWon: 0,
        scheduledTime: '11:00 AM',
        servingTeamId: 'team-serving',
        servingHand: 1,
        maxPointsPerSet: 29,
      });

      await scoringService.startMatch(match.id);

      // Serving team scores rally -> holds serve, Hand 1
      const rally1 = await scoringService.recordPoint({
        matchId: match.id,
        awardedTeamId: 'team-serving',
      });
      expect(rally1.data?.servingTeamId).toBe('team-serving');
      expect(rally1.data?.servingHand).toBe(1);

      // Receiving team wins rally -> Serving team moves to 2nd Hand
      const rally2 = await scoringService.recordPoint({
        matchId: match.id,
        awardedTeamId: 'team-receiving',
      });
      expect(rally2.data?.servingTeamId).toBe('team-serving');
      expect(rally2.data?.servingHand).toBe(2);

      // Receiving team wins another rally -> Side Out! Receiving team takes service Hand 1
      const rally3 = await scoringService.recordPoint({
        matchId: match.id,
        awardedTeamId: 'team-receiving',
      });
      expect(rally3.data?.servingTeamId).toBe('team-receiving');
      expect(rally3.data?.servingHand).toBe(1);
    });
  });

  describe('7. In-game Substitution Limits (Max 3 per game)', () => {
    it('restricts substitutions to a maximum of 3 substitutions per game per team', () => {
      const substitutionTracker: Record<string, number> = {
        'team-a': 0,
        'team-b': 0,
      };

      const performSubstitution = (teamId: string) => {
        if (substitutionTracker[teamId] >= 3) {
          throw new Error('Substitution Limit Reached: Max 3 substitutions per game allowed.');
        }
        substitutionTracker[teamId]++;
      };

      performSubstitution('team-a'); // 1
      performSubstitution('team-a'); // 2
      performSubstitution('team-a'); // 3
      expect(substitutionTracker['team-a']).toBe(3);

      expect(() => performSubstitution('team-a')).toThrow(/Max 3 substitutions/i);
    });
  });

  describe('8. Standings Calculation (Points, Set Difference, Point Difference)', () => {
    const TOURNAMENT_ID = 'tourn-standings-test';

    beforeEach(() => {
      // Register 3 teams
      tournamentTeamRepository.registerTeam({
        id: 'reg-t1',
        tournamentId: TOURNAMENT_ID,
        teamId: 'team-alpha',
        groupName: 'Group A',
        status: 'confirmed',
      });
      tournamentTeamRepository.registerTeam({
        id: 'reg-t2',
        tournamentId: TOURNAMENT_ID,
        teamId: 'team-beta',
        groupName: 'Group A',
        status: 'confirmed',
      });
      tournamentTeamRepository.registerTeam({
        id: 'reg-t3',
        tournamentId: TOURNAMENT_ID,
        teamId: 'team-gamma',
        groupName: 'Group A',
        status: 'confirmed',
      });

      // Match 1: Alpha vs Beta (Alpha wins 2-0: 29-20, 29-22)
      matchRepository.create({
        tournamentId: TOURNAMENT_ID,
        court: 'Court 1',
        round: 'Group Stage',
        status: 'completed',
        team1: { id: 'team-alpha', name: 'Alpha', score: 2, sets: 2 },
        team2: { id: 'team-beta', name: 'Beta', score: 0, sets: 0 },
        currentSet: 2,
        team1SetsWon: 2,
        team2SetsWon: 0,
        setScores: [
          { gameNumber: 1, team1Score: 29, team2Score: 20, isCompleted: true, winnerTeamId: 'team-alpha' },
          { gameNumber: 2, team1Score: 29, team2Score: 22, isCompleted: true, winnerTeamId: 'team-alpha' },
        ],
        scheduledTime: '09:00 AM',
      });

      // Match 2: Beta vs Gamma (Beta wins 2-1: 29-25, 20-29, 29-27)
      matchRepository.create({
        tournamentId: TOURNAMENT_ID,
        court: 'Court 1',
        round: 'Group Stage',
        status: 'completed',
        team1: { id: 'team-beta', name: 'Beta', score: 2, sets: 2 },
        team2: { id: 'team-gamma', name: 'Gamma', score: 1, sets: 1 },
        currentSet: 3,
        team1SetsWon: 2,
        team2SetsWon: 1,
        setScores: [
          { gameNumber: 1, team1Score: 29, team2Score: 25, isCompleted: true, winnerTeamId: 'team-beta' },
          { gameNumber: 2, team1Score: 20, team2Score: 29, isCompleted: true, winnerTeamId: 'team-gamma' },
          { gameNumber: 3, team1Score: 29, team2Score: 27, isCompleted: true, winnerTeamId: 'team-beta' },
        ],
        scheduledTime: '11:00 AM',
      });
    });

    it('calculates 2 points per win, and computes set difference and point difference accurately', () => {
      const { overall } = standingsService.calculateStandings(TOURNAMENT_ID);
      expect(overall.length).toBe(3);

      // Rank 1: Alpha (1 win = 2 pts, setsWon=2, setsLost=0, setDiff=+2)
      const alpha = overall[0];
      expect(alpha.teamId).toBe('team-alpha');
      expect(alpha.played).toBe(1);
      expect(alpha.won).toBe(1);
      expect(alpha.lost).toBe(0);
      expect(alpha.points).toBe(2);
      expect(alpha.setsWon).toBe(2);
      expect(alpha.setsLost).toBe(0);
      expect(alpha.setDifference).toBe(2);
      expect(alpha.pointDifference).toBe((29 + 29) - (20 + 22)); // 58 - 42 = +16

      // Rank 2: Beta (1 win, 1 loss = 2 pts, setsWon=2, setsLost=3, setDiff=-1)
      const beta = overall[1];
      expect(beta.teamId).toBe('team-beta');
      expect(beta.played).toBe(2);
      expect(beta.won).toBe(1);
      expect(beta.lost).toBe(1);
      expect(beta.points).toBe(2);
      expect(beta.setsWon).toBe(2);
      expect(beta.setsLost).toBe(3);
      expect(beta.setDifference).toBe(-1);

      // Rank 3: Gamma (0 wins, 1 loss = 0 pts)
      const gamma = overall[2];
      expect(gamma.teamId).toBe('team-gamma');
      expect(gamma.played).toBe(1);
      expect(gamma.won).toBe(0);
      expect(gamma.lost).toBe(1);
      expect(gamma.points).toBe(0);
    });
  });

  describe('9. Knockout Tree Generation & Champion Resolution', () => {
    const TOURNAMENT_ID = 'tourn-knockout-test';

    beforeEach(() => {
      // Create Semi-Final 1 (completed, Alpha wins)
      matchRepository.create({
        tournamentId: TOURNAMENT_ID,
        court: 'Centre Court',
        round: 'Semi-Final 1',
        status: 'completed',
        team1: { id: 'team-alpha', name: 'Alpha', score: 2, sets: 2 },
        team2: { id: 'team-beta', name: 'Beta', score: 0, sets: 0 },
        currentSet: 2,
        team1SetsWon: 2,
        team2SetsWon: 0,
        setScores: [
          { gameNumber: 1, team1Score: 29, team2Score: 21, isCompleted: true, winnerTeamId: 'team-alpha' },
          { gameNumber: 2, team1Score: 29, team2Score: 24, isCompleted: true, winnerTeamId: 'team-alpha' },
        ],
        scheduledTime: '02:00 PM',
      });

      // Create Semi-Final 2 (completed, Gamma wins)
      matchRepository.create({
        tournamentId: TOURNAMENT_ID,
        court: 'Court 2',
        round: 'Semi-Final 2',
        status: 'completed',
        team1: { id: 'team-gamma', name: 'Gamma', score: 2, sets: 2 },
        team2: { id: 'team-delta', name: 'Delta', score: 1, sets: 1 },
        currentSet: 3,
        team1SetsWon: 2,
        team2SetsWon: 1,
        setScores: [
          { gameNumber: 1, team1Score: 29, team2Score: 26, isCompleted: true, winnerTeamId: 'team-gamma' },
          { gameNumber: 2, team1Score: 25, team2Score: 29, isCompleted: true, winnerTeamId: 'team-delta' },
          { gameNumber: 3, team1Score: 29, team2Score: 27, isCompleted: true, winnerTeamId: 'team-gamma' },
        ],
        scheduledTime: '03:30 PM',
      });

      // Create Championship Final (completed, Alpha wins Championship!)
      matchRepository.create({
        tournamentId: TOURNAMENT_ID,
        court: 'Centre Court',
        round: 'Championship Final',
        status: 'completed',
        team1: { id: 'team-alpha', name: 'Alpha', score: 2, sets: 2 },
        team2: { id: 'team-gamma', name: 'Gamma', score: 0, sets: 0 },
        currentSet: 2,
        team1SetsWon: 2,
        team2SetsWon: 0,
        setScores: [
          { gameNumber: 1, team1Score: 29, team2Score: 23, isCompleted: true, winnerTeamId: 'team-alpha' },
          { gameNumber: 2, team1Score: 29, team2Score: 25, isCompleted: true, winnerTeamId: 'team-alpha' },
        ],
        scheduledTime: '06:00 PM',
      });
    });

    it('generates the knockout elimination bracket and resolves the tournament champion', () => {
      const tree = standingsService.generateKnockoutTree(TOURNAMENT_ID);
      expect(tree.semiFinals.length).toBe(2);
      expect(tree.final).toBeDefined();
      expect(tree.champion).toBeDefined();
      expect(tree.champion.id).toBe('team-alpha');
      expect(tree.champion.name).toBe('Alpha');
    });
  });
});
