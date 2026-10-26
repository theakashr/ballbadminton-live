import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle,
  X,
  UserCheck
} from 'lucide-react';
import { tournamentRepository } from '../../../repositories/tournamentRepository';
import { tournamentTeamRepository } from '../../../repositories/tournamentTeamRepository';
import { rosterRepository } from '../../../repositories/rosterRepository';
import { scorerRepository } from '../../../repositories/scorerRepository';
import { matchRepository } from '../../../repositories/matchRepository';
import { activityRepository } from '../../../repositories/activityRepository';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import type { AdminTournament, Team, MatchStage, MatchCategory, MatchLineupItem } from '../../../types';

interface MatchCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchCreated: (matchId: string) => void;
}

export const MatchCreationWizard: React.FC<MatchCreationWizardProps> = ({
  isOpen,
  onClose,
  onMatchCreated,
}) => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<AdminTournament | null>(null);

  // Step 2: Teams
  const [registeredTeams, setRegisteredTeams] = useState<Team[]>([]);
  const [team1Id, setTeam1Id] = useState<string>('');
  const [team2Id, setTeam2Id] = useState<string>('');

  // Step 3: Lineups
  const [team1Starters, setTeam1Starters] = useState<string[]>([]);
  const [team2Starters, setTeam2Starters] = useState<string[]>([]);
  const [team1Subs, setTeam1Subs] = useState<string[]>([]);
  const [team2Subs, setTeam2Subs] = useState<string[]>([]);

  // Step 4: Scoring Configuration
  const [pointsPerSet, setPointsPerSet] = useState<number>(29);
  const [bestOfSets, setBestOfSets] = useState<number>(3);
  const [deuceEnabled, setDeuceEnabled] = useState<boolean>(true);
  const [maxCap, setMaxCap] = useState<number>(33);

  // Step 5: Scheduling
  const [stage, setStage] = useState<MatchStage>('Group Stage');
  const [category, setCategory] = useState<MatchCategory>("Men's Open 5s");
  const [court, setCourt] = useState<string>('Centre Court (Outdoor Red Clay)');
  const [scheduledDate, setScheduledDate] = useState<string>('2026-11-12');
  const [scheduledTime, setScheduledTime] = useState<string>('10:00 AM');
  const [assignedScorerEmail, setAssignedScorerEmail] = useState<string>('');
  const [availableScorers, setAvailableScorers] = useState<Array<{ name: string; email: string; cert?: string }>>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const allTourns = tournamentRepository.getAll();
      setTournaments(allTourns);
      if (allTourns.length > 0) {
        setSelectedTournament(allTourns[0]);
      }

      const scorers = scorerRepository.getAll();
      setAvailableScorers(
        scorers.map((s) => ({
          name: s.scorerName,
          email: s.scorerEmail,
          cert: s.certificationLevel,
        }))
      );
      if (scorers.length > 0) {
        setAssignedScorerEmail(scorers[0].scorerEmail);
      }
    }
  }, [isOpen]);

  // Load teams when tournament changes
  useEffect(() => {
    if (selectedTournament) {
      const regs = tournamentTeamRepository.getByTournament(selectedTournament.id);
      const teams = regs.map((r) => r.team).filter((t): t is Team => Boolean(t));
      setRegisteredTeams(teams);

      if (teams.length >= 2) {
        setTeam1Id(teams[0].id);
        setTeam2Id(teams[1].id);
      } else {
        setTeam1Id('');
        setTeam2Id('');
      }
    }
  }, [selectedTournament]);

  // Auto-fill starter lineups when teams are chosen
  useEffect(() => {
    if (team1Id) {
      const roster = rosterRepository.getRoster(team1Id, selectedTournament?.id);
      const starterIds = roster.slice(0, 5).map((m) => m.playerId);
      setTeam1Starters(starterIds);
      const subIds = roster.slice(5, 9).map((m) => m.playerId);
      setTeam1Subs(subIds);
    }
    if (team2Id) {
      const roster = rosterRepository.getRoster(team2Id, selectedTournament?.id);
      const starterIds = roster.slice(0, 5).map((m) => m.playerId);
      setTeam2Starters(starterIds);
      const subIds = roster.slice(5, 9).map((m) => m.playerId);
      setTeam2Subs(subIds);
    }
  }, [team1Id, team2Id, selectedTournament]);

  if (!isOpen) return null;

  const validateCurrentStep = (): boolean => {
    setErrorMsg(null);

    if (currentStep === 1) {
      if (!selectedTournament) {
        setErrorMsg('Please select a tournament.');
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      if (!team1Id || !team2Id) {
        setErrorMsg('Both Team A and Team B must be selected.');
        return false;
      }
      if (team1Id === team2Id) {
        setErrorMsg('Team A and Team B must be distinct teams.');
        return false;
      }
      return true;
    }

    if (currentStep === 3) {
      if (team1Starters.length !== 5) {
        setErrorMsg(`Team A must have exactly 5 starting court players (currently ${team1Starters.length}).`);
        return false;
      }
      if (team2Starters.length !== 5) {
        setErrorMsg(`Team B must have exactly 5 starting court players (currently ${team2Starters.length}).`);
        return false;
      }
      return true;
    }

    if (currentStep === 4) {
      if (pointsPerSet < 15 || pointsPerSet > 35) {
        setErrorMsg('Points per set must be configured between 15 and 35 points.');
        return false;
      }
      return true;
    }

    if (currentStep === 5) {
      if (!scheduledDate || !scheduledTime) {
        setErrorMsg('Scheduled date and time are required.');
        return false;
      }
      if (!assignedScorerEmail) {
        setErrorMsg('An authorized official scorer must be assigned to the match.');
        return false;
      }

      // Conflict Detection Safeguards
      const activeMatches = matchRepository.getAll().filter(
        (m) => m.status !== 'completed' && m.status !== 'cancelled'
      );

      // 1. Court Conflict Detection
      const courtConflict = activeMatches.find(
        (m) =>
          m.court.toLowerCase() === court.toLowerCase() &&
          m.scheduledTime.toLowerCase().includes(scheduledDate.toLowerCase()) &&
          m.scheduledTime.toLowerCase().includes(scheduledTime.toLowerCase())
      );
      if (courtConflict) {
        setErrorMsg(
          `Court Conflict: "${court}" is already booked for ${courtConflict.team1.name} vs ${courtConflict.team2.name} at ${scheduledTime}.`
        );
        return false;
      }

      // 2. Team Simultaneous Play Conflict Detection
      const t1 = registeredTeams.find((t) => t.id === team1Id);
      const t2 = registeredTeams.find((t) => t.id === team2Id);

      const teamConflict = activeMatches.find(
        (m) =>
          (m.team1.id === team1Id || m.team2.id === team1Id || m.team1.id === team2Id || m.team2.id === team2Id) &&
          m.scheduledTime.toLowerCase().includes(scheduledDate.toLowerCase()) &&
          m.scheduledTime.toLowerCase().includes(scheduledTime.toLowerCase())
      );
      if (teamConflict) {
        const conflictingTeam =
          teamConflict.team1.id === team1Id || teamConflict.team2.id === team1Id
            ? t1?.name
            : t2?.name;
        setErrorMsg(
          `Team Conflict: "${conflictingTeam || 'A selected team'}" is already scheduled to play another match at ${scheduledTime}.`
        );
        return false;
      }

      // 3. Scorer Double-Booking Conflict Detection
      if (assignedScorerEmail) {
        const scorerConflict = activeMatches.find(
          (m) =>
            m.scorerEmail?.toLowerCase() === assignedScorerEmail.toLowerCase() &&
            m.court.toLowerCase() !== court.toLowerCase() &&
            m.scheduledTime.toLowerCase().includes(scheduledDate.toLowerCase()) &&
            m.scheduledTime.toLowerCase().includes(scheduledTime.toLowerCase())
        );
        if (scorerConflict) {
          setErrorMsg(
            `Scorer Conflict: The assigned official (${assignedScorerEmail}) is already officiating on "${scorerConflict.court}" at ${scheduledTime}.`
          );
          return false;
        }
      }

      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleConfirmAndCreate = () => {
    if (!selectedTournament || !team1Id || !team2Id) return;

    const t1 = registeredTeams.find((t) => t.id === team1Id);
    const t2 = registeredTeams.find((t) => t.id === team2Id);
    if (!t1 || !t2) return;

    const scorer = availableScorers.find((s) => s.email === assignedScorerEmail);

    const positions: Array<'Front / Net' | 'Centre / Pivot' | 'Base / Deep'> = [
      'Front / Net',
      'Front / Net',
      'Centre / Pivot',
      'Base / Deep',
      'Base / Deep',
    ];

    const lineups: MatchLineupItem[] = [
      ...team1Starters.map((pid, idx) => ({
        matchId: '',
        teamId: t1.id,
        playerId: pid,
        playerName: `Player ${idx + 1}`,
        jerseyNumber: (idx + 1) * 2 + 1,
        position: positions[idx] || 'Front / Net',
        isStarting: true,
        isSubstitute: false,
        orderIndex: idx + 1,
      })),
      ...team2Starters.map((pid, idx) => ({
        matchId: '',
        teamId: t2.id,
        playerId: pid,
        playerName: `Player ${idx + 1}`,
        jerseyNumber: (idx + 1) * 2,
        position: positions[idx] || 'Front / Net',
        isStarting: true,
        isSubstitute: false,
        orderIndex: idx + 1,
      })),
    ];

    const matchPayload = {
      tournamentId: selectedTournament.id,
      tournamentName: selectedTournament.name,
      stage,
      category,
      court,
      status: 'upcoming' as const,
      scheduledTime: `${scheduledDate}, ${scheduledTime} IST`,
      team1: t1,
      team2: t2,
      currentSet: 1,
      team1SetsWon: 0,
      team2SetsWon: 0,
      setScores: [],
      maxPointsPerSet: pointsPerSet,
      venue: selectedTournament.venue,
      city: selectedTournament.city,
      referee: scorer ? `${scorer.name} (${scorer.cert || 'BBFI Official'})` : 'B. Ramachandra (BBFI Grade A)',
      scorerEmail: assignedScorerEmail,
      scorerName: scorer?.name || 'Official Scorer',
      lineups,
      configSnapshot: {
        points_per_set: pointsPerSet,
        best_of_sets: bestOfSets,
        serving_system: 'two_hands',
        deuce_enabled: deuceEnabled,
        max_overtime_cap: maxCap,
        court_surface: selectedTournament.surfaceType || 'Outdoor Red Clay',
      },
    };

    const createdMatch = matchRepository.create(matchPayload);

    // Create Scorer Assignment record
    scorerRepository.create({
      scorerName: scorer?.name || 'Assigned Scorer',
      scorerEmail: assignedScorerEmail,
      court,
      matchId: createdMatch.id,
      matchTitle: `${t1.name} vs ${t2.name}`,
      tournamentId: selectedTournament.id,
      tournamentName: selectedTournament.name,
      status: 'assigned',
      certificationLevel: (scorer?.cert as any) || 'BBFI Grade A',
    });

    activityRepository.log({
      action: 'MATCH_WIZARD_CREATED',
      entityType: 'match',
      entityName: `${t1.name} vs ${t2.name}`,
      userName: currentUser?.name || 'Tournament Admin',
      userEmail: currentUser?.email || 'admin@bbfi.org',
      details: `Scheduled match on ${court} with verified 5-player lineups and assigned scorer ${assignedScorerEmail}`,
    });

    toast.success(
      'Match Fixture Created',
      `Successfully scheduled ${t1.shortName} vs ${t2.shortName} with snapshotted BBFI rules.`
    );

    onMatchCreated(createdMatch.id);
    onClose();
  };

  const team1 = registeredTeams.find((t) => t.id === team1Id);
  const team2 = registeredTeams.find((t) => t.id === team2Id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-white border border-border-neutral rounded-2xl sm:rounded-3xl shadow-card-hover overflow-hidden z-10 my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-neutral bg-surface-muted flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-text-primary">
                Match Creation Wizard
              </h2>
              <p className="text-xs text-text-secondary">
                Step {currentStep} of 6 • End-to-end fixture, lineup, and scoring setup
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-border-neutral">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Stepper */}
        <div className="bg-white px-4 sm:px-6 py-3 border-b border-border-neutral flex items-center justify-between text-xs overflow-x-auto no-scrollbar">
          {[
            { step: 1, label: 'Tournament' },
            { step: 2, label: 'Teams' },
            { step: 3, label: 'Lineups' },
            { step: 4, label: 'Rules' },
            { step: 5, label: 'Schedule' },
            { step: 6, label: 'Review' },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-1.5 shrink-0 px-1 sm:px-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                currentStep === item.step
                  ? 'bg-brand-orange text-white ring-2 ring-brand-orange/30'
                  : currentStep > item.step
                  ? 'bg-emerald-500/10 text-status-success border border-emerald-500/30'
                  : 'bg-surface-muted text-text-secondary'
              }`}>
                {currentStep > item.step ? '✓' : item.step}
              </span>
              <span className={`text-[11px] sm:text-xs font-medium ${currentStep === item.step ? 'text-text-primary font-bold inline' : 'text-text-secondary hidden sm:inline'}`}>
                {item.label}
              </span>
              {item.step < 6 && <ChevronRight className="w-3.5 h-3.5 text-text-secondary/60 ml-0.5 sm:ml-1" />}
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-status-live/30 text-status-live text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Wizard Step Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          
          {/* STEP 1: SELECT TOURNAMENT */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Select Host Tournament
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {tournaments.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTournament(t)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedTournament?.id === t.id
                        ? 'bg-brand-soft border-brand-orange text-text-primary shadow-sm'
                        : 'bg-surface-muted border-border-neutral text-text-secondary hover:border-brand-orange/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-text-primary">{t.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white border border-border-neutral font-mono text-brand-orange">
                        {t.format}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      {t.venue}, {t.city} • {t.startDate} to {t.endDate}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT TEAMS */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Select Participating Teams
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Teams must be registered in {selectedTournament?.name}.
                </p>
              </div>

              {registeredTeams.length < 2 ? (
                <div className="p-6 rounded-2xl bg-surface-muted border border-border-neutral text-center">
                  <AlertCircle className="w-8 h-8 text-brand-orange mx-auto mb-2" />
                  <p className="text-sm font-bold text-text-primary">Fewer than 2 Teams Registered</p>
                  <p className="text-xs text-text-secondary mt-1">
                    Please register at least 2 teams to this tournament from the Tournament Directory before scheduling a match.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral">
                    <label className="block text-xs font-semibold text-brand-orange mb-2">
                      TEAM A (Host / Home)
                    </label>
                    <select
                      value={team1Id}
                      onChange={(e) => setTeam1Id(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orange"
                    >
                      {registeredTeams.map((t) => (
                        <option key={t.id} value={t.id} disabled={t.id === team2Id}>
                          {t.name} ({t.shortName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral">
                    <label className="block text-xs font-semibold text-brand-orangeHover mb-2">
                      TEAM B (Visitor / Away)
                    </label>
                    <select
                      value={team2Id}
                      onChange={(e) => setTeam2Id(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-sm text-text-primary focus:outline-none focus:border-brand-orangeHover"
                    >
                      {registeredTeams.map((t) => (
                        <option key={t.id} value={t.id} disabled={t.id === team1Id}>
                          {t.name} ({t.shortName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: STARTING LINEUPS & POSITIONS */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Court Lineups (5 Starters + Up to 4 Bench Substitutes)
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  BBFI regulation positions: 2 Front/Net, 1 Centre/Pivot, 2 Base/Deep.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Team 1 Lineup */}
                <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral">
                  <span className="font-bold text-xs text-brand-orange block mb-2">
                    {team1?.name} Starting Five
                  </span>
                  <div className="space-y-1.5 text-xs text-text-primary">
                    {['Net 1', 'Net 2', 'Centre Pivot', 'Base Deep 1', 'Base Deep 2'].map((pos, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-border-neutral">
                        <span className="text-text-secondary text-[11px]">{pos}:</span>
                        <span className="font-semibold text-text-primary">
                          Player #{team1Starters[idx] || (idx + 1) * 2 + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-[11px] text-status-success flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>5 starters eligible + {team1Subs.length} substitutes on bench</span>
                  </div>
                </div>

                {/* Team 2 Lineup */}
                <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral">
                  <span className="font-bold text-xs text-brand-orangeHover block mb-2">
                    {team2?.name} Starting Five
                  </span>
                  <div className="space-y-1.5 text-xs text-text-primary">
                    {['Net 1', 'Net 2', 'Centre Pivot', 'Base Deep 1', 'Base Deep 2'].map((pos, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-border-neutral">
                        <span className="text-text-secondary text-[11px]">{pos}:</span>
                        <span className="font-semibold text-text-primary">
                          Player #{team2Starters[idx] || (idx + 1) * 2}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-[11px] text-status-success flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>5 starters eligible + {team2Subs.length} substitutes on bench</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SCORING CONFIGURATION */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  BBFI Scoring Configuration Snapshot
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Rules frozen for this fixture upon commencement.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral">
                  <label className="text-text-secondary block mb-1">Target Points Per Set</label>
                  <select
                    value={pointsPerSet}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setPointsPerSet(p);
                      setMaxCap(p + 4);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-border-neutral text-text-primary font-bold"
                  >
                    <option value={29}>29 Points (BBFI Standard)</option>
                    <option value={35}>35 Points (Senior State Extended)</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral">
                  <label className="text-text-secondary block mb-1">Match Format (Sets)</label>
                  <select
                    value={bestOfSets}
                    onChange={(e) => setBestOfSets(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-border-neutral text-text-primary font-bold"
                  >
                    <option value={3}>Best of 3 Sets</option>
                    <option value={5}>Best of 5 Sets</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral">
                  <label className="text-text-secondary block mb-1">Overtime Sudden Death Cap</label>
                  <input
                    type="number"
                    value={maxCap}
                    onChange={(e) => setMaxCap(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-border-neutral text-text-primary font-bold"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral">
                  <label className="text-text-secondary block mb-1">Service Rotation</label>
                  <div className="px-3 py-2 rounded-lg bg-white border border-border-neutral text-text-primary font-bold">
                    Two Hands (1st &amp; 2nd Hand)
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-text-primary font-semibold block">Deuce Rule (Lead by 2)</span>
                    <span className="text-text-secondary text-[11px]">Require a 2-point lead at 28-28 (up to max cap)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={deuceEnabled}
                    onChange={(e) => setDeuceEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SCHEDULING & SCORER */}
          {currentStep === 5 && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Scheduling &amp; Scorer Assignment
                </h3>
                <p className="text-text-secondary mt-0.5">
                  Designate venue court, competition category, and certified scorer official.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary mb-1">Competition Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MatchCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-text-primary"
                  >
                    <option value="Men's Open 5s">Men's Open 5s</option>
                    <option value="Women's Open 5s">Women's Open 5s</option>
                    <option value="Junior Boys 5s">Junior Boys 5s</option>
                    <option value="Junior Girls 5s">Junior Girls 5s</option>
                    <option value="Mixed 5s">Mixed 5s</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-secondary mb-1">Tournament Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as MatchStage)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-text-primary"
                  >
                    <option value="Championship Final">Championship Final</option>
                    <option value="Semi-Final 1">Semi-Final 1</option>
                    <option value="Semi-Final 2">Semi-Final 2</option>
                    <option value="Quarter-Final">Quarter-Final</option>
                    <option value="Super 8 League">Super 8 League</option>
                    <option value="Group Stage">Group Stage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-secondary mb-1">Court</label>
                  <select
                    value={court}
                    onChange={(e) => setCourt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-text-primary"
                  >
                    <option value="Centre Court (Outdoor Red Clay)">Centre Court (Outdoor Red Clay)</option>
                    <option value="Court 2 (North Clay)">Court 2 (North Clay)</option>
                    <option value="Court 3 (East Clay)">Court 3 (East Clay)</option>
                    <option value="Court 4 (Floodlit)">Court 4 (Floodlit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-secondary mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-text-secondary mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-text-primary"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-text-secondary mb-1">
                    Assigned Official Scorer <span className="text-brand-orange">*</span>
                  </label>
                  <select
                    value={assignedScorerEmail}
                    onChange={(e) => setAssignedScorerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-border-neutral text-text-primary font-medium"
                  >
                    {availableScorers.map((s) => (
                      <option key={s.email} value={s.email}>
                        {s.name} ({s.email}) — {s.cert || 'BBFI Certified'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW & CONFIRM */}
          {currentStep === 6 && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-surface-muted border border-border-neutral space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-border-neutral">
                  <span className="font-bold text-sm text-text-primary">{selectedTournament?.name}</span>
                  <span className="px-2 py-0.5 rounded bg-brand-soft text-brand-orange font-bold text-[10px] border border-brand-orange/30">
                    {stage}
                  </span>
                </div>

                <div className="flex items-center justify-around py-2">
                  <div className="text-center">
                    <span className="text-sm font-bold text-brand-orange block">{team1?.name}</span>
                    <span className="text-[11px] text-text-secondary">{team1?.state}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-text-secondary">VS</span>
                  <div className="text-center">
                    <span className="text-sm font-bold text-brand-orangeHover block">{team2?.name}</span>
                    <span className="text-[11px] text-text-secondary">{team2?.state}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-neutral text-[11px] text-text-secondary">
                  <div>Venue: <span className="text-text-primary font-medium">{court}</span></div>
                  <div>Time: <span className="text-text-primary font-medium">{scheduledDate}, {scheduledTime}</span></div>
                  <div>Rules: <span className="text-text-primary font-medium">{pointsPerSet} Pts • Cap {maxCap} • Best of {bestOfSets}</span></div>
                  <div>Scorer: <span className="text-text-primary font-medium">{assignedScorerEmail}</span></div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-brand-soft border border-brand-orange/30 text-brand-orange text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-orange shrink-0" />
                <span>Lineups and rules validated against BBFI 5s standards. Ready to publish fixture.</span>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-4 border-t border-border-neutral bg-surface-muted flex items-center justify-between">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : handleBack}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary border border-border-neutral bg-white hover:bg-surface-muted transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{currentStep === 1 ? 'Cancel' : 'Back'}</span>
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-card transition-all flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmAndCreate}
              className="px-6 py-2.5 rounded-xl bg-status-success hover:bg-emerald-700 text-white font-bold text-xs shadow-card transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Confirm &amp; Schedule Match</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
