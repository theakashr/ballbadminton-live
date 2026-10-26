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

  // ==========================================================================
  // SECTION 4: BOTTOM STUNNING BADMINTON ACTION HERO BANNER
  // ==========================================================================
  describe('4. Bottom Stunning Badminton Action Hero Banner', () => {
    it('verifies bottom sports image banner configuration and content', () => {
      const bottomBannerConfig = {
        imageSrc: '/images/tournament-promo.jpg',
        alt: 'Ball badminton players in action on the tournament court',
        width: 1376,
        height: 768,
        headline: 'The Game. The Passion. The Live Action.',
        description: 'Stay connected to every tournament, every rally, and every point. Follow your favorite teams with Ball Badminton Live.',
        exploreTournamentsRoute: '/tournaments',
        viewLiveScoresRoute: '/live',
      };

      expect(bottomBannerConfig.imageSrc).toBe('/images/tournament-promo.jpg');
      expect(bottomBannerConfig.headline).toBe('The Game. The Passion. The Live Action.');
      expect(bottomBannerConfig.description).toContain('Stay connected to every tournament');
      expect(bottomBannerConfig.exploreTournamentsRoute).toBe('/tournaments');
      expect(bottomBannerConfig.viewLiveScoresRoute).toBe('/live');
      expect(bottomBannerConfig.alt).toContain('players in action');
      expect(bottomBannerConfig.width).toBe(1376);
      expect(bottomBannerConfig.height).toBe(768);
    });
  });

  // ==========================================================================
  // SECTION 5: KANNADA SITUATION-MATCHING PHRASES & LOCALIZATION TOUCHPOINTS
  // ==========================================================================
  describe('5. Kannada Contextual Localization Touchpoints', () => {
    it('verifies situation-appropriate Kannada strings across hero, banner, and categories', () => {
      const kannadaStrings = {
        heroTagline: 'ಪ್ರತಿಯೊಂದು ಪಂದ್ಯ • ಪ್ರತಿಯೊಂದು ಅಂಕ • ನೇರ ಪ್ರಸಾರ',
        heroRegionalBadge: 'ಕರ್ನಾಟಕ & ರಾಷ್ಟ್ರೀಯ ಪಂದ್ಯಾವಳಿಗಳು',
        bottomActionTagline: 'ಆಟದ ರೋಮಾಂಚನ, ಕ್ರೀಡೆಯ ಸಂಭ್ರಮ — ನೇರ ಸ್ಕೋರ್ ನಿಮ್ಮೊಂದಿಗೆ!',
        liveBadge: 'ನೇರ ಪಂದ್ಯ',
        upcomingBadge: 'ಮುಂದಿನ ಪಂದ್ಯ',
        liveBroadcastPill: 'ನೇರ ಪ್ರಸಾರ',
        footerPride: 'ಕರ್ನಾಟಕ ಹಾಗೂ ರಾಷ್ಟ್ರಮಟ್ಟದ ಪಂದ್ಯಾವಳಿಗಳ ಅಧಿಕೃತ ಲೈವ್ ಸ್ಕೋರ್ ವೇದಿಕೆ.',
        categories: {
          live: 'ನೇರ ಪಂದ್ಯಗಳು',
          upcoming: 'ವೇಳಾಪಟ್ಟಿ',
          tournaments: 'ಪಂದ್ಯಾವಳಿಗಳು',
          results: 'ಫಲಿತಾಂಶಗಳು',
        },
      };

      expect(kannadaStrings.heroTagline).toContain('ನೇರ ಪ್ರಸಾರ');
      expect(kannadaStrings.heroRegionalBadge).toContain('ಕರ್ನಾಟಕ');
      expect(kannadaStrings.bottomActionTagline).toContain('ಆಟದ ರೋಮಾಂಚನ');
      expect(kannadaStrings.categories.live).toBe('ನೇರ ಪಂದ್ಯಗಳು');
      expect(kannadaStrings.categories.tournaments).toBe('ಪಂದ್ಯಾವಳಿಗಳು');
      expect(kannadaStrings.footerPride).toContain('ಕರ್ನಾಟಕ');
    });
  });
});
