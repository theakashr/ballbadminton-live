import React from 'react';
import { HeroSection } from '../components/hero/HeroSection';
import { FeaturedMatch } from '../components/scoreboard/FeaturedMatch';
import { MatchOverview } from '../components/matches/MatchOverview';
import { TournamentPromo } from '../components/tournament/TournamentPromo';
import { FEATURED_MATCH } from '../data/mockData';
import type { Match } from '../types';

interface HomePageProps {
  onCreateTournament: () => void;
  onOpenMatchDetails: (match: Match) => void;
  onFeatureClick: (featureId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onCreateTournament,
  onOpenMatchDetails,
  onFeatureClick,
}) => {
  const handleWatchLive = () => {
    const liveSection = document.getElementById('live-matches');
    if (liveSection) {
      liveSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      const scoreboard = document.getElementById('featured-scoreboard');
      scoreboard?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="w-full">
      {/* 1. Cinematic Hero Section */}
      <HeroSection
        onWatchLive={handleWatchLive}
        onCreateTournament={onCreateTournament}
        onFeatureClick={onFeatureClick}
      />

      {/* 2. Broadcast Featured Live Match Scoreboard */}
      <FeaturedMatch
        initialMatch={FEATURED_MATCH}
        onOpenDetails={onOpenMatchDetails}
      />

      {/* 3. Match Overview (Live, Upcoming, Recent Results) */}
      <MatchOverview
        onSelectMatch={onOpenMatchDetails}
      />

      {/* 4. Tournament Promotion Banner */}
      <TournamentPromo
        onCreateTournament={onCreateTournament}
      />
    </main>
  );
};
