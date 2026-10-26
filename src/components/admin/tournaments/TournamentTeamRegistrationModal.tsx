import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Crown
} from 'lucide-react';
import { tournamentTeamRepository } from '../../../repositories/tournamentTeamRepository';
import { teamRepository } from '../../../repositories/teamRepository';
import { rosterRepository } from '../../../repositories/rosterRepository';
import { playerRepository } from '../../../repositories/playerRepository';
import { activityRepository } from '../../../repositories/activityRepository';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import type { AdminTournament, Team, TournamentTeamRegistration, TeamRosterMember } from '../../../types';

interface TournamentTeamRegistrationModalProps {
  tournament: AdminTournament;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const TournamentTeamRegistrationModal: React.FC<TournamentTeamRegistrationModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { currentUser, canManageTournaments } = useAuth();
  const toast = useToast();

  const [registrations, setRegistrations] = useState<TournamentTeamRegistration[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [seedNumber, setSeedNumber] = useState<number>(1);
  const [groupName, setGroupName] = useState<string>('Group A');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Team Roster view
  const [activeRosterTeam, setActiveRosterTeam] = useState<Team | null>(null);
  const [activeRoster, setActiveRoster] = useState<TeamRosterMember[]>([]);
  const [eligibility, setEligibility] = useState<{ isValid: boolean; startersCount: number; substitutesCount: number; captainName?: string; errors: string[] }>({
    isValid: true,
    startersCount: 5,
    substitutesCount: 0,
    errors: [],
  });

  // Assign Player state
  const [isAssignPlayerOpen, setIsAssignPlayerOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState<number>(7);
  const [newPlayerPosition, setNewPlayerPosition] = useState<'Front / Net' | 'Centre / Pivot' | 'Base / Deep'>('Front / Net');
  const [isNewPlayerCaptain, setIsNewPlayerCaptain] = useState(false);

  const reloadData = () => {
    const regs = tournamentTeamRepository.getByTournament(tournament.id);
    setRegistrations(regs);
    const teams = teamRepository.getAll();
    setAllTeams(teams);

    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }

    if (activeRosterTeam) {
      const ros = rosterRepository.getRoster(activeRosterTeam.id, tournament.id);
      setActiveRoster(ros);
      const elig = rosterRepository.validateRosterEligibility(activeRosterTeam.id, tournament.id);
      setEligibility(elig);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadData();
    }
  }, [isOpen, tournament.id]);

  useEffect(() => {
    if (activeRosterTeam) {
      const ros = rosterRepository.getRoster(activeRosterTeam.id, tournament.id);
      setActiveRoster(ros);
      const elig = rosterRepository.validateRosterEligibility(activeRosterTeam.id, tournament.id);
      setEligibility(elig);
    }
  }, [activeRosterTeam]);

  if (!isOpen) return null;

