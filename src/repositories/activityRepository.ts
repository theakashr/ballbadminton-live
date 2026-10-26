import type { ActivityLog } from '../types';

const STORAGE_KEY = 'bbfi_activities_v1';

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-01',
    timestamp: '2026-10-25T16:15:00Z',
    action: 'Scorer Assignment Updated',
    entityType: 'scorer',
    entityName: 'B. Ramachandra',
    userName: 'Akash R (Super Admin)',
    userEmail: 'akashakashr505@gmail.com',
    details: 'Assigned to Centre Court for Men Championship Final rally',
  },
  {
    id: 'act-02',
    timestamp: '2026-10-25T15:40:00Z',
    action: 'Match Status Updated to LIVE',
    entityType: 'match',
    entityName: 'Tamil Nadu Kings vs Karnataka Spikers',
    userName: 'Court Umpire',
    userEmail: 'ramachandra.umpire@bbfi.org',
    details: 'Set 3 decider started (24 - 21)',
  },
  {
    id: 'act-03',
    timestamp: '2026-10-25T14:10:00Z',
    action: 'Tournament Schedule Published',
    entityType: 'tournament',
    entityName: 'South Zone Inter-Engineering Ball Badminton Trophy',
    userName: 'Akash R (Super Admin)',
    userEmail: 'akashakashr505@gmail.com',
    details: '16 collegiate teams confirmed across 4 clay courts',
  },
  {
    id: 'act-04',
    timestamp: '2026-10-25T12:30:00Z',
    action: 'New Team Registered',
    entityType: 'team',
    entityName: 'Salem Spikers Club',
    userName: 'Salem Club Manager',
    userEmail: 'salemopen@gmail.com',
    details: 'Registered for South India Open 5s',
  },
  {
    id: 'act-05',
    timestamp: '2026-10-25T10:00:00Z',
    action: 'Admin Access Granted',
    entityType: 'user',
    entityName: 'Tournament Director Coimbatore',
    userName: 'Akash R (Super Admin)',
    userEmail: 'akashakashr505@gmail.com',
    details: 'Granted Tournament Admin privileges for 70th Nationals',
  }
];

export const activityRepository = {
  getAll(): ActivityLog[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITIES));
        return INITIAL_ACTIVITIES;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_ACTIVITIES;
    }
  },

  log(entry: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog {
    const list = this.getAll();
    const newEntry: ActivityLog = {
      ...entry,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newEntry);
    // keep maximum 50 activities in prototype storage
    if (list.length > 50) {
      list.length = 50;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return newEntry;
  },

  resetToDefaults(): ActivityLog[] {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITIES));
    return INITIAL_ACTIVITIES;
  }
};
