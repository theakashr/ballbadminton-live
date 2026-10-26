import type { ScorerAssignment } from '../types';

const STORAGE_KEY = 'bbfi_scorers_v1';

export const INITIAL_SCORERS: ScorerAssignment[] = [
  {
    id: 'scorer-01',
    scorerName: 'B. Ramachandra',
    scorerEmail: 'ramachandra.umpire@bbfi.org',
    court: 'Centre Court (Floodlit)',
    matchId: 'match-live-01',
    matchTitle: 'Tamil Nadu Kings vs Karnataka Spikers (Finals)',
    tournamentId: 'tourn-70-senior-nat',
    tournamentName: '70th Senior National Ball Badminton Championship 2026',
    status: 'active_scoring',
    assignedAt: '2026-10-25T17:30:00Z',
    certificationLevel: 'BBFI Grade A',
    phone: '+91 98410 88776',
  },
  {
    id: 'scorer-02',
    scorerName: 'K. Sundaram',
    scorerEmail: 'sundaram.umpire@bbfi.org',
    court: 'Court 2 (North Pavilion)',
    matchId: 'match-live-02',
    matchTitle: 'Andhra Pradhans vs Kerala Strikers (Women Final)',
    tournamentId: 'tourn-70-senior-nat',
    tournamentName: '70th Senior National Ball Badminton Championship 2026',
    status: 'active_scoring',
    assignedAt: '2026-10-25T17:45:00Z',
    certificationLevel: 'BBFI Grade A',
    phone: '+91 94431 22334',
  },
  {
    id: 'scorer-03',
    scorerName: 'M. Shanmugam',
    scorerEmail: 'm.shanmugam@bbfi.org',
    court: 'Court 3 (East Clay)',
    matchId: undefined,
    matchTitle: 'Upcoming Quarter-Final Rallies',
    tournamentId: 'tourn-inter-engg-2026',
    tournamentName: 'South Zone Inter-Engineering Ball Badminton Trophy',
    status: 'assigned',
    assignedAt: '2026-10-25T16:00:00Z',
    certificationLevel: 'BBFI Grade B',
    phone: '+91 98402 33445',
  },
  {
    id: 'scorer-04',
    scorerName: 'P. Selvam',
    scorerEmail: 'selvam.official@bbfi.org',
    court: 'Standby / Official Table',
    matchId: undefined,
    tournamentId: 'tourn-70-senior-nat',
    tournamentName: '70th Senior National Ball Badminton Championship 2026',
    status: 'available',
    assignedAt: '2026-10-25T14:00:00Z',
    certificationLevel: 'State Umpire',
    phone: '+91 97901 44556',
  },
  {
    id: 'scorer-05',
    scorerName: 'N. Raghavendra',
    scorerEmail: 'raghavendra.umpire@bbfi.org',
    court: 'Court 1 (Madurai Complex)',
    tournamentId: 'tourn-u19-nat-2026',
    tournamentName: 'National Junior (U-19) Ball Badminton Championship',
    status: 'assigned',
    assignedAt: '2026-10-24T11:00:00Z',
    certificationLevel: 'BBFI Grade A',
    phone: '+91 98450 66778',
  }
];

export const scorerRepository = {
  getAll(): ScorerAssignment[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SCORERS));
        return [...INITIAL_SCORERS];
      }
      return JSON.parse(stored);
    } catch {
      return [...INITIAL_SCORERS];
    }
  },

  create(assignment: Omit<ScorerAssignment, 'id' | 'assignedAt'>): ScorerAssignment {
    const list = this.getAll();
    const newAssignment: ScorerAssignment = {
      ...assignment,
      id: `scorer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      assignedAt: new Date().toISOString(),
    };
    list.unshift(newAssignment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return newAssignment;
  },

  update(id: string, updates: Partial<ScorerAssignment>): ScorerAssignment {
    const list = this.getAll();
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Scorer with ID "${id}" not found.`);
    }
    const updated: ScorerAssignment = { ...list[index], ...updates };
    list[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return updated;
  },

  delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length !== list.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  },

  getByMatchId(matchId: string): ScorerAssignment | undefined {
    return this.getAll().find((s) => s.matchId === matchId);
  },

  /**
   * Evaluates if user has permission to score a match based on their role and scorer assignment
   */
  isAuthorizedToScore(matchScorerEmail?: string, user?: { role?: string; email?: string } | null): boolean {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'tournament_admin') return true;
    if (user.role === 'official_scorer') {
      if (!matchScorerEmail) return true; // unassigned fixture open to official scorers
      return matchScorerEmail.toLowerCase() === user.email?.toLowerCase();
    }
    return false;
  },

  resetToDefaults(): ScorerAssignment[] {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SCORERS));
    return INITIAL_SCORERS;
  }
};
