import { supabase, isSupabaseConfigured, isUuid } from '../lib/supabase';
import { matchRepository } from '../repositories/matchRepository';
import { activityRepository } from '../../src/repositories/activityRepository';
import type { GameScore } from '../types';

export interface ScoreUpdateResult {
  matchId: string;
  currentSet: number;
  team1Score: number;
  team2Score: number;
  team1SetsWon: number;
  team2SetsWon: number;
  servingTeamId?: string;
  servingHand?: 1 | 2;
  gameWon: boolean;
  matchCompleted: boolean;
  version: number;
  idempotentReplay?: boolean;
}

// In-memory idempotency cache for local prototype mode
const localIdempotencyCache = new Map<string, ScoreUpdateResult>();

// In-memory version tracker for local prototype mode
const matchVersionTracker = new Map<string, number>();

export const getMatchVersion = (matchId: string): number => {
  return matchVersionTracker.get(matchId) || 1;
};

export const scoringService = {
  /**
   * Starts a match, snapshots rules, initializes Game 1, and marks status as 'live'
   */
  async startMatch(matchId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && supabase && isUuid(matchId)) {
      const { data, error } = await supabase.rpc('start_match_rpc', {
        p_match_id: matchId,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: data?.success ?? true };
    }

    // Local Prototype Mode implementation
    const match = matchRepository.getById(matchId);
    if (!match) return { success: false, error: 'Match not found' };
    if (match.status === 'completed') return { success: false, error: 'Completed match cannot be restarted' };

    const initialScores: GameScore[] = match.setScores.length > 0 
      ? match.setScores 
      : [{ gameNumber: 1, team1Score: 0, team2Score: 0, isCompleted: false }];

    matchRepository.update(matchId, {
      status: 'live',
      startedAt: match.startedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      currentSet: 1,
      setScores: initialScores,
    });

    const currentVer = getMatchVersion(matchId);
    matchVersionTracker.set(matchId, currentVer + 1);

    activityRepository.log({
      action: 'MATCH_STARTED',
      entityType: 'match',
      entityName: `${match.team1.name} vs ${match.team2.name}`,
      userName: 'Court Official',
      userEmail: 'scorer@bbfi.org',
      details: 'Started match in live court tracking',
    });

    return { success: true };
  },

  /**
   * Award a rally point with optimistic concurrency, idempotency, and Ball Badminton 29-pt rules
   */
  async recordPoint(params: {
    matchId: string;
    awardedTeamId: string;
    eventType?: 'rally_point' | 'service_fault' | 'ace' | 'penalty_point';
    expectedVersion?: number;
    idempotencyKey?: string;
    playerId?: string;
  }): Promise<{ success: boolean; data?: ScoreUpdateResult; error?: string }> {
    const { matchId, awardedTeamId, eventType = 'rally_point', expectedVersion, idempotencyKey, playerId } = params;

    // 1. Supabase Execution Path
    if (isSupabaseConfigured() && supabase && isUuid(matchId) && isUuid(awardedTeamId)) {
      const { data, error } = await supabase.rpc('record_point_rpc', {
        p_match_id: matchId,
        p_awarded_team_id: awardedTeamId,
        p_event_type: eventType,
        p_expected_version: expectedVersion,
        p_idempotency_key: idempotencyKey,
        p_player_id: playerId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          matchId,
          currentSet: data.current_set,
          team1Score: data.team1_score,
          team2Score: data.team2_score,
          team1SetsWon: data.team1_sets_won ?? 0,
          team2SetsWon: data.team2_sets_won ?? 0,
          servingTeamId: data.serving_team_id,
          servingHand: data.serving_hand,
          gameWon: data.game_won,
          matchCompleted: data.match_completed,
          version: data.version,
          idempotentReplay: data.idempotent_replay,
        },
      };
    }

    // 2. Local Prototype Mode with Concurrency & Idempotency Safeguards
    if (idempotencyKey && localIdempotencyCache.has(idempotencyKey)) {
      return { success: true, data: localIdempotencyCache.get(idempotencyKey) };
    }

    const match = matchRepository.getById(matchId);
    if (!match) return { success: false, error: 'Match not found' };
    if (match.status !== 'live') return { success: false, error: `Match is not LIVE (status: ${match.status})` };

    // Concurrency Check
    const currentVer = getMatchVersion(matchId);
    if (expectedVersion !== undefined && expectedVersion !== currentVer) {
      return {
        success: false,
        error: `CONCURRENCY_ERROR: Version mismatch (expected ${expectedVersion}, current ${currentVer}). Please refresh.`,
      };
    }

    const currentSetIndex = match.currentSet - 1;
    const scores = [...match.setScores];
    if (!scores[currentSetIndex]) {
      scores[currentSetIndex] = {
        gameNumber: match.currentSet,
        team1Score: 0,
        team2Score: 0,
        isCompleted: false,
      };
    }

    const activeSet = { ...scores[currentSetIndex] };
    const isTeam1 = awardedTeamId === match.team1.id;
    if (isTeam1) {
      activeSet.team1Score += 1;
    } else {
      activeSet.team2Score += 1;
    }

    // Ball Badminton 29-Point Rule Evaluation
    const targetPoints = match.maxPointsPerSet || 29;
    const maxCap = targetPoints + 4; // e.g. 33 cap for 29 points
    let gameWon = false;
    let winnerId: string | undefined = undefined;

    if (
      (activeSet.team1Score >= targetPoints && (activeSet.team1Score - activeSet.team2Score >= 2 || activeSet.team1Score >= maxCap))
    ) {
      gameWon = true;
      winnerId = match.team1.id;
    } else if (
      (activeSet.team2Score >= targetPoints && (activeSet.team2Score - activeSet.team1Score >= 2 || activeSet.team2Score >= maxCap))
    ) {
      gameWon = true;
      winnerId = match.team2.id;
    }

    // Two-Hands Service Rotation
    let newHand: 1 | 2 = match.servingHand || 1;
    let newServingTeam = match.servingTeamId || match.team1.id;

    if (awardedTeamId !== match.servingTeamId) {
      if (match.servingHand === 1) {
        newHand = 2; // Move to 2nd Hand
      } else {
        newHand = 1; // Side out to other team
        newServingTeam = match.servingTeamId === match.team1.id ? match.team2.id : match.team1.id;
      }
    }

    let team1Sets = match.team1SetsWon;
    let team2Sets = match.team2SetsWon;
    let newCurrentSet = match.currentSet;
    let matchCompleted = false;

    if (gameWon) {
      activeSet.isCompleted = true;
      activeSet.winnerTeamId = winnerId;
      if (winnerId === match.team1.id) team1Sets++;
      else team2Sets++;

      const setsNeeded = Math.floor(3 / 2) + 1; // Best of 3 requires 2 sets
      if (team1Sets >= setsNeeded || team2Sets >= setsNeeded) {
        matchCompleted = true;
      } else {
        newCurrentSet++;
        scores[newCurrentSet - 1] = {
          gameNumber: newCurrentSet,
          team1Score: 0,
          team2Score: 0,
          isCompleted: false,
        };
      }
    }

    scores[currentSetIndex] = activeSet;

    const newVer = currentVer + 1;
    matchVersionTracker.set(matchId, newVer);

    matchRepository.update(matchId, {
      setScores: scores,
      team1SetsWon: team1Sets,
      team2SetsWon: team2Sets,
      currentSet: newCurrentSet,
      servingTeamId: newServingTeam,
      servingHand: newHand,
      status: matchCompleted ? 'completed' : 'live',
    });

    const resultPayload: ScoreUpdateResult = {
      matchId,
      currentSet: newCurrentSet,
      team1Score: activeSet.team1Score,
      team2Score: activeSet.team2Score,
      team1SetsWon: team1Sets,
      team2SetsWon: team2Sets,
      servingTeamId: newServingTeam,
      servingHand: newHand,
      gameWon,
      matchCompleted,
      version: newVer,
    };

    if (idempotencyKey) {
      localIdempotencyCache.set(idempotencyKey, resultPayload);
    }

    return { success: true, data: resultPayload };
  },

  /**
   * Undoes the last scored point in current game
   */
  async undoLastPoint(matchId: string, expectedVersion?: number): Promise<{ success: boolean; data?: any; error?: string }> {
    if (isSupabaseConfigured() && supabase && isUuid(matchId)) {
      const { data, error } = await supabase.rpc('undo_last_point_rpc', {
        p_match_id: matchId,
        p_expected_version: expectedVersion,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    }

    // Local mode undo
    const match = matchRepository.getById(matchId);
    if (!match) return { success: false, error: 'Match not found' };

    const currentVer = getMatchVersion(matchId);
    if (expectedVersion !== undefined && expectedVersion !== currentVer) {
      return { success: false, error: 'CONCURRENCY_ERROR: Version mismatch' };
    }

    const currentSetIndex = match.currentSet - 1;
    const scores = [...match.setScores];
    const currentScore = scores[currentSetIndex];
    if (!currentScore) return { success: false, error: 'No set scores available' };

    if (currentScore.team1Score === 0 && currentScore.team2Score === 0) {
      return { success: false, error: 'Cannot undo: Set score is 0 - 0' };
    }

    // Revert 1 point from whichever team has score
    if (currentScore.team1Score > 0) {
      currentScore.team1Score--;
    } else if (currentScore.team2Score > 0) {
      currentScore.team2Score--;
    }
    currentScore.isCompleted = false;
    currentScore.winnerTeamId = undefined;
    scores[currentSetIndex] = currentScore;

    const newVer = currentVer + 1;
    matchVersionTracker.set(matchId, newVer);

    matchRepository.update(matchId, {
      setScores: scores,
    });

    return {
      success: true,
      data: {
        team1Score: currentScore.team1Score,
        team2Score: currentScore.team2Score,
        version: newVer,
      },
    };
  },

  /**
   * Pauses a match
   */
  async pauseMatch(matchId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && supabase && isUuid(matchId)) {
      const { error } = await supabase.rpc('pause_match_rpc', {
        p_match_id: matchId,
        p_reason: reason,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    matchRepository.update(matchId, { status: 'paused', notes: reason });
    return { success: true };
  },

  /**
   * Completes a match
   */
  async completeMatch(matchId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && supabase && isUuid(matchId)) {
      const { error } = await supabase.rpc('complete_match_rpc', {
        p_match_id: matchId,
        p_notes: notes,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    matchRepository.update(matchId, { status: 'completed', notes });
    return { success: true };
  },
};
