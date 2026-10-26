import type { Match } from '../types';
import { LIVE_MATCHES, UPCOMING_MATCHES, RECENT_RESULTS } from '../data/mockData';

const STORAGE_KEY = 'bbfi_matches_v1';

const INITIAL_MATCHES: Match[] = [
  ...LIVE_MATCHES,
  ...UPCOMING_MATCHES,
  ...RECENT_RESULTS,
];

export const matchRepository = {
  getAll(): Match[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MATCHES));
        return [...INITIAL_MATCHES];
      }
      return JSON.parse(stored);
    } catch {
      return [...INITIAL_MATCHES];
    }
  },

  getById(id: string): Match | undefined {
    return this.getAll().find((m) => m.id === id);
  },

  getByStatus(status: Match['status']): Match[] {
    return this.getAll().filter((m) => m.status === status);
  },

  create(match: Omit<Match, 'id'> & { id?: string }): Match {
    const list = this.getAll();
    const newMatch: Match = {
      ...match,
      id: match.id || `match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    list.unshift(newMatch);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return newMatch;
  },

  update(id: string, updates: Partial<Match>): Match {
    const list = this.getAll();
    const index = list.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error(`Match with ID "${id}" not found.`);
    }
    const updated: Match = { ...list[index], ...updates };
    list[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return updated;
  },

  delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter((m) => m.id !== id);
    if (filtered.length !== list.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  },

  resetToDefaults(): Match[] {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MATCHES));
    return INITIAL_MATCHES;
  }
};
