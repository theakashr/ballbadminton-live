import type { TournamentTeamRegistration } from '../types';
import { teamRepository } from './teamRepository';
import { supabase, isSupabaseConfigured, isUuid } from '../lib/supabase';

const STORAGE_KEY = 'bbfi_tournament_teams_v1';

export const INITIAL_TOURNAMENT_TEAMS: TournamentTeamRegistration[] = [
  {
    id: 'reg-01',
    tournamentId: 'tourn-70-senior-nat',
    teamId: 'team-tn',
    registrationStatus: 'confirmed',
    seedNumber: 1,
    groupName: 'Group A',
    registeredAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'reg-02',
    tournamentId: 'tourn-70-senior-nat',
    teamId: 'team-kar',
    registrationStatus: 'confirmed',
    seedNumber: 2,
    groupName: 'Group A',
    registeredAt: '2026-10-01T10:30:00Z',
  },
  {
    id: 'reg-03',
    tournamentId: 'tourn-70-senior-nat',
    teamId: 'team-ap',
    registrationStatus: 'confirmed',
    seedNumber: 3,
    groupName: 'Group B',
    registeredAt: '2026-10-02T11:00:00Z',
  },
  {
    id: 'reg-04',
    tournamentId: 'tourn-70-senior-nat',
    teamId: 'team-ker',
    registrationStatus: 'confirmed',
    seedNumber: 4,
    groupName: 'Group B',
    registeredAt: '2026-10-02T11:30:00Z',
  },
  {
    id: 'reg-05',
    tournamentId: 'tourn-70-senior-nat',
    teamId: 'team-railways',
    registrationStatus: 'confirmed',
    seedNumber: 5,
    groupName: 'Group A',
    registeredAt: '2026-10-03T09:00:00Z',
  },
  {
    id: 'reg-06',
    tournamentId: 'tourn-inter-engg-2026',
    teamId: 'team-psg',
    registrationStatus: 'confirmed',
    seedNumber: 1,
    groupName: 'Pool 1',
    registeredAt: '2026-10-05T14:00:00Z',
  },
  {
    id: 'reg-07',
    tournamentId: 'tourn-inter-engg-2026',
    teamId: 'team-bms',
    registrationStatus: 'confirmed',
    seedNumber: 2,
    groupName: 'Pool 1',
    registeredAt: '2026-10-05T14:30:00Z',
  },
];

export const tournamentTeamRepository = {
  getAll(): TournamentTeamRegistration[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TOURNAMENT_TEAMS));
        return [...INITIAL_TOURNAMENT_TEAMS];
      }
      return JSON.parse(stored);
    } catch {
      return [...INITIAL_TOURNAMENT_TEAMS];
    }
  },

  getByTournament(tournamentId: string): TournamentTeamRegistration[] {
    const registrations = this.getAll().filter((r) => r.tournamentId === tournamentId);
    const allTeams = teamRepository.getAll();

    return registrations.map((r) => ({
      ...r,
      team: allTeams.find((t) => t.id === r.teamId),
    }));
  },

  getByTeam(teamId: string): TournamentTeamRegistration[] {
    return this.getAll().filter((r) => r.teamId === teamId);
  },

  isTeamRegistered(tournamentId: string, teamId: string): boolean {
    return this.getAll().some(
      (r) => r.tournamentId === tournamentId && r.teamId === teamId && r.registrationStatus !== 'withdrawn'
    );
  },

  registerTeam(params: {
    id?: string;
    tournamentId: string;
    teamId: string;
    seedNumber?: number;
    groupName?: string;
    registrationStatus?: 'pending' | 'confirmed' | 'withdrawn' | 'disqualified';
  }): TournamentTeamRegistration {
    const list = this.getAll();

    // Prevent duplicate registrations
    const existing = list.find(
      (r) => r.tournamentId === params.tournamentId && r.teamId === params.teamId
    );
    if (existing) {
      if (existing.registrationStatus === 'withdrawn') {
        // Re-activate
        existing.registrationStatus = params.registrationStatus || 'confirmed';
        existing.seedNumber = params.seedNumber ?? existing.seedNumber;
        existing.groupName = params.groupName ?? existing.groupName;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return existing;
      }
      throw new Error('This team is already registered for this tournament.');
    }

    const newReg: TournamentTeamRegistration = {
      id: params.id || `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tournamentId: params.tournamentId,
      teamId: params.teamId,
      registrationStatus: params.registrationStatus || 'confirmed',
      seedNumber: params.seedNumber,
      groupName: params.groupName || 'Pool A',
      registeredAt: new Date().toISOString(),
    };

    list.push(newReg);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    // Async sync to Supabase if available with valid UUIDs
    if (isSupabaseConfigured() && supabase && isUuid(params.tournamentId) && isUuid(params.teamId)) {
      supabase
        .from('tournament_teams')
        .insert({
          tournament_id: params.tournamentId,
          team_id: params.teamId,
          registration_status: newReg.registrationStatus,
          seed_number: newReg.seedNumber,
          group_name: newReg.groupName,
        })
        .then(({ error }) => {
          if (error) console.warn('Supabase tournament_teams insert error:', error.message);
        });
    }

    return newReg;
  },

  unregisterTeam(tournamentId: string, teamId: string): boolean {
    const list = this.getAll();
    const filtered = list.filter(
      (r) => !(r.tournamentId === tournamentId && r.teamId === teamId)
    );

    if (filtered.length !== list.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

      if (isSupabaseConfigured() && supabase) {
        supabase
          .from('tournament_teams')
          .delete()
          .eq('tournament_id', tournamentId)
          .eq('team_id', teamId)
          .then();
      }
      return true;
    }
    return false;
  },

  resetToDefaults(): TournamentTeamRegistration[] {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TOURNAMENT_TEAMS));
    return [...INITIAL_TOURNAMENT_TEAMS];
  },
};
