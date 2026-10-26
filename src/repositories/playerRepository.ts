import type { Player } from '../types';
import { INITIAL_TEAMS } from './teamRepository';

const STORAGE_KEY = 'bbfi_players_v1';

export interface EnrichedPlayer extends Player {
  teamId: string;
  teamName: string;
  state: string;
  experienceYears?: number;
  matchesPlayed?: number;
  pointsScored?: number;
}

const buildInitialPlayers = (): EnrichedPlayer[] => {
  const players: EnrichedPlayer[] = [];
  for (const team of INITIAL_TEAMS) {
    if (team.roster) {
      for (const p of team.roster) {
        players.push({
          ...p,
          teamId: team.id,
          teamName: team.name,
          state: team.state,
          experienceYears: Math.floor(Math.random() * 8) + 2,
          matchesPlayed: Math.floor(Math.random() * 30) + 12,
          pointsScored: Math.floor(Math.random() * 180) + 40,
        });
      }
    }
  }
  return players;
};

export const playerRepository = {
  getAll(): EnrichedPlayer[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const initial = buildInitialPlayers();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(stored);
    } catch {
      return buildInitialPlayers();
    }
  },

  getByTeamId(teamId: string): EnrichedPlayer[] {
    return this.getAll().filter((p) => p.teamId === teamId);
  },

  create(player: Omit<EnrichedPlayer, 'id'>): EnrichedPlayer {
    const list = this.getAll();
    const newPlayer: EnrichedPlayer = {
      ...player,
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      matchesPlayed: player.matchesPlayed ?? 0,
      pointsScored: player.pointsScored ?? 0,
    };
    list.unshift(newPlayer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return newPlayer;
  },

  update(id: string, updates: Partial<EnrichedPlayer>): EnrichedPlayer {
    const list = this.getAll();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Player with ID "${id}" not found.`);
    }
    const updated: EnrichedPlayer = { ...list[index], ...updates };
    list[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return updated;
  },

  delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter((p) => p.id !== id);
    if (filtered.length !== list.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  },

  resetToDefaults(): EnrichedPlayer[] {
    const initial = buildInitialPlayers();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
};
