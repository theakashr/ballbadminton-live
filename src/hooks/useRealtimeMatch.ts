import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured, isUuid } from '../lib/supabase';
import type { Match } from '../types';
import { matchRepository } from '../repositories/matchRepository';

export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'demo';

interface UseRealtimeMatchResult {
  match: Match | null;
  status: RealtimeConnectionStatus;
  isStale: boolean;
  lastUpdated: Date | null;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useRealtimeMatch = (matchId: string | undefined): UseRealtimeMatchResult => {
  const [match, setMatch] = useState<Match | null>(null);
  const [status, setStatus] = useState<RealtimeConnectionStatus>(
    isSupabaseConfigured() ? 'connecting' : 'demo'
  );
  const [isStale, setIsStale] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const staleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetStaleTimer = () => {
    setIsStale(false);
    if (staleTimeoutRef.current) clearTimeout(staleTimeoutRef.current);
    // If no realtime ping or event for 45s, mark state as potentially stale
    staleTimeoutRef.current = setTimeout(() => {
      setIsStale(true);
    }, 45000);
  };

  const fetchMatchData = async () => {
    if (!matchId) return;

    try {
      if (isSupabaseConfigured() && supabase && isUuid(matchId)) {
        const { data, error: sbError } = await supabase
          .from('matches')
          .select(`
            *,
            team1:teams!matches_team1_id_fkey(*),
            team2:teams!matches_team2_id_fkey(*),
            tournament:tournaments!matches_tournament_id_fkey(name),
            match_games(*)
          `)
          .eq('id', matchId)
          .single();

        if (sbError) {
          // Fallback to repository
          const fallback = matchRepository.getById(matchId);
          if (fallback) {
            setMatch(fallback);
          } else {
            setError(sbError.message);
          }
        } else if (data) {
          // Map supabase row to Match domain interface
          const mappedMatch: Match = {
            id: data.id,
            tournamentId: data.tournament_id,
            tournamentName: data.tournament?.name || data.venue || 'Ball Badminton Championship',
            stage: data.stage as any,
            category: data.category as any,
            court: data.court,
            status: data.status as any,
            scheduledTime: new Date(data.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            startedAt: data.started_at ? new Date(data.started_at).toLocaleTimeString() : undefined,
            team1: {
              id: data.team1.id,
              name: data.team1.name,
              shortName: data.team1.short_name,
              state: data.team1.state,
              city: data.team1.city,
              logoBg: data.team1.logo_bg,
              accentColor: data.team1.accent_color,
              captainName: data.team1.captain_name,
            },
            team2: {
              id: data.team2.id,
              name: data.team2.name,
              shortName: data.team2.short_name,
              state: data.team2.state,
              city: data.team2.city,
              logoBg: data.team2.logo_bg,
              accentColor: data.team2.accent_color,
              captainName: data.team2.captain_name,
            },
            currentSet: data.current_set,
            team1SetsWon: data.team1_sets_won,
            team2SetsWon: data.team2_sets_won,
            setScores: (data.match_games || []).map((g: any) => ({
              gameNumber: g.game_number,
              team1Score: g.team1_score,
              team2Score: g.team2_score,
              isCompleted: g.is_completed,
              winnerTeamId: g.winner_team_id,
            })),
            servingTeamId: data.serving_team_id,
            servingHand: data.serving_hand,
            maxPointsPerSet: data.max_points_per_set,
            venue: data.venue,
            city: data.city,
            notes: data.notes,
            referee: data.referee,
          };
          setMatch(mappedMatch);
          setLastUpdated(new Date());
          resetStaleTimer();
        }
      } else {
        // Local Prototype Demo Mode
        const local = matchRepository.getById(matchId);
        setMatch(local || null);
        setStatus('demo');
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch match');
      // Local fallback
      const local = matchRepository.getById(matchId);
      if (local) setMatch(local);
    }
  };

  useEffect(() => {
    fetchMatchData();

    if (!isSupabaseConfigured() || !supabase || !matchId) {
      setStatus('demo');
      return;
    }

    setStatus('connecting');

    // Subscribe to match row changes
    const channel = supabase
      .channel(`realtime:match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        () => {
          fetchMatchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_games',
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          fetchMatchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'score_events',
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          fetchMatchData();
        }
      )
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === 'SUBSCRIBED') {
          setStatus('connected');
          resetStaleTimer();
        } else if (subscribeStatus === 'CHANNEL_ERROR') {
          setStatus('error');
          setError('Realtime channel subscription error. Polling fallback active.');
        } else if (subscribeStatus === 'TIMED_OUT' || subscribeStatus === 'CLOSED') {
          setStatus('disconnected');
        }
      });

    const handleOnline = () => {
      fetchMatchData();
      if (isSupabaseConfigured() && supabase) {
        setStatus('connecting');
      }
    };
    const handleOffline = () => {
      setStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (staleTimeoutRef.current) clearTimeout(staleTimeoutRef.current);
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [matchId]);

  return {
    match,
    status,
    isStale,
    lastUpdated,
    error,
    refresh: fetchMatchData,
  };
};
