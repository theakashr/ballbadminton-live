import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Match } from '../types';
import { matchRepository } from '../repositories/matchRepository';
import { dataService } from '../services/dataService';
import type { RealtimeConnectionStatus } from './useRealtimeMatch';

interface UseRealtimeLiveMatchesResult {
  liveMatches: Match[];
  status: RealtimeConnectionStatus;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  isLoading: boolean;
}

export const useRealtimeLiveMatches = (): UseRealtimeLiveMatchesResult => {
  const [liveMatches, setLiveMatches] = useState<Match[]>(() => {
    return matchRepository.getByStatus('live');
  });
  const [status, setStatus] = useState<RealtimeConnectionStatus>(
    isSupabaseConfigured() ? 'connecting' : 'demo'
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const matches = await dataService.getLiveMatches();
      setLiveMatches(matches);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Failed to refresh live matches:', err);
      setLiveMatches(matchRepository.getByStatus('live'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    if (!isSupabaseConfigured() || !supabase) {
      setStatus('demo');
      return;
    }

    setStatus('connecting');

    const channel = supabase
      .channel('realtime:all_live_matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_games',
        },
        () => {
          refresh();
        }
      )
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (subscribeStatus === 'CHANNEL_ERROR') {
          setStatus('error');
        } else if (subscribeStatus === 'CLOSED') {
          setStatus('disconnected');
        }
      });

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [refresh]);

  return {
    liveMatches,
    status,
    lastUpdated,
    refresh,
    isLoading,
  };
};
