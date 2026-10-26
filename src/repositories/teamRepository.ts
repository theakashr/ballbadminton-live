import type { Team } from '../types';

const STORAGE_KEY = 'bbfi_teams_v1';

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-tn',
    name: 'Tamil Nadu Kings',
    shortName: 'TNK',
    state: 'Tamil Nadu',
    city: 'Chennai',
    logoBg: '#211329',
    accentColor: '#FF851B',
    captainName: 'K. Vignesh (Chief Smasher)',
    coachName: 'M. Shanmugam',
    roster: [
      { id: 'p1', name: 'K. Vignesh', number: 7, position: 'Front / Net', isCaptain: true },
      { id: 'p2', name: 'R. Aravind', number: 4, position: 'Server' },
      { id: 'p3', name: 'S. Karthik', number: 9, position: 'Centre / Pivot' },
      { id: 'p4', name: 'V. Prakash', number: 11, position: 'Base / Deep' },
      { id: 'p5', name: 'M. Dinesh', number: 3, position: 'Base / Deep' },
    ]
  },
  {
    id: 'team-kar',
    name: 'Karnataka Spikers',
    shortName: 'KAR',
    state: 'Karnataka',
    city: 'Bengaluru',
    logoBg: '#15131B',
    accentColor: '#FF5B45',
    captainName: 'P. Chethan (Pivot Master)',
    coachName: 'N. Raghavendra',
    roster: [
      { id: 'p6', name: 'P. Chethan', number: 10, position: 'Centre / Pivot', isCaptain: true },
      { id: 'p7', name: 'B. Manoj Kumar', number: 8, position: 'Front / Net' },
      { id: 'p8', name: 'H. Darshan', number: 2, position: 'Server' },
      { id: 'p9', name: 'A. Sandeep', number: 5, position: 'Base / Deep' },
      { id: 'p10', name: 'T. Naveen', number: 12, position: 'Base / Deep' },
    ]
  },
  {
    id: 'team-ap',
    name: 'Andhra Pradhans',
    shortName: 'APW',
    state: 'Andhra Pradesh',
    city: 'Vijayawada',
    logoBg: '#2A1834',
    accentColor: '#FF851B',
    captainName: 'Lakshmi Priya',
    coachName: 'V. Narayana Rao',
    roster: [
      { id: 'p11', name: 'Lakshmi Priya', number: 1, position: 'Server', isCaptain: true },
      { id: 'p12', name: 'G. Swathi', number: 6, position: 'Front / Net' },
      { id: 'p13', name: 'K. Bhavani', number: 4, position: 'Centre / Pivot' },
      { id: 'p14', name: 'M. Keerthi', number: 8, position: 'Base / Deep' },
      { id: 'p15', name: 'T. Jyothi', number: 9, position: 'Base / Deep' },
    ]
  },
  {
    id: 'team-ker',
    name: 'Kerala Strikers',
    shortName: 'KER',
    state: 'Kerala',
    city: 'Kozhikode',
    logoBg: '#1C1924',
    accentColor: '#FF5B45',
    captainName: 'Anitha Varghese',
    coachName: 'George Joseph',
    roster: [
      { id: 'p16', name: 'Anitha Varghese', number: 7, position: 'Front / Net', isCaptain: true },
      { id: 'p17', name: 'R. Sneha', number: 3, position: 'Server' },
      { id: 'p18', name: 'Fathima Noor', number: 5, position: 'Centre / Pivot' },
      { id: 'p19', name: 'Aswathy Nair', number: 10, position: 'Base / Deep' },
      { id: 'p20', name: 'Merin Paul', number: 2, position: 'Base / Deep' },
    ]
  },
  {
    id: 'team-tel',
    name: 'Telangana Warriors',
    shortName: 'TEL',
    state: 'Telangana',
    city: 'Hyderabad',
    logoBg: '#2A1834',
    accentColor: '#FF5B45',
    captainName: 'Sanjay Reddy',
    coachName: 'B. Krishna Murthy',
    roster: [
      { id: 'p21', name: 'Sanjay Reddy', number: 11, position: 'Centre / Pivot', isCaptain: true },
      { id: 'p22', name: 'R. Pranay', number: 7, position: 'Front / Net' },
      { id: 'p23', name: 'V. Naresh', number: 4, position: 'Server' },
      { id: 'p24', name: 'K. Rahul', number: 9, position: 'Base / Deep' },
      { id: 'p25', name: 'M. Srikanth', number: 5, position: 'Base / Deep' },
    ]
  },
  {
    id: 'team-pud',
    name: 'Puducherry Aces',
    shortName: 'PUD',
    state: 'Puducherry',
    city: 'Puducherry',
    logoBg: '#15131B',
    accentColor: '#FF5B45',
    captainName: 'J. David',
    coachName: 'P. Balakrishnan',
  },
  {
    id: 'team-mit',
    name: 'MIT Anna University',
    shortName: 'MIT',
    state: 'Tamil Nadu',
    city: 'Chennai',
    logoBg: '#211329',
    accentColor: '#FF851B',
    captainName: 'Arun Kumar',
    coachName: 'Dr. R. Natarajan',
  },
  {
    id: 'team-bms',
    name: 'BMS College Titans',
    shortName: 'BMS',
    state: 'Karnataka',
    city: 'Bengaluru',
    logoBg: '#15131B',
    accentColor: '#FF5B45',
    captainName: 'Varun Hegde',
    coachName: 'S. Ramamurthy',
  }
];

export const teamRepository = {
  getAll(): Team[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TEAMS));
        return [...INITIAL_TEAMS];
      }
      return JSON.parse(stored);
    } catch {
      return [...INITIAL_TEAMS];
    }
  },

  getById(id: string): Team | undefined {
    return this.getAll().find((t) => t.id === id);
  },

  create(team: Omit<Team, 'id'>): Team {
    const list = this.getAll();
    const newTeam: Team = {
      ...team,
      id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      roster: team.roster || [],
    };
    list.unshift(newTeam);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return newTeam;
  },

  update(id: string, updates: Partial<Team>): Team {
    const list = this.getAll();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Team with ID "${id}" not found.`);
    }
    const updated: Team = { ...list[index], ...updates };
    list[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return updated;
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

  resetToDefaults(): Team[] {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TEAMS));
    return INITIAL_TEAMS;
  }
};
