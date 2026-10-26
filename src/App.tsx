import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Public desktop & shared components
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { LiveMatchesPage } from './pages/LiveMatchesPage';
import { MatchCenterPage } from './pages/MatchCenterPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { TournamentDetailPage } from './pages/TournamentDetailPage';
import { ResultsPage } from './pages/ResultsPage';
import { LoginPage } from './pages/LoginPage';
import { TournamentFormModal } from './components/tournament/TournamentFormModal';
import { LoginModal } from './components/auth/LoginModal';
import { MatchDetailsModal } from './components/matches/MatchDetailsModal';
import { FeatureDetailModal } from './components/common/FeatureDetailModal';
import { TeamsModal } from './components/common/TeamsModal';
import { StatsModal } from './components/common/StatsModal';

// Mobile-specific Native UI Components
import { MobileHeader } from './components/mobile/MobileHeader';
import { MobileBottomNav, type MobileTab } from './components/mobile/MobileBottomNav';
import { MobileMoreSheet } from './components/mobile/MobileMoreSheet';
import { 
  updateNativeStatusBar, 
  hideSplashScreen, 
  registerBackButtonListener 
} from './lib/nativeBridge';

// Admin components & pages
import { AdminLayout } from './components/admin/layout/AdminLayout';
import { AdminProtectedRoute } from './components/admin/auth/AdminProtectedRoute';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminTournamentsPage } from './pages/admin/AdminTournamentsPage';
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage';
import { AdminPlayersPage } from './pages/admin/AdminPlayersPage';
import { AdminMatchesPage } from './pages/admin/AdminMatchesPage';
import { AdminScorersPage } from './pages/admin/AdminScorersPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

