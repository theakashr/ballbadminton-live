import type { ScoringSettings } from '../types';

const STORAGE_KEY = 'bbfi_scoring_settings_v1';

export const DEFAULT_SETTINGS: ScoringSettings = {
  pointsPerSet: 29, // Ball Badminton standard 29 points (or 35 points)
  bestOfSets: 3, // 3 sets per match
  servingSystem: 'two_hands', // 1st Hand and 2nd Hand
  deucePointsEnabled: true,
  maxOvertimeCap: 33, // Max cap during deuce rallies
  defaultCourtsCount: 4,
  courtSurface: 'Outdoor Red Clay',
  ballSpecification: 'BBFI Standard Yellow Woollen Ball (27-30g)',
  autoPublishLiveScores: true,
  umpirePinRequired: true,
};

export const settingsRepository = {
  get(): ScoringSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  update(updates: Partial<ScoringSettings>): ScoringSettings {
    const current = this.get();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  reset(): ScoringSettings {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
};
