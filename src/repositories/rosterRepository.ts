import type { TeamRosterMember } from '../types';
import { playerRepository } from './playerRepository';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY = 'bbfi_team_rosters_v1';

// Initial starter roster data for premier teams
export const INITIAL_ROSTERS: TeamRosterMember[] = [
  // Tamil Nadu Kings (team-tn)
  { id: 'ros-tn-1', teamId: 'team-tn', playerId: 'p1', jerseyNumber: 7, position: 'Front / Net', isCaptain: true, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },
  { id: 'ros-tn-2', teamId: 'team-tn', playerId: 'p2', jerseyNumber: 4, position: 'Front / Net', isCaptain: false, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },
  { id: 'ros-tn-3', teamId: 'team-tn', playerId: 'p3', jerseyNumber: 9, position: 'Centre / Pivot', isCaptain: false, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },
  { id: 'ros-tn-4', teamId: 'team-tn', playerId: 'p4', jerseyNumber: 11, position: 'Base / Deep', isCaptain: false, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },
  { id: 'ros-tn-5', teamId: 'team-tn', playerId: 'p5', jerseyNumber: 3, position: 'Base / Deep', isCaptain: false, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },

  // Karnataka Spikers (team-kar)
  { id: 'ros-kar-1', teamId: 'team-kar', playerId: 'p6', jerseyNumber: 10, position: 'Front / Net', isCaptain: true, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },
  { id: 'ros-kar-2', teamId: 'team-kar', playerId: 'p7', jerseyNumber: 8, position: 'Front / Net', isCaptain: false, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },
  { id: 'ros-kar-3', teamId: 'team-kar', playerId: 'p8', jerseyNumber: 5, position: 'Centre / Pivot', isCaptain: false, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },
  { id: 'ros-kar-4', teamId: 'team-kar', playerId: 'p9', jerseyNumber: 2, position: 'Base / Deep', isCaptain: false, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },
  { id: 'ros-kar-5', teamId: 'team-kar', playerId: 'p10', jerseyNumber: 12, position: 'Base / Deep', isCaptain: false, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },

  // Indian Railways (team-railways)
  { id: 'ros-rw-1', teamId: 'team-railways', playerId: 'p11', jerseyNumber: 1, position: 'Front / Net', isCaptain: true, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },
  { id: 'ros-rw-2', teamId: 'team-railways', playerId: 'p12', jerseyNumber: 6, position: 'Front / Net', isCaptain: false, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },
  { id: 'ros-rw-3', teamId: 'team-railways', playerId: 'p13', jerseyNumber: 7, position: 'Centre / Pivot', isCaptain: false, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },
  { id: 'ros-rw-4', teamId: 'team-railways', playerId: 'p14', jerseyNumber: 14, position: 'Base / Deep', isCaptain: false, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },
  { id: 'ros-rw-5', teamId: 'team-railways', playerId: 'p15', jerseyNumber: 18, position: 'Base / Deep', isCaptain: false, isActive: true, registeredAt: '2026-10-01T00:00:00Z' },
];

