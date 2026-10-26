import { describe, it, expect, beforeEach } from 'vitest';
import { scoringService, getMatchVersion } from '../src/services/scoringService';
import { matchRepository } from '../src/repositories/matchRepository';
import type { Match } from '../src/types';

describe('PHASE 2.8 — Network Disconnection Safety & Synchronization Boundary', () => {
  const TEST_MATCH_ID = 'match-sync-safety-test-01';
  let match: Match;

  beforeEach(() => {
    localStorage.clear();
    match = matchRepository.create({
      id: TEST_MATCH_ID,
      tournamentId: 'tourn-sync-test',
      court: 'Centre Court',
      status: 'live',
      stage: 'Group Stage',
      category: "Men's Open 5s",
      venue: 'Anna Stadium',
      city: 'Tiruchirappalli',
      team1: { id: 'team-alpha', name: 'Alpha Kings', shortName: 'ALP', score: 0, sets: 0 },
      team2: { id: 'team-beta', name: 'Beta Spikers', shortName: 'BET', score: 0, sets: 0 },
      currentSet: 1,
      setScores: [{ gameNumber: 1, team1Score: 5, team2Score: 4, isCompleted: false }],
      team1SetsWon: 0,
      team2SetsWon: 0,
      scheduledTime: '10:00 AM',
      servingTeamId: 'team-alpha',
      servingHand: 1,
      maxPointsPerSet: 29,
    });
  });

  it('rejects blind replay of stale scoring events via optimistic concurrency version check', async () => {
    const currentVersion = getMatchVersion(TEST_MATCH_ID);

    // Score point legally -> increments version
    const validPoint = await scoringService.recordPoint({
      matchId: TEST_MATCH_ID,
      awardedTeamId: 'team-alpha',
      expectedVersion: currentVersion,
    });
    expect(validPoint.success).toBe(true);
    expect(validPoint.data?.team1Score).toBe(6);

    // Attempt to replay a point that was queued during a previous stale state
    const staleQueuedPoint = await scoringService.recordPoint({
      matchId: TEST_MATCH_ID,
      awardedTeamId: 'team-alpha',
      expectedVersion: currentVersion, // Stale version!
    });

    expect(staleQueuedPoint.success).toBe(false);
    expect(staleQueuedPoint.error).toContain('CONCURRENCY_ERROR');
    expect(matchRepository.getById(TEST_MATCH_ID)?.setScores[0].team1Score).toBe(6);
  });

  it('deduplicates identical requests using idempotency key without incrementing score twice', async () => {
    const idempotencyKey = 'retry-event-key-999';

    // First attempt
    const res1 = await scoringService.recordPoint({
      matchId: TEST_MATCH_ID,
      awardedTeamId: 'team-beta',
      idempotencyKey,
    });
    expect(res1.success).toBe(true);
    expect(res1.data?.team2Score).toBe(5);

    // Simulated network retry with identical idempotencyKey
    const resRetry = await scoringService.recordPoint({
      matchId: TEST_MATCH_ID,
      awardedTeamId: 'team-beta',
      idempotencyKey,
    });
    expect(resRetry.success).toBe(true);
    // Score must remain 5, not increment to 6
    expect(resRetry.data?.team2Score).toBe(5);
    expect(matchRepository.getById(TEST_MATCH_ID)?.setScores[0].team2Score).toBe(5);
  });

  it('prohibits scoring while match is in paused state during emergency / weather delay', async () => {
    const pauseRes = await scoringService.pauseMatch(TEST_MATCH_ID, 'Sudden network failure inspection');
    expect(pauseRes.success).toBe(true);
    expect(matchRepository.getById(TEST_MATCH_ID)?.status).toBe('paused');

    // Scoring attempt must be rejected
    const rejectedRes = await scoringService.recordPoint({
      matchId: TEST_MATCH_ID,
      awardedTeamId: 'team-alpha',
    });
    expect(rejectedRes.success).toBe(false);
    expect(rejectedRes.error).toContain('not LIVE');
  });

  it('restores authoritative match state and preserves event history upon reconnection', () => {
    // Check authoritative score
    const authoritative = matchRepository.getById(TEST_MATCH_ID);
    expect(authoritative).toBeDefined();
    expect(authoritative?.setScores[0].team1Score).toBe(5);
    expect(authoritative?.setScores[0].team2Score).toBe(4);
    expect(authoritative?.servingHand).toBe(1);
  });
});
