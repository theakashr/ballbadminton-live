import { describe, it, expect, beforeEach } from 'vitest';
import { scoringService, getMatchVersion } from '../src/services/scoringService';
import { matchRepository } from '../src/repositories/matchRepository';
import type { Match } from '../src/types';

describe('Scoring Integrity Engine & Ball Badminton Rules', () => {
  let testMatch: Match;

  beforeEach(() => {
    localStorage.clear();
    testMatch = matchRepository.create({
      tournamentId: 'tourn-70th-senior',
      court: 'Center Court',
      round: 'Final',
      status: 'upcoming',
      team1: { id: 'team-railways', name: 'Indian Railways', score: 0, sets: 0 },
      team2: { id: 'team-tamilnadu', name: 'Tamil Nadu', score: 0, sets: 0 },
      currentSet: 1,
      setScores: [{ gameNumber: 1, team1Score: 0, team2Score: 0, isCompleted: false }],
      team1SetsWon: 0,
      team2SetsWon: 0,
      scheduledTime: '04:00 PM',
      servingTeamId: 'team-railways',
      servingHand: 1,
      maxPointsPerSet: 29,
    });
  });

  describe('Match Lifecycle Transitions', () => {
    it('initializes match to live status and snapshots Game 1 on startMatch', async () => {
      const res = await scoringService.startMatch(testMatch.id);
      expect(res.success).toBe(true);

      const updated = matchRepository.getById(testMatch.id);
      expect(updated?.status).toBe('live');
      expect(updated?.currentSet).toBe(1);
      expect(updated?.setScores[0].team1Score).toBe(0);
      expect(updated?.setScores[0].team2Score).toBe(0);
    });

    it('rejects points on matches that are not in live status', async () => {
      // Match is still upcoming
      const res = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team1.id,
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain('not LIVE');
    });

    it('can pause and complete a match', async () => {
      await scoringService.startMatch(testMatch.id);
      
      const pauseRes = await scoringService.pauseMatch(testMatch.id, 'Rain delay / Court dampness');
      expect(pauseRes.success).toBe(true);
      expect(matchRepository.getById(testMatch.id)?.status).toBe('paused');

      const completeRes = await scoringService.completeMatch(testMatch.id, 'Official closure');
      expect(completeRes.success).toBe(true);
      expect(matchRepository.getById(testMatch.id)?.status).toBe('completed');
    });
  });

  describe('Ball Badminton 29-Point Scoring & Deuce Rules', () => {
    beforeEach(async () => {
      await scoringService.startMatch(testMatch.id);
    });

    it('awards rally points and tracks scores accurately', async () => {
      const res = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team1.id,
      });
      expect(res.success).toBe(true);
      expect(res.data?.team1Score).toBe(1);
      expect(res.data?.team2Score).toBe(0);
    });

    it('awards set win at 29 points with a 2-point margin', async () => {
      // Setup score at 28 - 26
      matchRepository.update(testMatch.id, {
        setScores: [{ gameNumber: 1, team1Score: 28, team2Score: 26, isCompleted: false }],
      });

      const res = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team1.id,
      });

      expect(res.success).toBe(true);
      expect(res.data?.team1Score).toBe(29);
      expect(res.data?.gameWon).toBe(true);
      expect(res.data?.team1SetsWon).toBe(1);
      expect(res.data?.currentSet).toBe(2);
    });

    it('enforces deuce continuation: 29-28 does NOT win the game (requires 2-point lead)', async () => {
      matchRepository.update(testMatch.id, {
        setScores: [{ gameNumber: 1, team1Score: 28, team2Score: 28, isCompleted: false }],
      });

      // Team 1 scores -> 29 - 28
      const res = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team1.id,
      });

      expect(res.success).toBe(true);
      expect(res.data?.team1Score).toBe(29);
      expect(res.data?.team2Score).toBe(28);
      expect(res.data?.gameWon).toBe(false); // Not won because margin is only 1 point
    });

    it('wins at 30-28 when 2-point lead is established in deuce', async () => {
      matchRepository.update(testMatch.id, {
        setScores: [{ gameNumber: 1, team1Score: 29, team2Score: 28, isCompleted: false }],
      });

      const res = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team1.id,
      });

      expect(res.success).toBe(true);
      expect(res.data?.team1Score).toBe(30);
      expect(res.data?.gameWon).toBe(true);
    });

    it('enforces sudden death maximum cap at 33 points (target + 4)', async () => {
      // Deuce continues up to 32 - 32
      matchRepository.update(testMatch.id, {
        setScores: [{ gameNumber: 1, team1Score: 32, team2Score: 32, isCompleted: false }],
      });

      // Team 1 scores the 33rd point -> wins immediately despite only 1 point lead
      const res = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team1.id,
      });

      expect(res.success).toBe(true);
      expect(res.data?.team1Score).toBe(33);
      expect(res.data?.gameWon).toBe(true);
      expect(res.data?.team1SetsWon).toBe(1);
    });
  });

  describe('Two-Hands Service Rotation Mechanics', () => {
    beforeEach(async () => {
      await scoringService.startMatch(testMatch.id);
      matchRepository.update(testMatch.id, {
        servingTeamId: testMatch.team1.id,
        servingHand: 1,
      });
    });

    it('serving team retains Hand 1 when they win the rally', async () => {
      const res = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team1.id, // Server wins
      });

      expect(res.success).toBe(true);
      expect(res.data?.servingTeamId).toBe(testMatch.team1.id);
      expect(res.data?.servingHand).toBe(1);
    });

    it('serving team rotates from Hand 1 to Hand 2 when receiving team wins rally', async () => {
      const res = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team2.id, // Opponent wins rally
      });

      expect(res.success).toBe(true);
      expect(res.data?.servingTeamId).toBe(testMatch.team1.id); // Same serving team
      expect(res.data?.servingHand).toBe(2); // Rotated to 2nd hand
    });

    it('serving team on Hand 2 loses rally -> Side-out to opponent team on Hand 1', async () => {
      // Setup server on Hand 2
      matchRepository.update(testMatch.id, {
        servingTeamId: testMatch.team1.id,
        servingHand: 2,
      });

      const res = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team2.id, // Server loses rally on 2nd hand
      });

      expect(res.success).toBe(true);
      expect(res.data?.servingTeamId).toBe(testMatch.team2.id); // Transferred to team 2
      expect(res.data?.servingHand).toBe(1); // Reset to 1st hand
    });
  });

  describe('Optimistic Concurrency & Idempotency Safeguards', () => {
    beforeEach(async () => {
      await scoringService.startMatch(testMatch.id);
    });

    it('rejects score update when expectedVersion does not match current version', async () => {
      const currentVer = getMatchVersion(testMatch.id);
      const staleVersion = currentVer - 1; // Stale version

      const res = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team1.id,
        expectedVersion: staleVersion,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('CONCURRENCY_ERROR');
    });

    it('accepts score update when expectedVersion matches current version and increments version', async () => {
      const currentVer = getMatchVersion(testMatch.id);

      const res = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team1.id,
        expectedVersion: currentVer,
      });

      expect(res.success).toBe(true);
      expect(res.data?.version).toBe(currentVer + 1);
    });

    it('safeguards against duplicate submissions with idempotencyKey replay', async () => {
      const idempotencyKey = 'req-point-12345-abcde';

      const firstCall = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team1.id,
        idempotencyKey,
      });

      expect(firstCall.success).toBe(true);
      const firstScore = firstCall.data?.team1Score;

      // Replay identical request with identical idempotency key
      const secondCall = await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team1.id,
        idempotencyKey,
      });

      expect(secondCall.success).toBe(true);
      // Score MUST NOT increment twice
      expect(secondCall.data?.team1Score).toBe(firstScore);
    });
  });

  describe('Undo Last Point Operation', () => {
    beforeEach(async () => {
      await scoringService.startMatch(testMatch.id);
    });

    it('reverts the last point scored in active set', async () => {
      await scoringService.recordPoint({
        matchId: testMatch.id,
        awardedTeamId: testMatch.team1.id,
      });
      expect(matchRepository.getById(testMatch.id)?.setScores[0].team1Score).toBe(1);

      const undoRes = await scoringService.undoLastPoint(testMatch.id);
      expect(undoRes.success).toBe(true);
      expect(undoRes.data?.team1Score).toBe(0);
      expect(matchRepository.getById(testMatch.id)?.setScores[0].team1Score).toBe(0);
    });

    it('prevents undo when set score is already 0 - 0', async () => {
      const undoRes = await scoringService.undoLastPoint(testMatch.id);
      expect(undoRes.success).toBe(false);
      expect(undoRes.error).toContain('0 - 0');
    });
  });
});
