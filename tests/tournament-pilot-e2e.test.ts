import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { tournamentRepository } from '../src/repositories/tournamentRepository';
import { teamRepository } from '../src/repositories/teamRepository';
import { tournamentTeamRepository } from '../src/repositories/tournamentTeamRepository';
import { rosterRepository } from '../src/repositories/rosterRepository';
import { matchRepository } from '../src/repositories/matchRepository';
import { scorerRepository } from '../src/repositories/scorerRepository';
import { scoringService } from '../src/services/scoringService';
import { standingsService } from '../src/services/standingsService';
import { SUPER_ADMIN_EMAIL } from '../src/context/AuthContext';
import type { Match } from '../src/types';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yrlavkouxglogrrkjchf.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_T0a-9HuC_g605U1ZT3vXvQ_Br57VRgE';

let isCloudAvailable = false;

describe('PHASE 2.6 — Controlled Tournament Pilot & Multi-Device Validation', () => {
  beforeAll(async () => {
    localStorage.clear();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1000);
      const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
        headers: { apikey: SUPABASE_ANON_KEY },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      isCloudAvailable = res.status === 200;
    } catch {
      isCloudAvailable = false;
    }
  });

  const PILOT_TOURNAMENT_ID = 'tourn-pilot-state-championship-2026';
  const TEAM_CHENNAI_ID = 'team-chennai-spikers';
  const TEAM_MADURAI_ID = 'team-madurai-kings';
  const ASSIGNED_SCORER_EMAIL = 'court1.umpire@bbfi.org';
  const ROGUE_SCORER_EMAIL = 'unauthorized.scorer@other.org';
  let pilotMatch: Match;

  // ==========================================================================
  // SECTION 1: TOURNAMENT OPERATIONS & ROSTER ELIGIBILITY
  // ==========================================================================
  describe('1. Tournament Setup, Team Registration & Roster Validation', () => {
    it('creates an official championship tournament fixture', () => {
      const tournament = tournamentRepository.create({
        id: PILOT_TOURNAMENT_ID,
        name: 'Tamil Nadu State Ball Badminton Championship 2026',
        description: 'Controlled tournament pilot fixture for BBFI live scoring',
        organizer: 'Tamil Nadu Ball Badminton Association (TNBBA)',
        startDate: '2026-11-15',
        endDate: '2026-11-18',
        city: 'Tiruchirappalli',
        venue: 'Anna Indoor Stadium & Outdoor Complex',
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
        chiefReferee: 'K. Sundaram (BBFI Grade A)',
      });

      expect(tournament.id).toBe(PILOT_TOURNAMENT_ID);
      expect(tournament.name).toContain('Tamil Nadu State Ball Badminton');
    });

    it('registers both competing teams and validates BBFI 5s roster compliance', () => {
      // Register Chennai
      const reg1 = tournamentTeamRepository.registerTeam({
        tournamentId: PILOT_TOURNAMENT_ID,
        teamId: TEAM_CHENNAI_ID,
        seedNumber: 1,
        groupName: 'Pool A',
        registrationStatus: 'confirmed',
      });
      expect(reg1.teamId).toBe(TEAM_CHENNAI_ID);

      // Register Madurai
      const reg2 = tournamentTeamRepository.registerTeam({
        tournamentId: PILOT_TOURNAMENT_ID,
        teamId: TEAM_MADURAI_ID,
        seedNumber: 2,
        groupName: 'Pool A',
        registrationStatus: 'confirmed',
      });
      expect(reg2.teamId).toBe(TEAM_MADURAI_ID);

      // Add Chennai starting five + captain
      for (let i = 1; i <= 5; i++) {
        rosterRepository.assignPlayer({
          teamId: TEAM_CHENNAI_ID,
          playerId: `p-chennai-${i}`,
          tournamentId: PILOT_TOURNAMENT_ID,
          jerseyNumber: i,
          position: i <= 2 ? 'Front / Net' : i <= 4 ? 'Centre / Pivot' : 'Base / Deep',
          isCaptain: i === 1,
        });
      }

      // Add Madurai starting five + captain
      for (let i = 1; i <= 5; i++) {
        rosterRepository.assignPlayer({
          teamId: TEAM_MADURAI_ID,
          playerId: `p-madurai-${i}`,
          tournamentId: PILOT_TOURNAMENT_ID,
          jerseyNumber: i,
          position: i <= 2 ? 'Front / Net' : i <= 4 ? 'Centre / Pivot' : 'Base / Deep',
          isCaptain: i === 1,
        });
      }

      const checkChennai = rosterRepository.validateRosterEligibility(TEAM_CHENNAI_ID, PILOT_TOURNAMENT_ID);
      const checkMadurai = rosterRepository.validateRosterEligibility(TEAM_MADURAI_ID, PILOT_TOURNAMENT_ID);

      expect(checkChennai.isValid).toBe(true);
      expect(checkChennai.startersCount).toBe(5);
      expect(checkChennai.errors.length).toBe(0);

      expect(checkMadurai.isValid).toBe(true);
      expect(checkMadurai.startersCount).toBe(5);
      expect(checkMadurai.errors.length).toBe(0);
    });
  });

  // ==========================================================================
  // SECTION 2: MATCH SCHEDULING & SCORER ASSIGNMENT
  // ==========================================================================
  describe('2. Match Scheduling & Certified Scorer Binding', () => {
    it('schedules Match between Chennai and Madurai on Centre Court', () => {
      pilotMatch = matchRepository.create({
        tournamentId: PILOT_TOURNAMENT_ID,
        court: 'Centre Court (Floodlit)',
        round: 'Pool A - Round 1',
        stage: 'Group Stage',
        category: "Men's Open 5s",
        venue: 'Anna Stadium',
        city: 'Tiruchirappalli',
        status: 'upcoming',
        team1: {
          id: TEAM_CHENNAI_ID,
          name: 'Chennai Spikers',
          shortName: 'CHN',
          score: 0,
          sets: 0,
        },
        team2: {
          id: TEAM_MADURAI_ID,
          name: 'Madurai Kings',
          shortName: 'MDU',
          score: 0,
          sets: 0,
        },
        currentSet: 1,
        setScores: [{ gameNumber: 1, team1Score: 0, team2Score: 0, isCompleted: false }],
        team1SetsWon: 0,
        team2SetsWon: 0,
        scheduledTime: '07:00 PM',
        servingTeamId: TEAM_CHENNAI_ID,
        servingHand: 1,
        maxPointsPerSet: 29,
        scorerEmail: ASSIGNED_SCORER_EMAIL,
      });

      expect(pilotMatch.id).toBeDefined();
      expect(pilotMatch.status).toBe('upcoming');
    });

    it('assigns certified official umpire to the fixture and verifies authorization boundaries', () => {
      const assignment = scorerRepository.create({
        tournamentId: PILOT_TOURNAMENT_ID,
        tournamentName: 'Tamil Nadu State Ball Badminton Championship 2026',
        matchId: pilotMatch.id,
        matchTitle: 'Chennai Spikers vs Madurai Kings',
        court: 'Centre Court (Floodlit)',
        scorerName: 'B. Ramachandra',
        scorerEmail: ASSIGNED_SCORER_EMAIL,
        certificationLevel: 'BBFI Grade A',
        phone: '+91 98410 88776',
        status: 'assigned',
      });

      expect(assignment.id).toBeDefined();
      expect(assignment.status).toBe('assigned');

      // 1. Authorized: Assigned Scorer
      expect(
        scorerRepository.isAuthorizedToScore(pilotMatch.scorerEmail, {
          role: 'official_scorer',
          email: ASSIGNED_SCORER_EMAIL,
        })
      ).toBe(true);

      // 2. Authorized: Super Admin Override
      expect(
        scorerRepository.isAuthorizedToScore(pilotMatch.scorerEmail, {
          role: 'super_admin',
          email: SUPER_ADMIN_EMAIL,
        })
      ).toBe(true);

      // 3. Blocked: Unassigned / Rogue Scorer
      expect(
        scorerRepository.isAuthorizedToScore(pilotMatch.scorerEmail, {
          role: 'official_scorer',
          email: ROGUE_SCORER_EMAIL,
        })
      ).toBe(false);

      // 4. Blocked: Spectator / Viewer
      expect(
        scorerRepository.isAuthorizedToScore(pilotMatch.scorerEmail, {
          role: 'viewer',
          email: 'spectator@fan.com',
        })
      ).toBe(false);

      // 5. Blocked: Anonymous Visitor
      expect(scorerRepository.isAuthorizedToScore(pilotMatch.scorerEmail, null)).toBe(false);
    });
  });

  // ==========================================================================
  // SECTION 3: MULTI-DEVICE REALTIME SCORING SIMULATION
  // ==========================================================================
  describe('3. Multi-Session Realtime Scoring, Concurrency & State Recovery', () => {
    it('starts match and records rally points with authoritative Two-Hands rotation', async () => {
      // 1. Umpire starts match
      const startRes = await scoringService.startMatch(pilotMatch.id);
      expect(startRes.success).toBe(true);
      expect(matchRepository.getById(pilotMatch.id)?.status).toBe('live');

      // 2. Point 1: Chennai (serving, Hand 1) wins rally -> 1 - 0, retains Hand 1
      const pt1 = await scoringService.recordPoint({
        matchId: pilotMatch.id,
        awardedTeamId: TEAM_CHENNAI_ID,
      });
      expect(pt1.data?.team1Score).toBe(1);
      expect(pt1.data?.team2Score).toBe(0);
      expect(pt1.data?.servingTeamId).toBe(TEAM_CHENNAI_ID);
      expect(pt1.data?.servingHand).toBe(1);

      // 3. Point 2: Madurai wins rally against Chennai serve -> Chennai drops to 2nd Hand
      const pt2 = await scoringService.recordPoint({
        matchId: pilotMatch.id,
        awardedTeamId: TEAM_MADURAI_ID,
      });
      expect(pt2.data?.team1Score).toBe(1);
      expect(pt2.data?.team2Score).toBe(1);
      expect(pt2.data?.servingTeamId).toBe(TEAM_CHENNAI_ID);
      expect(pt2.data?.servingHand).toBe(2);

      // 4. Point 3: Madurai wins rally against Chennai 2nd Hand -> SIDE OUT! Serve goes to Madurai (Hand 1)
      const pt3 = await scoringService.recordPoint({
        matchId: pilotMatch.id,
        awardedTeamId: TEAM_MADURAI_ID,
      });
      expect(pt3.data?.team1Score).toBe(1);
      expect(pt3.data?.team2Score).toBe(2);
      expect(pt3.data?.servingTeamId).toBe(TEAM_MADURAI_ID);
      expect(pt3.data?.servingHand).toBe(1);
    });

    it('handles pause/resume states and rejects scoring while paused', async () => {
      // Umpire pauses match due to court dust
      const pauseRes = await scoringService.pauseMatch(pilotMatch.id, 'Court sweeping interval');
      expect(pauseRes.success).toBe(true);
      expect(matchRepository.getById(pilotMatch.id)?.status).toBe('paused');

      // Attempt to score while paused: Must be rejected
      const rejectedPoint = await scoringService.recordPoint({
        matchId: pilotMatch.id,
        awardedTeamId: TEAM_CHENNAI_ID,
      });
      expect(rejectedPoint.success).toBe(false);
      expect(rejectedPoint.error).toContain('not LIVE');

      // Resume match
      const resumeRes = await scoringService.startMatch(pilotMatch.id);
      expect(resumeRes.success).toBe(true);
      expect(matchRepository.getById(pilotMatch.id)?.status).toBe('live');
    });

    it('enforces idempotency on duplicate point submission and optimistic concurrency on stale version', async () => {
      const idempotencyKey = 'pilot-rally-key-998811';
      const version = matchRepository.getById(pilotMatch.id)!.version;

      // Submission 1
      const res1 = await scoringService.recordPoint({
        matchId: pilotMatch.id,
        awardedTeamId: TEAM_CHENNAI_ID,
        idempotencyKey,
        expectedVersion: version,
      });
      expect(res1.success).toBe(true);

      // Submission 2 (Duplicate replay from network retry): Score must NOT increment twice
      const resDuplicate = await scoringService.recordPoint({
        matchId: pilotMatch.id,
        awardedTeamId: TEAM_CHENNAI_ID,
        idempotencyKey,
      });
      expect(resDuplicate.success).toBe(true);
      expect(resDuplicate.data?.team1Score).toBe(res1.data?.team1Score);

      // Submission 3 (Outdated version from desynced client): Must be rejected
      const resStale = await scoringService.recordPoint({
        matchId: pilotMatch.id,
        awardedTeamId: TEAM_CHENNAI_ID,
        expectedVersion: 9999, // Stale version
      });
      expect(resStale.success).toBe(false);
      expect(resStale.error).toContain('CONCURRENCY_ERROR');
    });

    it('supports undo operation and restores previous authoritative scorecard', async () => {
      const beforeMatch = matchRepository.getById(pilotMatch.id)!;
      const initialScore = beforeMatch.setScores[0].team1Score;

      // Award test point
      await scoringService.recordPoint({
        matchId: pilotMatch.id,
        awardedTeamId: TEAM_CHENNAI_ID,
      });
      expect(matchRepository.getById(pilotMatch.id)!.setScores[0].team1Score).toBe(initialScore + 1);

      // Undo point
      const undoRes = await scoringService.undoLastPoint(pilotMatch.id);
      expect(undoRes.success).toBe(true);
      expect(matchRepository.getById(pilotMatch.id)!.setScores[0].team1Score).toBe(initialScore);
    });

    it('completes game at 29 points with 2-point lead and finishes the Best of 3 match', async () => {
      // Fast-forward Game 1 to 28-25
      const matchG1 = matchRepository.getById(pilotMatch.id)!;
      matchG1.setScores[0].team1Score = 28;
      matchG1.setScores[0].team2Score = 25;
      matchRepository.update(pilotMatch.id, { setScores: matchG1.setScores });

      // Award 29th point to Chennai -> Game 1 won (29-25)
      const g1Win = await scoringService.recordPoint({
        matchId: pilotMatch.id,
        awardedTeamId: TEAM_CHENNAI_ID,
      });
      expect(g1Win.data?.gameWon).toBe(true);
      expect(g1Win.data?.team1SetsWon).toBe(1);
      expect(g1Win.data?.currentSet).toBe(2);

      // Fast-forward Game 2 to 28-26
      const matchG2 = matchRepository.getById(pilotMatch.id)!;
      matchG2.setScores[1].team1Score = 28;
      matchG2.setScores[1].team2Score = 26;
      matchRepository.update(pilotMatch.id, { setScores: matchG2.setScores });

      // Award 29th point to Chennai -> Game 2 won (29-26) -> Best of 3 MATCH WON!
      const g2Win = await scoringService.recordPoint({
        matchId: pilotMatch.id,
        awardedTeamId: TEAM_CHENNAI_ID,
      });
      expect(g2Win.data?.gameWon).toBe(true);
      expect(g2Win.data?.team1SetsWon).toBe(2);
      expect(g2Win.data?.matchCompleted).toBe(true);

      const finalMatch = matchRepository.getById(pilotMatch.id)!;
      expect(finalMatch.status).toBe('completed');
      expect(finalMatch.team1SetsWon).toBe(2);
      expect(finalMatch.team2SetsWon).toBe(0);
    });

    it('recovers authoritative state on simulated spectator device reconnect', () => {
      // Simulate spectator opening match URL on new device
      const spectatorRecoveredMatch = matchRepository.getById(pilotMatch.id);
      expect(spectatorRecoveredMatch).toBeDefined();
      expect(spectatorRecoveredMatch?.status).toBe('completed');
      expect(spectatorRecoveredMatch?.team1SetsWon).toBe(2);
      expect(spectatorRecoveredMatch?.team2SetsWon).toBe(0);
      expect(spectatorRecoveredMatch?.setScores[0].team1Score).toBe(29);
      expect(spectatorRecoveredMatch?.setScores[1].team1Score).toBe(29);
    });
  });

  // ==========================================================================
  // SECTION 4: STANDINGS & TIE-BREAKERS COMPUTATION
  // ==========================================================================
  describe('4. Official Standings & Tie-Breaker Resolution', () => {
    it('computes standings with Points -> Set Diff -> Point Diff', () => {
      const { overall } = standingsService.calculateStandings(PILOT_TOURNAMENT_ID);
      expect(overall.length).toBe(2);

      // Winner: Chennai Spikers (1 win, 2 pts, 2-0 sets, +7 point diff)
      const chennai = overall[0];
      expect(chennai.teamId).toBe(TEAM_CHENNAI_ID);
      expect(chennai.won).toBe(1);
      expect(chennai.points).toBe(2);
      expect(chennai.setsWon).toBe(2);
      expect(chennai.setsLost).toBe(0);
      expect(chennai.setDifference).toBe(2);

      // Runner up: Madurai Kings (0 wins, 0 pts, 0-2 sets, -7 point diff)
      const madurai = overall[1];
      expect(madurai.teamId).toBe(TEAM_MADURAI_ID);
      expect(madurai.lost).toBe(1);
      expect(madurai.points).toBe(0);
      expect(madurai.setsWon).toBe(0);
      expect(madurai.setsLost).toBe(2);
      expect(madurai.setDifference).toBe(-2);
    });
  });

  // ==========================================================================
  // SECTION 5: LIVE SUPABASE SECURITY GATEWAY VERIFICATION
  // ==========================================================================
  describe('5. Live Cloud Database RLS & API Authorization Check', () => {
    const liveClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    it('confirms anonymous clients are rejected when attempting direct match creation on cloud DB', async () => {
      if (!isCloudAvailable) return;
      const { error } = await liveClient.from('matches').insert({
        tournament_id: '00000000-0000-0000-0000-000000000000',
        team1_id: '00000000-0000-0000-0000-000000000001',
        team2_id: '00000000-0000-0000-0000-000000000002',
        stage: 'Finals',
        court: 'Centre Court',
        scheduled_time: new Date().toISOString(),
        venue: 'Anna Stadium',
        city: 'Tiruchirappalli',
      });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('42501'); // PostgreSQL RLS Violation
    });

    it('confirms anonymous clients cannot execute authoritative scoring RPC on cloud DB', async () => {
      if (!isCloudAvailable) return;
      const { data, error } = await liveClient.rpc('record_point_rpc', {
        p_match_id: '00000000-0000-0000-0000-000000000000',
        p_awarded_team_id: '00000000-0000-0000-0000-000000000001',
      });

      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/PERMISSION_DENIED|not authorized/i);
    });
  });
});
