import React, { useState, useEffect } from 'react';
import type { Match, AdminTournament } from '../types';
import { useRealtimeLiveMatches } from '../hooks/useRealtimeLiveMatches';
import { dataService } from '../services/dataService';
import { matchRepository } from '../repositories/matchRepository';
import { tournamentRepository } from '../repositories/tournamentRepository';

// Premium Broadcasting Home Components
import { HomeBroadcastBanner } from '../components/home/HomeBroadcastBanner';
import { HomeHeroSection } from '../components/home/HomeHeroSection';
import { HomeFeaturedLiveMatch } from '../components/home/HomeFeaturedLiveMatch';
import { HomeCategoryShortcuts } from '../components/home/HomeCategoryShortcuts';
import { HomeLiveMatchesSection } from '../components/home/HomeLiveMatchesSection';
import { HomeUpcomingFixturesSection } from '../components/home/HomeUpcomingFixturesSection';
import { HomeFeaturedTournamentsSection } from '../components/home/HomeFeaturedTournamentsSection';
import { HomeRecentResultsSection } from '../components/home/HomeRecentResultsSection';
import { HomeSupportingFooter } from '../components/home/HomeSupportingFooter';

interface HomePageProps {
  onCreateTournament: () => void;
  onOpenMatchDetails: (match: Match) => void;
  onFeatureClick?: (featureId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onCreateTournament,
  onOpenMatchDetails,
}) => {
  // 1. Supabase Realtime live match subscription
  const { 
    liveMatches, 
    status: realtimeStatus, 
    isLoading: isLiveLoading 
  } = useRealtimeLiveMatches();

  // 2. Upcoming, Completed and Tournament data states
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>(() => {
    return matchRepository.getByStatus('upcoming');
  });
  const [completedMatches, setCompletedMatches] = useState<Match[]>(() => {
    return matchRepository.getByStatus('completed');
  });
  const [tournaments, setTournaments] = useState<AdminTournament[]>(() => {
    return tournamentRepository.getAll();
  });
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // 3. Load authoritative database records from dataService
  useEffect(() => {
    let isMounted = true;

    const loadHomepageData = async () => {
      try {
        const [upcoming, completed, tourns] = await Promise.all([
          dataService.getMatches('upcoming'),
          dataService.getCompletedMatches(),
          dataService.getTournaments(),
        ]);

        if (isMounted) {
          if (upcoming.length > 0) setUpcomingMatches(upcoming);
          if (completed.length > 0) setCompletedMatches(completed);
          if (tourns.length > 0) setTournaments(tourns);
        }
      } catch (err) {
        console.warn('HomePage loadHomepageData error:', err);
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    loadHomepageData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Determine featured match and next upcoming fallback
  const featuredMatch = liveMatches.length > 0 ? liveMatches[0] : null;
  // If there are multiple live matches, show the rest in the Live Matches section; if only 1, still show it in live matches
  const secondaryLiveMatches = liveMatches.length > 1 ? liveMatches.slice(1) : liveMatches;
  const nextUpcoming = upcomingMatches.length > 0 ? upcomingMatches[0] : null;

  const handleScrollToUpcoming = () => {
    const section = document.getElementById('upcoming-fixtures-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="w-full min-h-screen bg-app-bg text-text-primary overflow-x-hidden">
      
      {/* A. Compact Broadcast Header & Status Banner */}
      <HomeBroadcastBanner
        liveCount={liveMatches.length}
        realtimeStatus={realtimeStatus}
        onCreateTournament={onCreateTournament}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* Hero Section: Every Match. Every Point. Live. */}
        <HomeHeroSection
          liveCount={liveMatches.length}
          tournamentsCount={tournaments.length}
        />

        {/* B. Featured Live Match Scoreboard (or Upcoming Spotlight) */}
        <section aria-label="Featured Match Scoreboard">
          <HomeFeaturedLiveMatch
            match={featuredMatch}
            nextUpcoming={nextUpcoming}
            onOpenDetails={onOpenMatchDetails}
            isLoading={isLiveLoading && isLoadingData}
          />
        </section>

        {/* C. Quick Category Shortcuts */}
        <HomeCategoryShortcuts
          liveCount={liveMatches.length}
          upcomingCount={upcomingMatches.length}
          tournamentsCount={tournaments.length}
          resultsCount={completedMatches.length}
          onScrollToUpcoming={handleScrollToUpcoming}
        />

        {/* D. Live Matches Section */}
        <HomeLiveMatchesSection
          matches={secondaryLiveMatches}
          onOpenDetails={onOpenMatchDetails}
        />

        {/* E. Upcoming Fixtures Section */}
        <HomeUpcomingFixturesSection
          fixtures={upcomingMatches}
          onOpenDetails={onOpenMatchDetails}
        />

        {/* F. Featured Tournaments Section */}
        <HomeFeaturedTournamentsSection
          tournaments={tournaments}
          onCreateTournament={onCreateTournament}
        />

        {/* G. Recent Results Section */}
        <HomeRecentResultsSection
          completedMatches={completedMatches}
          onOpenDetails={onOpenMatchDetails}
        />

      </div>

      {/* H. Supporting Broadcast Footer */}
      <HomeSupportingFooter />

    </main>
  );
};
