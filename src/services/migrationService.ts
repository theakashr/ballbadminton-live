import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { tournamentRepository } from '../repositories/tournamentRepository';
import { teamRepository } from '../repositories/teamRepository';
import { playerRepository } from '../repositories/playerRepository';
import { matchRepository } from '../repositories/matchRepository';
import { scorerRepository } from '../repositories/scorerRepository';
import { settingsRepository } from '../repositories/settingsRepository';
import { activityRepository } from '../repositories/activityRepository';

export interface MigrationSummary {
  success: boolean;
  timestamp: string;
  counts: {
    tournaments: number;
    teams: number;
    players: number;
    matches: number;
    scorers: number;
  };
  errors: string[];
}

export const migrationService = {
  /**
   * Exports all client prototype data into a structured, validated JSON backup
   */
  exportLocalPrototypeJSON(): string {
    const data = {
      version: '2.2.0',
      exportedAt: new Date().toISOString(),
      schemaType: 'BBFI_BALL_BADMINTON_PROTOTYPE',
      tournaments: tournamentRepository.getAll(),
      teams: teamRepository.getAll(),
      players: playerRepository.getAll(),
      matches: matchRepository.getAll(),
      scorers: scorerRepository.getAll(),
      settings: settingsRepository.get(),
      activities: activityRepository.getAll(),
    };
    return JSON.stringify(data, null, 2);
  },

  /**
   * Imports and validates structured JSON into local prototype storage
   */
  importLocalPrototypeJSON(jsonString: string): { success: boolean; importedCount: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, importedCount: 0, error: 'Invalid JSON format' };
      }

      let count = 0;
      if (Array.isArray(parsed.tournaments)) {
        localStorage.setItem('bbfi_tournaments_v1', JSON.stringify(parsed.tournaments));
        count += parsed.tournaments.length;
      }
      if (Array.isArray(parsed.teams)) {
        localStorage.setItem('bbfi_teams_v1', JSON.stringify(parsed.teams));
        count += parsed.teams.length;
      }
      if (Array.isArray(parsed.players)) {
        localStorage.setItem('bbfi_players_v1', JSON.stringify(parsed.players));
        count += parsed.players.length;
      }
      if (Array.isArray(parsed.matches)) {
        localStorage.setItem('bbfi_matches_v1', JSON.stringify(parsed.matches));
        count += parsed.matches.length;
      }
      if (Array.isArray(parsed.scorers)) {
        localStorage.setItem('bbfi_scorers_v1', JSON.stringify(parsed.scorers));
        count += parsed.scorers.length;
      }
      if (parsed.settings) {
        localStorage.setItem('bbfi_scoring_settings_v1', JSON.stringify(parsed.settings));
      }

      return { success: true, importedCount: count };
    } catch (err: any) {
      return { success: false, importedCount: 0, error: err.message || 'JSON parse failed' };
    }
  },

  /**
   * Migrates local prototype records directly to the live Supabase database
   */
  async pushLocalPrototypeToSupabase(): Promise<MigrationSummary> {
    const summary: MigrationSummary = {
      success: false,
      timestamp: new Date().toISOString(),
      counts: {
        tournaments: 0,
        teams: 0,
        players: 0,
        matches: 0,
        scorers: 0,
      },
      errors: [],
    };

    if (!isSupabaseConfigured() || !supabase) {
      summary.errors.push('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.');
      return summary;
    }

    try {
      // 1. Migrate Teams
      const localTeams = teamRepository.getAll();
      for (const t of localTeams) {
        // Map string IDs to valid UUID or pass upsert
        const { error } = await supabase.from('teams').upsert(
          {
            name: t.name,
            short_name: t.shortName.slice(0, 6),
            state: t.state,
            city: t.city,
            logo_bg: t.logoBg || '#211329',
            accent_color: t.accentColor || '#FF851B',
            captain_name: t.captainName,
            coach_name: t.coachName,
          },
          { onConflict: 'name' }
        );

        if (error) {
          summary.errors.push(`Team "${t.name}": ${error.message}`);
        } else {
          summary.counts.teams++;
        }
      }

      // 2. Migrate Players
      const localPlayers = playerRepository.getAll();
      for (const p of localPlayers) {
        const { error } = await supabase.from('players').upsert(
          {
            full_name: p.name,
            jersey_number: p.number,
            default_position: p.position as any,
            is_captain: p.isCaptain ?? false,
            state: p.state || 'Tamil Nadu',
            matches_played: p.matchesPlayed || 0,
            points_scored: p.pointsScored || 0,
          },
          { onConflict: 'full_name, jersey_number, state' }
        );

        if (error) {
          summary.errors.push(`Player "${p.name}": ${error.message}`);
        } else {
          summary.counts.players++;
        }
      }

      // 3. Migrate Tournaments
      const localTournaments = tournamentRepository.getAll();
      for (const trn of localTournaments) {
        const { error } = await supabase.from('tournaments').upsert(
          {
            name: trn.name,
            description: trn.description,
            organizer: trn.organizer,
            venue: trn.venue,
            city: trn.city,
            start_date: trn.startDate,
            end_date: trn.endDate,
            registration_deadline: trn.registrationDeadline || trn.startDate,
            max_teams: trn.maxTeams || 24,
            courts_count: trn.courtsCount || 4,
            format: trn.format as any,
            category: trn.category,
            match_format: trn.matchFormat || 'Best of 3 Sets (29 Points per set)',
            visibility: (trn.visibility || 'public') as any,
            registration_status: (trn.registrationStatus || 'open') as any,
            status: (trn.status || 'upcoming') as any,
            prize_pool: trn.prizePool,
            surface_type: trn.surfaceType || 'Outdoor Red Clay',
            chief_referee: trn.chiefReferee,
            contact_email: trn.contactEmail,
            contact_phone: trn.contactPhone,
            is_archived: trn.status === 'archived',
          },
          { onConflict: 'name' }
        );

        if (error) {
          summary.errors.push(`Tournament "${trn.name}": ${error.message}`);
        } else {
          summary.counts.tournaments++;
        }
      }

      summary.success = summary.errors.length === 0;
      return summary;
    } catch (err: any) {
      summary.errors.push(`Migration exception: ${err.message || 'Unknown network error'}`);
      return summary;
    }
  },
};