  // Handle Team Registration
  const handleRegisterTeam = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedTeamId) {
      setErrorMsg('Please select a team.');
      return;
    }

    try {
      const reg = tournamentTeamRepository.registerTeam({
        tournamentId: tournament.id,
        teamId: selectedTeamId,
        seedNumber: Number(seedNumber) || 1,
        groupName: groupName.trim() || 'Group A',
        registrationStatus: 'confirmed',
      });

      const team = allTeams.find((t) => t.id === selectedTeamId);

      activityRepository.log({
        action: 'TEAM_REGISTERED',
        entityType: 'tournament',
        entityName: tournament.name,
        userName: currentUser?.name || 'Tournament Director',
        userEmail: currentUser?.email || 'admin@bbfi.org',
        details: `Registered ${team?.name || selectedTeamId} (Seed ${reg.seedNumber}, ${reg.groupName})`,
      });

      toast.success(
        'Team Registered',
        `${team?.name || 'Team'} added to ${tournament.name} (${reg.groupName}).`
      );

      reloadData();
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
      toast.error('Registration Error', err.message);
    }
  };

  // Handle Unregister / Withdraw Team
  const handleUnregisterTeam = (teamId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this team from the tournament?')) {
      return;
    }

    tournamentTeamRepository.unregisterTeam(tournament.id, teamId);
    toast.info('Team Withdrawn', 'Team was removed from tournament registration.');
    if (activeRosterTeam?.id === teamId) {
      setActiveRosterTeam(null);
    }
    reloadData();
    onUpdated();
  };

  // Assign Player to Roster
  const handleAssignPlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRosterTeam) return;

    try {
      let playerId = `p-${Date.now()}`;
      if (newPlayerName.trim()) {
        const createdPlayer = playerRepository.create({
          name: newPlayerName.trim(),
          number: newPlayerJersey,
          position: newPlayerPosition,
          isCaptain: isNewPlayerCaptain,
          teamId: activeRosterTeam.id,
          teamName: activeRosterTeam.name,
          state: activeRosterTeam.state,
        });
        playerId = createdPlayer.id;
      }

      rosterRepository.assignPlayer({
        teamId: activeRosterTeam.id,
        playerId,
        tournamentId: tournament.id,
        jerseyNumber: Number(newPlayerJersey),
        position: newPlayerPosition,
        isCaptain: isNewPlayerCaptain,
      });

      toast.success('Roster Updated', `Assigned #${newPlayerJersey} to ${activeRosterTeam.name}.`);
      setIsAssignPlayerOpen(false);
      setNewPlayerName('');
      setNewPlayerJersey(Math.floor(Math.random() * 20) + 1);
      reloadData();
    } catch (err: any) {
      toast.error('Assignment Error', err.message);
    }
  };

  const registeredTeamIds = new Set(registrations.map((r) => r.teamId));
  const availableTeams = allTeams.filter((t) => !registeredTeamIds.has(t.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-charcoal-950/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-charcoal-900 border border-plum-800 rounded-3xl shadow-elevated overflow-hidden z-10 my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-plum-800 bg-plum-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-plum-800 border border-plum-700 flex items-center justify-center text-brand-orange">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-soft-white">
                Tournament Teams &amp; Rosters
              </h2>
              <p className="text-xs text-muted-grey truncate max-w-lg">
                {tournament.name} • {registrations.length} Teams Registered (Max: {tournament.maxTeams || 32})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-grey hover:text-soft-white hover:bg-charcoal-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-brand-coral/15 border border-brand-coral/40 text-brand-coral text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
          
          {/* LEFT COLUMN: Registered Teams List & Add Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-soft-white">
                Participating Teams ({registrations.length})
              </h3>
              <span className="text-[11px] font-mono text-brand-orange">
                BBFI Sanctioned
              </span>
            </div>

            {/* Register New Team Form */}
            {canManageTournaments && (
              <form onSubmit={handleRegisterTeam} className="p-4 rounded-2xl bg-charcoal-950 border border-charcoal-800 space-y-3">
                <span className="text-xs font-bold text-soft-white block">Register Team to Tournament</span>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-muted-grey block mb-1">Select Registered Team</label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-charcoal-900 border border-charcoal-700 text-soft-white"
                    >
                      {availableTeams.length === 0 ? (
                        <option value="">All existing teams already registered</option>
                      ) : (
                        availableTeams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.state})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-muted-grey block mb-1">Seed Number</label>
                      <input
                        type="number"
                        min={1}
                        max={64}
                        value={seedNumber}
                        onChange={(e) => setSeedNumber(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-soft-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-muted-grey block mb-1">Group / Pool</label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g. Group A"
                        className="w-full px-3 py-1.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-soft-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={availableTeams.length === 0}
                  className="w-full py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover disabled:opacity-40 text-charcoal-950 font-bold text-xs shadow-orange-glow transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Confirm Registration</span>
                </button>
              </form>
            )}

            {/* List of Registered Teams */}
            <div className="space-y-2">
              {registrations.length === 0 ? (
                <div className="p-6 rounded-2xl bg-charcoal-950 border border-charcoal-800 text-center text-xs text-muted-grey">
                  No teams registered for this tournament yet.
                </div>
              ) : (
                registrations.map((reg) => (
                  <div
                    key={reg.id}
                    onClick={() => setActiveRosterTeam(reg.team || null)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      activeRosterTeam?.id === reg.teamId
                        ? 'bg-plum-950/70 border-brand-orange text-soft-white'
                        : 'bg-charcoal-950 border-charcoal-800 hover:border-plum-800 text-muted-grey'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-soft-white text-xs">
                          {reg.team?.name || reg.teamId}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-charcoal-800 text-brand-orange font-mono">
                          Seed #{reg.seedNumber || '-'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-charcoal-800 text-muted-grey">
                          {reg.groupName}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-grey block mt-0.5">
                        {reg.team?.city}, {reg.team?.state} • Captain: {reg.team?.captainName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnregisterTeam(reg.teamId);
                        }}
                        className="p-1.5 rounded-lg text-muted-grey hover:text-brand-coral hover:bg-charcoal-800"
                        title="Withdraw Team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Selected Team Roster & Eligibility */}
          <div className="space-y-4">
            {activeRosterTeam ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-soft-white">
                      {activeRosterTeam.name} Roster
                    </h3>
                    <p className="text-[11px] text-muted-grey">
                      Tournament Squad: {activeRoster.length} / 9 Players
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAssignPlayerOpen(!isAssignPlayerOpen)}
                    className="px-3 py-1.5 rounded-lg bg-plum-800 hover:bg-plum-700 text-soft-white text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Player</span>
                  </button>
                </div>

                {/* Eligibility Banner */}
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                  eligibility.isValid
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-brand-coral/15 border-brand-coral/40 text-brand-coral'
                }`}>
                  {eligibility.isValid ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-brand-coral shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {eligibility.isValid
                        ? 'BBFI Roster Eligible (5 Starting Court Players Verified)'
                        : 'Ineligible Roster Configuration'}
                    </span>
                    {eligibility.errors.map((err, i) => (
                      <p key={i} className="text-[11px] text-soft-white/80 mt-0.5">• {err}</p>
                    ))}
                  </div>
                </div>

                {/* Add Player Form */}
                {isAssignPlayerOpen && (
                  <form onSubmit={handleAssignPlayerSubmit} className="p-3.5 rounded-xl bg-charcoal-950 border border-plum-800 space-y-2 text-xs">
                    <span className="font-bold text-soft-white block">Assign Player to Roster</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-muted-grey block mb-1">Player Name</label>
                        <input
                          type="text"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="Athlete full name"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-soft-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-muted-grey block mb-1">Jersey Number</label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={newPlayerJersey}
                          onChange={(e) => setNewPlayerJersey(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-soft-white font-mono"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-muted-grey block mb-1">Position</label>
                        <select
                          value={newPlayerPosition}
                          onChange={(e) => setNewPlayerPosition(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-soft-white"
                        >
                          <option value="Front / Net">Front / Net</option>
                          <option value="Centre / Pivot">Centre / Pivot</option>
                          <option value="Base / Deep">Base / Deep</option>
                          <option value="Server">Server</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="isCap"
                        checked={isNewPlayerCaptain}
                        onChange={(e) => setIsNewPlayerCaptain(e.target.checked)}
                        className="rounded accent-brand-orange"
                      />
                      <label htmlFor="isCap" className="text-muted-grey text-[11px]">Mark as Team Captain</label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAssignPlayerOpen(false)}
                        className="px-3 py-1 rounded-lg text-muted-grey hover:text-soft-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 rounded-lg bg-brand-orange text-charcoal-950 font-bold"
                      >
                        Assign
                      </button>
                    </div>
                  </form>
                )}

                {/* Roster Members Table */}
                <div className="space-y-1.5">
                  {activeRoster.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl bg-charcoal-950 border border-charcoal-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-charcoal-900 border border-charcoal-700 font-mono font-bold text-brand-orange flex items-center justify-center text-[11px]">
                          #{m.jerseyNumber}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-soft-white">
                              {m.player?.name || `Player #${m.jerseyNumber}`}
                            </span>
                            {m.isCaptain && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold flex items-center gap-1">
                                <Crown className="w-2.5 h-2.5" /> Captain
                              </span>
                            )}
                            {idx < 5 ? (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                                Starter
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-charcoal-800 text-muted-grey text-[9px]">
                                Bench Sub
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-grey">{m.position}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          rosterRepository.removePlayer(activeRosterTeam.id, m.playerId, tournament.id);
                          reloadData();
                        }}
                        className="p-1 rounded text-muted-grey hover:text-brand-coral"
                        title="Remove from roster"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-charcoal-950 border border-charcoal-800 text-center text-xs text-muted-grey">
                Select a registered team from the left to inspect and manage its 5-player court squad and substitutes.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