export const rosterRepository = {
  getAll(): TeamRosterMember[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ROSTERS));
        return [...INITIAL_ROSTERS];
      }
      return JSON.parse(stored);
    } catch {
      return [...INITIAL_ROSTERS];
    }
  },

  getRoster(teamId: string, tournamentId?: string): TeamRosterMember[] {
    const list = this.getAll().filter((m) => {
      if (m.teamId !== teamId) return false;
      if (tournamentId && m.tournamentId && m.tournamentId !== tournamentId) return false;
      return true;
    });

    const allPlayers = playerRepository.getAll();
    return list.map((m) => ({
      ...m,
      player: allPlayers.find((p) => p.id === m.playerId) || {
        id: m.playerId,
        name: `Player #${m.jerseyNumber}`,
        number: m.jerseyNumber,
        position: m.position,
        isCaptain: m.isCaptain,
      },
    }));
  },

  assignPlayer(params: {
    teamId: string;
    playerId: string;
    tournamentId?: string;
    jerseyNumber: number;
    position: 'Front / Net' | 'Centre / Pivot' | 'Base / Deep' | 'Server';
    isCaptain?: boolean;
  }): TeamRosterMember {
    const list = this.getAll();

    // Check duplicate player
    const existing = list.find(
      (m) => m.teamId === params.teamId && m.playerId === params.playerId && (!params.tournamentId || m.tournamentId === params.tournamentId)
    );
    if (existing) {
      throw new Error('This player is already assigned to this team roster.');
    }

    // Check duplicate jersey number
    const duplicateJersey = list.find(
      (m) => m.teamId === params.teamId && 
             (!params.tournamentId || !m.tournamentId || m.tournamentId === params.tournamentId) &&
             m.jerseyNumber === params.jerseyNumber
    );
    if (duplicateJersey) {
      throw new Error(`Jersey number #${params.jerseyNumber} is already taken by another player in this team.`);
    }

    // Check squad size limit (BBFI max squad is 9: 5 starters + 4 substitutes)
    const currentTeamMembers = list.filter(
      (m) => m.teamId === params.teamId && 
             (!params.tournamentId || !m.tournamentId || m.tournamentId === params.tournamentId)
    );
    if (currentTeamMembers.length >= 9) {
      throw new Error('Roster limit reached: BBFI regulations permit a maximum squad of 9 players (5 starters + 4 substitutes).');
    }

    // If new player is captain, demote existing captain
    if (params.isCaptain) {
      for (const m of list) {
        if (m.teamId === params.teamId && m.isCaptain) {
          m.isCaptain = false;
        }
      }
    }

    const newMember: TeamRosterMember = {
      id: `ros-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      teamId: params.teamId,
      playerId: params.playerId,
      tournamentId: params.tournamentId,
      jerseyNumber: params.jerseyNumber,
      position: params.position,
      isCaptain: Boolean(params.isCaptain),
      isActive: true,
      registeredAt: new Date().toISOString(),
    };

    list.push(newMember);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('team_rosters')
        .insert({
          team_id: params.teamId,
          player_id: params.playerId,
          tournament_id: params.tournamentId,
          jersey_number: params.jerseyNumber,
          position: params.position,
          is_captain: newMember.isCaptain,
          is_active: true,
        })
        .then();
    }

    return newMember;
  },

  removePlayer(teamId: string, playerId: string, tournamentId?: string): boolean {
    const list = this.getAll();
    const filtered = list.filter(
      (m) => !(m.teamId === teamId && m.playerId === playerId && (!tournamentId || m.tournamentId === tournamentId))
    );

    if (filtered.length !== list.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

      if (isSupabaseConfigured() && supabase) {
        supabase
          .from('team_rosters')
          .delete()
          .eq('team_id', teamId)
          .eq('player_id', playerId)
          .then();
      }
      return true;
    }
    return false;
  },

  setCaptain(teamId: string, playerId: string, tournamentId?: string): void {
    const list = this.getAll();
    let found = false;

    for (const m of list) {
      if (m.teamId === teamId && (!tournamentId || m.tournamentId === tournamentId)) {
        if (m.playerId === playerId) {
          m.isCaptain = true;
          found = true;
        } else {
          m.isCaptain = false;
        }
      }
    }

    if (found) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      if (isSupabaseConfigured() && supabase) {
        supabase
          .from('team_rosters')
          .update({ is_captain: true })
          .eq('team_id', teamId)
          .eq('player_id', playerId)
          .then();
      }
    }
  },

  /**
   * Validates BBFI 5s roster compliance:
   * - Minimum 5 starters
   * - Maximum 4 substitutes (total max 9)
   * - Exactly 1 captain
   * - Unique jersey numbers
   */
  validateRosterEligibility(teamId: string, tournamentId?: string): {
    isValid: boolean;
    startersCount: number;
    substitutesCount: number;
    captainName?: string;
    errors: string[];
  } {
    const members = this.getRoster(teamId, tournamentId);
    const errors: string[] = [];

    const totalCount = members.length;
    const startersCount = Math.min(totalCount, 5);
    const substitutesCount = Math.max(0, totalCount - 5);

    if (totalCount < 5) {
      errors.push(`Incomplete Squad: Ball Badminton 5s requires a minimum of 5 court players (currently ${totalCount}).`);
    }

    if (substitutesCount > 4) {
      errors.push(`Exceeded Bench: BBFI regulations permit at most 4 substitutes per match (currently ${substitutesCount}).`);
    }

    const captain = members.find((m) => m.isCaptain);
    if (!captain) {
      errors.push('No Team Captain designated. Exactly one player must be marked as Captain.');
    }

    // Check unique jerseys
    const jerseys = new Set<number>();
    for (const m of members) {
      if (jerseys.has(m.jerseyNumber)) {
        errors.push(`Duplicate jersey number #${m.jerseyNumber} detected.`);
      }
      jerseys.add(m.jerseyNumber);
    }

    return {
      isValid: errors.length === 0,
      startersCount,
      substitutesCount,
      captainName: captain?.player?.name,
      errors,
    };
  },

  resetToDefaults(): TeamRosterMember[] {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ROSTERS));
    return [...INITIAL_ROSTERS];
  },
};