import { matchRepository } from './repositories/matchRepository';
import type { Match } from './types';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const isAdminRoute = location.pathname.startsWith('/admin');

  // Modal State Management (Public)
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<Match | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  // Synchronize Android Native Status Bar & Splash Screen
  useEffect(() => {
    updateNativeStatusBar(isDark);
  }, [isDark]);

  useEffect(() => {
    hideSplashScreen();
  }, []);

  // Android Hardware Back Button Handling
  useEffect(() => {
    const unregister = registerBackButtonListener(() => {
      if (isMobileMoreOpen) {
        setIsMobileMoreOpen(false);
        return true;
      }
      if (selectedMatchForDetails) {
        setSelectedMatchForDetails(null);
        return true;
      }
      if (selectedFeatureId) {
        setSelectedFeatureId(null);
        return true;
      }
      if (isTournamentModalOpen) {
        setIsTournamentModalOpen(false);
        return true;
      }
      if (isLoginModalOpen) {
        setIsLoginModalOpen(false);
        return true;
      }
      if (isTeamsModalOpen) {
        setIsTeamsModalOpen(false);
        return true;
      }
      if (isStatsModalOpen) {
        setIsStatsModalOpen(false);
        return true;
      }
      if (location.pathname !== '/') {
        if (window.history.state && window.history.state.idx > 0) {
          navigate(-1);
        } else {
          navigate('/');
        }
        return true;
      }
      return false; // Root level: allow OS default (exit / background app)
    });

    return unregister;
  }, [
    isMobileMoreOpen,
    selectedMatchForDetails,
    selectedFeatureId,
    isTournamentModalOpen,
    isLoginModalOpen,
    isTeamsModalOpen,
    isStatsModalOpen,
    location.pathname,
    navigate,
  ]);

  // Determine active section for desktop nav highlighting
  const getActiveSection = () => {
    if (location.pathname.startsWith('/tournaments')) return 'tournaments';
    if (location.pathname === '/live') return 'matches';
    if (location.pathname === '/results') return 'results';
    if (location.pathname.startsWith('/matches')) return 'matches';
    return 'home';
  };

  // Determine active mobile tab for bottom nav highlighting
  const getActiveMobileTab = (): MobileTab => {
    if (isMobileMoreOpen) return 'more';
    if (location.pathname.startsWith('/tournaments')) return 'tournaments';
    if (location.pathname === '/live') return 'live';
    if (location.pathname === '/results') return 'results';
    if (location.pathname.startsWith('/matches/')) {
      const matchId = location.pathname.replace('/matches/', '');
      const match = matchRepository.getById(matchId);
      if (match?.status === 'completed') return 'results';
      return 'live';
    }
    return 'home';
  };

  const handleMobileTabChange = (tab: MobileTab) => {
    setIsMobileMoreOpen(false);
    if (tab === 'home') {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'live') {
      navigate('/live');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'tournaments') {
      navigate('/tournaments');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'results') {
      navigate('/results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'more') {
      setIsMobileMoreOpen(true);
    }
  };

  const handleNavigateSection = (sectionId: string) => {
    if (sectionId === 'tournaments') {
      navigate('/tournaments');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (sectionId === 'matches') {
      navigate('/live');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (sectionId === 'results') {
      navigate('/results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (sectionId === 'teams') {
      setIsTeamsModalOpen(true);
    } else if (sectionId === 'stats') {
      setIsStatsModalOpen(true);
    } else {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenMatchDetails = (match: Match) => {
    navigate(`/matches/${match.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFeatureClick = (featureId: string) => {
    setSelectedFeatureId(featureId);
  };

  const handleFeatureModalAction = () => {
    if (selectedFeatureId === 'live-scoring') {
      navigate('/live');
    } else if (selectedFeatureId === 'team-management') {
      setIsTeamsModalOpen(true);
    } else if (selectedFeatureId === 'fixtures-brackets') {
      navigate('/tournaments');
    } else if (selectedFeatureId === 'match-statistics') {
      setIsStatsModalOpen(true);
    }
  };

  const liveMatches = matchRepository.getAll().filter(m => m.status === 'live');
  const liveCount = liveMatches.length > 0 ? liveMatches.length : 1;

  return (
    <div className="min-h-screen bg-app-bg text-text-primary font-sans flex flex-col selection:bg-brand-orange selection:text-white">
      
      {/* 1. Desktop Global Navigation Bar (hidden on mobile) */}
      {!isAdminRoute && (
        <div className="hidden md:block">
          <Navbar
            onCreateTournament={() => setIsTournamentModalOpen(true)}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            activeSection={getActiveSection()}
            onNavigateSection={handleNavigateSection}
          />
        </div>
      )}

      {/* 2. Mobile-First Top Header (visible on mobile only) */}
      {!isAdminRoute && (
        <MobileHeader
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onCreateTournament={() => setIsTournamentModalOpen(true)}
        />
      )}

      {/* 3. Page Routing (with dynamic safe-area bottom padding to prevent bottom nav collision) */}
      <div className={`flex-1 ${!isAdminRoute ? 'pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0' : ''}`}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <HomePage
                onCreateTournament={() => setIsTournamentModalOpen(true)}
                onOpenMatchDetails={handleOpenMatchDetails}
                onFeatureClick={handleFeatureClick}
              />
            }
          />
          <Route path="/live" element={<LiveMatchesPage />} />
          <Route path="/matches/:id" element={<MatchCenterPage />} />
          <Route
            path="/tournaments"
            element={
              <TournamentsPage
                onCreateTournament={() => setIsTournamentModalOpen(true)}
              />
            }
          />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route
              path="tournaments"
              element={
                <AdminProtectedRoute requiredRole="tournament_admin">
                  <AdminTournamentsPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="teams"
              element={
                <AdminProtectedRoute requiredRole="tournament_admin">
                  <AdminTeamsPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="players"
              element={
                <AdminProtectedRoute requiredRole="tournament_admin">
                  <AdminPlayersPage />
                </AdminProtectedRoute>
              }
            />
            <Route path="matches" element={<AdminMatchesPage />} />
            <Route path="scorers" element={<AdminScorersPage />} />
            <Route
              path="settings"
              element={
                <AdminProtectedRoute requiredRole="super_admin">
                  <AdminSettingsPage />
                </AdminProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={
              <HomePage
                onCreateTournament={() => setIsTournamentModalOpen(true)}
                onOpenMatchDetails={handleOpenMatchDetails}
                onFeatureClick={handleFeatureClick}
              />
            }
          />
        </Routes>
      </div>

      {/* 4. Desktop Global Footer (hidden on mobile) */}
      {!isAdminRoute && (
        <div className="hidden md:block">
          <Footer
            onCreateTournament={() => setIsTournamentModalOpen(true)}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onNavigateSection={handleNavigateSection}
          />
        </div>
      )}

      {/* 5. Mobile Native Bottom Navigation Bar */}
      {!isAdminRoute && (
        <MobileBottomNav
          activeTab={getActiveMobileTab()}
          onTabChange={handleMobileTabChange}
          liveMatchCount={liveCount}
        />
      )}

      {/* 6. Mobile "More" Sheet Modal */}
      {!isAdminRoute && (
        <MobileMoreSheet
          isOpen={isMobileMoreOpen}
          onClose={() => setIsMobileMoreOpen(false)}
          onOpenTeams={() => setIsTeamsModalOpen(true)}
          onOpenStats={() => setIsStatsModalOpen(true)}
          onOpenCreateTournament={() => setIsTournamentModalOpen(true)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
        />
      )}

      {/* 7. Public Dialogs & Modals */}
      {!isAdminRoute && (
        <>
          <TournamentFormModal
            isOpen={isTournamentModalOpen}
            onClose={() => setIsTournamentModalOpen(false)}
          />

          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
          />

          <MatchDetailsModal
            match={selectedMatchForDetails}
            onClose={() => setSelectedMatchForDetails(null)}
          />

          <FeatureDetailModal
            featureId={selectedFeatureId}
            onClose={() => setSelectedFeatureId(null)}
            onActionClick={handleFeatureModalAction}
          />

          <TeamsModal
            isOpen={isTeamsModalOpen}
            onClose={() => setIsTeamsModalOpen(false)}
          />

          <StatsModal
            isOpen={isStatsModalOpen}
            onClose={() => setIsStatsModalOpen(false)}
          />
        </>
      )}

    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
