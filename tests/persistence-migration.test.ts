import { describe, it, expect, beforeEach } from 'vitest';
import { migrationService } from '../src/services/migrationService';
import { tournamentRepository } from '../src/repositories/tournamentRepository';
import { teamRepository } from '../src/repositories/teamRepository';
import { matchRepository } from '../src/repositories/matchRepository';

describe('Data Persistence & Prototype Migration Services', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Local Prototype JSON Backup Export', () => {
    it('exports all local repositories into a structured JSON snapshot', () => {
      const jsonString = migrationService.exportLocalPrototypeJSON();
      expect(typeof jsonString).toBe('string');

      const parsed = JSON.parse(jsonString);
      expect(parsed.version).toBe('2.2.0');
      expect(parsed.schemaType).toBe('BBFI_BALL_BADMINTON_PROTOTYPE');
      expect(Array.isArray(parsed.tournaments)).toBe(true);
      expect(Array.isArray(parsed.teams)).toBe(true);
      expect(Array.isArray(parsed.players)).toBe(true);
      expect(Array.isArray(parsed.matches)).toBe(true);
      expect(Array.isArray(parsed.scorers)).toBe(true);
      expect(parsed.settings).toBeDefined();
    });
  });

  describe('Local Prototype JSON Restore & Validation', () => {
    it('successfully imports valid JSON snapshot into local storage', () => {
      const mockPayload = {
        version: '2.2.0',
        schemaType: 'BBFI_BALL_BADMINTON_PROTOTYPE',
        tournaments: [
          {
            id: 'tourn-imported-1',
            title: 'Imported National Championship',
            organizer: 'BBFI',
            venue: 'Central Stadium',
            city: 'Chennai',
            state: 'Tamil Nadu',
            startDate: '2026-12-01',
            endDate: '2026-12-05',
            status: 'upcoming',
            totalTeams: 12,
          },
        ],
        teams: [
          {
            id: 'team-imported-1',
            name: 'Pondicherry Warriors',
            shortName: 'PY',
            state: 'Pondicherry',
            captain: 'K. Vignesh',
            coach: 'M. Anand',
            playersCount: 9,
          },
        ],
        players: [],
        matches: [],
        scorers: [],
      };

      const result = migrationService.importLocalPrototypeJSON(JSON.stringify(mockPayload));
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(2);

      const importedTourn = tournamentRepository.getById('tourn-imported-1');
      expect(importedTourn).toBeDefined();
      expect(importedTourn?.title).toBe('Imported National Championship');

      const importedTeam = teamRepository.getById('team-imported-1');
      expect(importedTeam).toBeDefined();
      expect(importedTeam?.name).toBe('Pondicherry Warriors');
    });

    it('gracefully rejects corrupted or invalid JSON strings', () => {
      const result = migrationService.importLocalPrototypeJSON('{ invalid-json, missing: brackets ');
      expect(result.success).toBe(false);
      expect(result.importedCount).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('gracefully rejects non-object JSON literals', () => {
      const result = migrationService.importLocalPrototypeJSON('12345');
      expect(result.success).toBe(false);
      expect(result.importedCount).toBe(0);
    });
  });

  describe('Round-Trip Export & Import Integrity', () => {
    it('preserves tournament and match state throughout export and import cycle', () => {
      const tourn = tournamentRepository.create({
        title: '71st All India Gold Cup',
        organizer: 'All India Association',
        venue: 'Kanteerava Stadium',
        city: 'Bengaluru',
        state: 'Karnataka',
        startDate: '2027-01-10',
        endDate: '2027-01-15',
        status: 'upcoming',
        totalTeams: 20,
      });

      const match = matchRepository.create({
        tournamentId: tourn.id,
        court: 'Court 3',
        round: 'Quarter Final',
        status: 'upcoming',
        team1: { id: 't1', name: 'Telangana', score: 0, sets: 0 },
        team2: { id: 't2', name: 'Andhra Pradesh', score: 0, sets: 0 },
        currentSet: 1,
        setScores: [],
        team1SetsWon: 0,
        team2SetsWon: 0,
        scheduledTime: '11:00 AM',
      });

      const exportBackup = migrationService.exportLocalPrototypeJSON();
      localStorage.clear();

      expect(tournamentRepository.getById(tourn.id)).toBeUndefined();
      expect(matchRepository.getById(match.id)).toBeUndefined();

      const importResult = migrationService.importLocalPrototypeJSON(exportBackup);
      expect(importResult.success).toBe(true);

      expect(tournamentRepository.getById(tourn.id)?.title).toBe('71st All India Gold Cup');
      expect(matchRepository.getById(match.id)?.court).toBe('Court 3');
    });
  });
});
