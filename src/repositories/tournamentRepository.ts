import type { AdminTournament } from '../types';

const STORAGE_KEY = 'bbfi_tournaments_v1';

export const INITIAL_TOURNAMENTS: AdminTournament[] = [
  {
    id: 'tourn-70-senior-nat',
    name: '70th Senior National Ball Badminton Championship 2026',
    description: 'Premier national championship conducted under the auspices of Ball Badminton Federation of India (BBFI), featuring top state teams across India in traditional 5s format.',
    organizer: 'Ball Badminton Federation of India (BBFI)',
    startDate: '2026-10-22',
    endDate: '2026-10-26',
    registrationDeadline: '2026-10-10',
    city: 'Coimbatore',
    venue: 'Jawaharlal Nehru Outdoor Clay Arena',
    format: '5s',
    matchFormat: 'Best of 3 Sets (29 Points per set)',
    category: "Men & Women Senior",
    maxTeams: 32,
    totalTeams: 28,
    registeredTeamsCount: 28,
    courtsCount: 6,
    visibility: 'public',
    registrationStatus: 'closed',
    status: 'live',
    prizePool: '₹5,00,000 + BBFI Trophy',
    surfaceType: 'Outdoor Red Clay',
    ballType: 'BBFI Standard Yellow Woollen Ball (27-30g)',
    chiefReferee: 'B. Ramachandra (BBFI Grade A)',
    contactEmail: 'tournaments@bbfi.org',
    contactPhone: '+91 94432 10987',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-10-22T08:00:00Z',
  },
  {
    id: 'tourn-inter-engg-2026',
    name: 'South Zone Inter-Engineering Ball Badminton Trophy',
    description: 'Inter-Collegiate championship for engineering colleges across Tamil Nadu, Karnataka, Andhra Pradesh, and Kerala competing in collegiate 5s division.',
    organizer: 'All India Inter-University Sports Board & CIT Coimbatore',
    startDate: '2026-10-24',
    endDate: '2026-10-27',
    registrationDeadline: '2026-10-15',
    city: 'Coimbatore',
    venue: 'CIT Sports Complex (Courts 1-4)',
    format: '5s',
    matchFormat: 'Best of 3 Sets (29 Points per set)',
    category: 'Collegiate Open',
    maxTeams: 20,
    totalTeams: 16,
    registeredTeamsCount: 16,
    courtsCount: 4,
    visibility: 'public',
    registrationStatus: 'closed',
    status: 'live',
    prizePool: '₹1,50,000 + Rolling Trophy',
    surfaceType: 'Outdoor Red Clay',
    ballType: 'BBFI Standard Yellow Woollen Ball (27-30g)',
    chiefReferee: 'K. Sundaram (BBFI Grade A)',
    contactEmail: 'sports@citcoimbatore.ac.in',
    contactPhone: '+91 98421 54321',
    createdAt: '2026-09-15T12:00:00Z',
    updatedAt: '2026-10-24T07:30:00Z',
  },
  {
    id: 'tourn-u19-nat-2026',
    name: 'National Junior (U-19) Ball Badminton Championship',
    description: 'Annual National Junior Championship nurturing the next generation of Ball Badminton smashers, pivots, and servers across all states.',
    organizer: 'Tamil Nadu Ball Badminton Association (TNBBA)',
    startDate: '2026-11-04',
    endDate: '2026-11-08',
    registrationDeadline: '2026-10-28',
    city: 'Madurai',
    venue: 'District Sports Authority Complex',
    format: '5s',
    matchFormat: 'Best of 3 Sets (29 Points per set)',
    category: 'Junior Boys & Girls (U-19)',
    maxTeams: 24,
    totalTeams: 22,
    registeredTeamsCount: 22,
    courtsCount: 4,
    visibility: 'public',
    registrationStatus: 'open',
    status: 'upcoming',
    prizePool: '₹2,00,000 + Merit Certificates',
    surfaceType: 'Outdoor Red Clay',
    ballType: 'BBFI Standard Yellow Woollen Ball (27-30g)',
    chiefReferee: 'P. Selvam (State Chief Referee)',
    contactEmail: 'tnbba.madurai@gmail.com',
    contactPhone: '+91 94440 98765',
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-20T14:00:00Z',
  },
  {
    id: 'tourn-south-zone-open-2026',
    name: 'South India Open Ball Badminton Invitation Tournament',
    description: 'Premier floodlit invitation tournament featuring elite club teams and departmental teams across South India.',
    organizer: 'Salem Ball Badminton Club',
    startDate: '2026-11-15',
    endDate: '2026-11-18',
    registrationDeadline: '2026-11-05',
    city: 'Salem',
    venue: 'Municipal Floodlit Stadium',
    format: '5s',
    matchFormat: 'Best of 3 Sets (29 Points per set)',
    category: "Men's Open 5s",
    maxTeams: 16,
    totalTeams: 12,
    registeredTeamsCount: 12,
    courtsCount: 4,
    visibility: 'public',
    registrationStatus: 'open',
    status: 'upcoming',
    prizePool: '₹2,50,000 + Cash Awards',
    surfaceType: 'Outdoor Red Clay',
    ballType: 'BBFI Standard Yellow Woollen Ball (27-30g)',
    chiefReferee: 'M. Shanmugam (BBFI Grade A)',
    contactEmail: 'salemopen@gmail.com',
    contactPhone: '+91 98433 11223',
    createdAt: '2026-10-10T11:00:00Z',
    updatedAt: '2026-10-22T16:00:00Z',
  },
  {
    id: 'tourn-state-championship-2026',
    name: 'Tamil Nadu State Senior Championship 2026',
    description: 'Annual state championship to select the Tamil Nadu state team for the Senior Nationals.',
    organizer: 'Tamil Nadu Ball Badminton Association',
    startDate: '2026-09-10',
    endDate: '2026-09-14',
    registrationDeadline: '2026-09-01',
    city: 'Thanjavur',
    venue: 'Annai Sathya Stadium',
    format: '5s',
    matchFormat: 'Best of 3 Sets (29 Points per set)',
    category: "Men & Women Senior",
    maxTeams: 32,
    totalTeams: 32,
    registeredTeamsCount: 32,
    courtsCount: 6,
    visibility: 'public',
    registrationStatus: 'closed',
    status: 'completed',
    prizePool: '₹3,00,000 + Gold Medals',
    surfaceType: 'Outdoor Red Clay',
    ballType: 'BBFI Standard Yellow Woollen Ball (27-30g)',
    chiefReferee: 'K. Rajendran (Grade A)',
    contactEmail: 'tnbba.state@gmail.com',
    contactPhone: '+91 94441 23456',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-09-15T18:00:00Z',
  }
];

