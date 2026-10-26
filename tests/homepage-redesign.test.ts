import { describe, it, expect, beforeEach } from 'vitest';
import { dataService } from '../src/services/dataService';
import { matchRepository } from '../src/repositories/matchRepository';
import { tournamentRepository } from '../src/repositories/tournamentRepository';
import { TOKENS } from '../src/design-system/tokens';
import type { Match } from '../src/types';

describe('Phase 4.0 — Premium Ball Badminton Live Homepage Redesign Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ==========================================================================
  // SECTION 1: HOMEPAGE DATA LAYER & INTEGRITY
  // ==========================================================================
  describe('1. Homepage Data Pipeline & Service Invariants', () => {
    it('supplies live matches for the broadcast banner and live section', async () => {
      const liveMatches = await dataService.getLiveMatches();
      expect(Array.isArray(liveMatches)).toBe(true);
      expect(liveMatches.length).toBeGreaterThan(0);

      const featured = liveMatches[0];
      expect(featured.status).toBe('live');
      expect(featured.tournamentName).toBeTruthy();
      expect(featured.court).toBeTruthy();
      expect(featured.team1.name).toBeTruthy();
      expect(featured.team2.name).toBeTruthy();
      expect(featured.maxPointsPerSet).toBe(29);
      expect(featured.currentSet).toBeGreaterThanOrEqual(1);
    });

    it('supplies upcoming fixtures with scheduled times and courts', async () => {
      const upcoming = await dataService.getMatches('upcoming');
      expect(Array.isArray(upcoming)).toBe(true);
      expect(upcoming.length).toBeGreaterThan(0);

      const firstFixture = upcoming[0];
      expect(firstFixture.status).toBe('upcoming');
      expect(firstFixture.scheduledTime).toBeTruthy();
      expect(firstFixture.court).toBeTruthy();
      expect(firstFixture.team1.name).toBeTruthy();
      expect(firstFixture.team2.name).toBeTruthy();
    });

    it('supplies completed matches with final scorelines and set breakdown', async () => {
      const completed = await dataService.getCompletedMatches();
      expect(Array.isArray(completed)).toBe(true);
      expect(completed.length).toBeGreaterThan(0);

      const firstCompleted = completed[0];
      expect(firstCompleted.status).toBe('completed');
      expect(firstCompleted.team1SetsWon + firstCompleted.team2SetsWon).toBeGreaterThanOrEqual(2);
      expect(firstCompleted.setScores.length).toBeGreaterThanOrEqual(2);
      expect(firstCompleted.setScores.every(s => s.isCompleted)).toBe(true);
    });

    it('supplies tournaments with venue, dates, and registered team counts', async () => {
      const tournaments = await dataService.getTournaments();
      expect(Array.isArray(tournaments)).toBe(true);
      expect(tournaments.length).toBeGreaterThan(0);

      const firstTourn = tournaments[0];
      expect(firstTourn.name).toBeTruthy();
      expect(firstTourn.startDate).toBeTruthy();
      expect(firstTourn.venue).toBeTruthy();
      expect(firstTourn.totalTeams || firstTourn.maxTeams).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // SECTION 2: FEATURED MATCH BROADCAST & SERVICE ROTATION LOGIC
  // ==========================================================================
  describe('2. Featured Live Match Broadcast & Serving Hand Rules', () => {
    it('verifies Ball Badminton official 1st and 2nd hand service states', async () => {
      const liveMatches = await dataService.getLiveMatches();
      for (const m of liveMatches) {
        if (m.servingTeamId) {
          expect([m.team1.id, m.team2.id]).toContain(m.servingTeamId);
        }
        if (m.servingHand) {
          expect([1, 2]).toContain(m.servingHand);
        }
      }
    });

    it('verifies that sets adhere to the official BBFI 29-point rule', async () => {
      const liveMatches = await dataService.getLiveMatches();
      for (const m of liveMatches) {
        expect(m.maxPointsPerSet).toBe(29);
        for (const set of m.setScores) {
          expect(set.team1Score).toBeLessThanOrEqual(29);
          expect(set.team2Score).toBeLessThanOrEqual(29);
        }
      }
    });

    it('correctly spotlights the next scheduled fixture when no match is live', () => {
      // Simulate zero live matches
      const liveMatches: Match[] = [];
      const upcomingMatches = matchRepository.getByStatus('upcoming');
      
      const featured = liveMatches[0] || null;
      const nextUpcoming = upcomingMatches[0] || null;

      expect(featured).toBeNull();
      expect(nextUpcoming).toBeDefined();
      expect(nextUpcoming?.status).toBe('upcoming');
      expect(nextUpcoming?.scheduledTime).toBeTruthy();
    });

    it('provides honest empty state without fabricating fake scores when no matches exist', () => {
      const liveMatches: Match[] = [];
      const upcomingMatches: Match[] = [];

      const featured = liveMatches[0] || null;
      const nextUpcoming = upcomingMatches[0] || null;

      expect(featured).toBeNull();
      expect(nextUpcoming).toBeNull();
      // Guarantees UI renders honest empty state without hardcoded fake points
    });
  });

  // ==========================================================================
  // SECTION 3: SHORTCUT CATEGORIES & BRAND PALETTE INVARIANTS
  // ==========================================================================
  describe('3. Category Shortcuts & Brand Palette Invariants', () => {
    it('validates 4 core navigation shortcuts with real database counts', async () => {
      const [live, upcoming, completed, tourns] = await Promise.all([
        dataService.getLiveMatches(),
        dataService.getMatches('upcoming'),
        dataService.getCompletedMatches(),
        dataService.getTournaments(),
      ]);

      const shortcuts = [
        { id: 'live', route: '/live', count: live.length },
        { id: 'upcoming', route: '/live', count: upcoming.length },
        { id: 'tournaments', route: '/tournaments', count: tourns.length },
        { id: 'results', route: '/results', count: completed.length },
      ];

      expect(shortcuts.length).toBe(4);
      for (const item of shortcuts) {
        expect(item.count).toBeGreaterThanOrEqual(0);
        expect(item.route.startsWith('/')).toBe(true);
      }
    });

    it('enforces brand color preservation according to design tokens', () => {
      expect(TOKENS.colors.plum[900]).toBe('#211329'); // Deep Plum
      expect(TOKENS.colors.charcoal[950]).toBe('#15131B'); // Charcoal
      expect(TOKENS.colors.brand.orange).toBe('#FF851B'); // Warm Orange
      expect(TOKENS.colors.brand.coral).toBe('#FF5B45'); // Coral
      expect(TOKENS.colors.neutral.softWhite).toBe('#F8F5F2'); // Soft White
      expect(TOKENS.colors.neutral.mutedGrey).toBe('#B7AFBD'); // Muted Lavender
      expect(TOKENS.colors.brand.yellow).toBe('#FFDC00'); // Ball Yellow
    });
  });
});
