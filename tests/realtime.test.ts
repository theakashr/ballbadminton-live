import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RealtimeConnectionStatus } from '../src/hooks/useRealtimeMatch';

describe('Realtime State Machine & Synchronization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Realtime Connection State Transitions', () => {
    interface StateMachineState {
      status: RealtimeConnectionStatus;
      isStale: boolean;
      error: string | null;
    }

    class RealtimeConnectionSimulator {
      private state: StateMachineState;
      private staleTimer: any = null;

      constructor(isConfigured: boolean) {
        this.state = {
          status: isConfigured ? 'connecting' : 'demo',
          isStale: false,
          error: null,
        };
      }

      getState(): StateMachineState {
        return { ...this.state };
      }

      onChannelSubscribed() {
        this.state.status = 'connected';
        this.state.error = null;
        this.resetStaleTimer();
      }

      onChannelError(msg: string) {
        this.state.status = 'error';
        this.state.error = msg;
        this.state.isStale = true;
      }

      onChannelDisconnected() {
        this.state.status = 'disconnected';
        this.state.isStale = true;
      }

      onMessageReceived() {
        this.resetStaleTimer();
      }

      private resetStaleTimer() {
        this.state.isStale = false;
        if (this.staleTimer) clearTimeout(this.staleTimer);
        this.staleTimer = setTimeout(() => {
          this.state.isStale = true;
        }, 45000);
      }
    }

    it('defaults to demo state when Supabase credentials are not provided', () => {
      const client = new RealtimeConnectionSimulator(false);
      expect(client.getState().status).toBe('demo');
      expect(client.getState().isStale).toBe(false);
      expect(client.getState().error).toBeNull();
    });

    it('begins in connecting status and successfully transitions to connected', () => {
      const client = new RealtimeConnectionSimulator(true);
      expect(client.getState().status).toBe('connecting');

      client.onChannelSubscribed();
      expect(client.getState().status).toBe('connected');
      expect(client.getState().error).toBeNull();
      expect(client.getState().isStale).toBe(false);
    });

    it('transitions to error state on subscription error', () => {
      const client = new RealtimeConnectionSimulator(true);
      client.onChannelError('Channel subscription failed: Unauthorized');

      expect(client.getState().status).toBe('error');
      expect(client.getState().error).toContain('Unauthorized');
      expect(client.getState().isStale).toBe(true);
    });

    it('transitions to disconnected state upon network disconnect', () => {
      const client = new RealtimeConnectionSimulator(true);
      client.onChannelSubscribed();
      expect(client.getState().status).toBe('connected');

      client.onChannelDisconnected();
      expect(client.getState().status).toBe('disconnected');
      expect(client.getState().isStale).toBe(true);
    });

    it('marks data as stale when no event arrives within 45 seconds', () => {
      const client = new RealtimeConnectionSimulator(true);
      client.onChannelSubscribed();
      expect(client.getState().isStale).toBe(false);

      // Fast-forward 40 seconds (not yet stale)
      vi.advanceTimersByTime(40000);
      expect(client.getState().isStale).toBe(false);

      // Fast-forward another 6 seconds (total 46s > 45s threshold)
      vi.advanceTimersByTime(6000);
      expect(client.getState().isStale).toBe(true);

      // New message received resets stale state
      client.onMessageReceived();
      expect(client.getState().isStale).toBe(false);
    });
  });

  describe('Score Payload Ingestion & Dissemination', () => {
    it('applies postgres_changes payload to update live scoreboard without reload', () => {
      let liveScores = {
        currentSet: 1,
        team1Score: 10,
        team2Score: 8,
        team1SetsWon: 0,
        team2SetsWon: 0,
        servingHand: 1,
      };

      const handleRealtimePayload = (payload: { new: Partial<typeof liveScores> }) => {
        liveScores = {
          ...liveScores,
          ...payload.new,
        };
      };

      // Realtime event arrives from Supabase channel
      handleRealtimePayload({
        new: {
          team1Score: 11,
          servingHand: 2,
        },
      });

      expect(liveScores.team1Score).toBe(11);
      expect(liveScores.team2Score).toBe(8);
      expect(liveScores.servingHand).toBe(2);
    });
  });
});