export const tournamentRepository = {
  getStorageMetadata() {
    return {
      storageType: 'localStorage (Browser Prototype)',
      isCloudSynced: false,
      disclaimer: 'Data is stored in browser localStorage. Supabase PostgreSQL cloud sync is active when configured in Phase 2.2.',
      key: STORAGE_KEY,
    };
  },

  getAll(): AdminTournament[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TOURNAMENTS));
        return [...INITIAL_TOURNAMENTS];
      }
      return JSON.parse(stored);
    } catch {
      return [...INITIAL_TOURNAMENTS];
    }
  },

  getById(id: string): AdminTournament | undefined {
    return this.getAll().find((t) => t.id === id);
  },

  create(data: Omit<AdminTournament, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): AdminTournament {
    const list = this.getAll();
    const newTournament: AdminTournament = {
      ...data,
      id: data.id || `tourn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      registeredTeamsCount: data.registeredTeamsCount ?? 0,
      totalTeams: data.totalTeams || data.registeredTeamsCount || 0,
    };
    list.unshift(newTournament);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return newTournament;
  },

  update(id: string, updates: Partial<AdminTournament>): AdminTournament {
    const list = this.getAll();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Tournament with ID "${id}" not found.`);
    }
    const updated: AdminTournament = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return updated;
  },

  archive(id: string): AdminTournament {
    return this.update(id, { status: 'archived' });
  },

  unarchive(id: string): AdminTournament {
    return this.update(id, { status: 'upcoming' });
  },

  delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter((t) => t.id !== id);
    if (filtered.length !== list.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  },

  resetToDefaults(): AdminTournament[] {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TOURNAMENTS));
    return INITIAL_TOURNAMENTS;
  }
};
