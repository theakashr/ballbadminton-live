import { supabase, isSupabaseConfigured, isUuid } from '../lib/supabase';
import { tournamentRepository } from '../repositories/tournamentRepository';
import { matchRepository } from '../repositories/matchRepository';
import { tournamentTeamRepository } from '../repositories/tournamentTeamRepository';
import { rosterRepository } from '../repositories/rosterRepository';
import type { 
  Match, 
  AdminTournament, 
  TournamentTeamRegistration, 
  TeamRosterMember,
  MatchStatus
} from '../types';

/**
 * Maps a Supabase relational match row to the client Match interface.
 */
export const mapSupabaseMatchToDomain = (row: any): Match => {
  const games = Array.isArray(row.match_games) ? row.match_games : [];
  games.sort((a: any, b: any) => a.game_number - b.game_number);

  return {
    id: row.id,
    tournamentId: row.tournament_id,
    tournamentName: row.tournament?.name || row.venue || 'Ball Badminton Championship',
    stage: row.stage,
    category: row.category,
    court: row.court,
    status: row.status as MatchStatus,
    scheduledTime: row.scheduled_time 
      ? new Date(row.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'TBD',
    startedAt: row.started_at ? new Date(row.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
    team1: row.team1 ? {
      id: row.team1.id,
      name: row.team1.name,
      shortName: row.team1.short_name,
      state: row.team1.state,
      city: row.team1.city,
      logoBg: row.team1.logo_bg || '#211329',
      accentColor: row.team1.accent_color || '#FF851B',
      captainName: row.team1.captain_name,
      coachName: row.team1.coach_name,
    } : {
      id: row.team1_id || 'team-1',
      name: 'Team 1',
      shortName: 'T1',
      state: 'State',
      city: 'City',
      logoBg: '#211329',
      accentColor: '#FF851B',
      captainName: 'Captain',
    },
    team2: row.team2 ? {
      id: row.team2.id,
      name: row.team2.name,
      shortName: row.team2.short_name,
      state: row.team2.state,
      city: row.team2.city,
      logoBg: row.team2.logo_bg || '#15131B',
      accentColor: row.team2.accent_color || '#FF5B45',
      captainName: row.team2.captain_name,
      coachName: row.team2.coach_name,
    } : {
      id: row.team2_id || 'team-2',
      name: 'Team 2',
      shortName: 'T2',
      state: 'State',
      city: 'City',
      logoBg: '#15131B',
      accentColor: '#FF5B45',
      captainName: 'Captain',
    },
    currentSet: row.current_set || 1,
    team1SetsWon: row.team1_sets_won || 0,
    team2SetsWon: row.team2_sets_won || 0,
    setScores: games.map((g: any) => ({
      gameNumber: g.game_number,
      team1Score: g.team1_score,
      team2Score: g.team2_score,
      isCompleted: g.is_completed,
      winnerTeamId: g.winner_team_id,
      durationMinutes: g.duration_minutes || undefined,
    })),
    servingTeamId: row.serving_team_id,
    servingHand: row.serving_hand,
    maxPointsPerSet: row.max_points_per_set || 29,
    venue: row.venue || 'Federation Stadium',
    city: row.city || 'India',
    notes: row.notes,
    referee: row.referee,
    version: row.version,
    matchDurationMinutes: row.started_at && row.completed_at
      ? Math.round((new Date(row.completed_at).getTime() - new Date(row.started_at).getTime()) / 60000)
      : undefined,
  };
};

/**
 * Maps a Supabase tournament row to the AdminTournament domain interface.
 */
export const mapSupabaseTournamentToDomain = (row: any): AdminTournament => {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    organizer: row.organizer,
    venue: row.venue,
    city: row.city,
    startDate: row.start_date,
    endDate: row.end_date,
    registrationDeadline: row.registration_deadline,
    maxTeams: row.max_teams,
    totalTeams: row.max_teams || 24,
    courtsCount: row.courts_count,
    format: row.format,
    category: row.category,
    matchFormat: row.match_format,
    visibility: row.visibility,
    registrationStatus: row.registration_status,
    status: row.status,
    prizePool: row.prize_pool,
    surfaceType: row.surface_type,
    ballType: row.ball_type,
    chiefReferee: row.chief_referee,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const dataService = {
  /**
   * Fetches tournaments: queries Supabase first, falls back to repository if empty/error.
   */
  async getTournaments(): Promise<AdminTournament[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .eq('is_archived', false)
          .order('start_date', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(mapSupabaseTournamentToDomain);
        }
      } catch (err) {
        console.warn('Supabase getTournaments fallback:', err);
      }
    }
    return tournamentRepository.getAll();
  },

  /**
   * Fetches a single tournament by ID.
   */
  async getTournamentById(id: string): Promise<AdminTournament | undefined> {
    if (isSupabaseConfigured() && supabase && isUuid(id)) {
      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return mapSupabaseTournamentToDomain(data);
        }
      } catch (err) {
        console.warn('Supabase getTournamentById fallback:', err);
      }
    }
    return tournamentRepository.getById(id);
  },

  /**
   * Fetches matches, optionally filtered by status.
   */
  async getMatches(status?: MatchStatus): Promise<Match[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('matches')
          .select(`
            *,
            team1:teams!matches_team1_id_fkey(*),
            team2:teams!matches_team2_id_fkey(*),
            tournament:tournaments!matches_tournament_id_fkey(name),
            match_games(*)
          `)
          .order('scheduled_time', { ascending: true });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(mapSupabaseMatchToDomain);
        }
      } catch (err) {
        console.warn('Supabase getMatches fallback:', err);
      }
    }

    if (status) {
      return matchRepository.getByStatus(status);
    }
    return matchRepository.getAll();
  },

  /**
   * Fetches currently live matches.
   */
  async getLiveMatches(): Promise<Match[]> {
    return this.getMatches('live');
  },

  /**
   * Fetches completed match results.
   */
  async getCompletedMatches(): Promise<Match[]> {
    return this.getMatches('completed');
  },

  /**
   * Fetches matches for a specific tournament ID.
   */
  async getMatchesByTournament(tournamentId: string): Promise<Match[]> {
    if (isSupabaseConfigured() && supabase && isUuid(tournamentId)) {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select(`
            *,
            team1:teams!matches_team1_id_fkey(*),
            team2:teams!matches_team2_id_fkey(*),
            tournament:tournaments!matches_tournament_id_fkey(name),
            match_games(*)
          `)
          .eq('tournament_id', tournamentId)
          .order('scheduled_time', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(mapSupabaseMatchToDomain);
        }
      } catch (err) {
        console.warn('Supabase getMatchesByTournament fallback:', err);
      }
    }

    return matchRepository.getAll().filter((m) => m.tournamentId === tournamentId);
  },

  /**
   * Fetches a match by ID with team details and game scores.
   */
  async getMatchById(id: string): Promise<Match | undefined> {
    if (isSupabaseConfigured() && supabase && isUuid(id)) {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select(`
            *,
            team1:teams!matches_team1_id_fkey(*),
            team2:teams!matches_team2_id_fkey(*),
            tournament:tournaments!matches_tournament_id_fkey(name),
            match_games(*)
          `)
          .eq('id', id)
          .single();

        if (!error && data) {
          return mapSupabaseMatchToDomain(data);
        }
      } catch (err) {
        console.warn('Supabase getMatchById fallback:', err);
      }
    }

    return matchRepository.getById(id);
  },

  /**
   * Fetches chronological score events for a match (authoritative point ledger).
   */
  async getScoreEvents(matchId: string): Promise<any[]> {
    if (isSupabaseConfigured() && supabase && isUuid(matchId)) {
      try {
        const { data, error } = await supabase
          .from('score_events')
          .select('*')
          .eq('match_id', matchId)
          .order('sequence_number', { ascending: true });

        if (!error && Array.isArray(data)) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getScoreEvents error:', err);
      }
    }
    return [];
  },

  /**
   * Fetches registered teams for a tournament.
   */
  async getTournamentTeams(tournamentId: string): Promise<TournamentTeamRegistration[]> {
    if (isSupabaseConfigured() && supabase && isUuid(tournamentId)) {
      try {
        const { data, error } = await supabase
          .from('tournament_teams')
          .select(`
            *,
            team:teams(*)
          `)
          .eq('tournament_id', tournamentId);

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            tournamentId: d.tournament_id,
            teamId: d.team_id,
            team: d.team ? {
              id: d.team.id,
              name: d.team.name,
              shortName: d.team.short_name,
              state: d.team.state,
              city: d.team.city,
              logoBg: d.team.logo_bg,
              accentColor: d.team.accent_color,
              captainName: d.team.captain_name,
            } : undefined,
            registrationStatus: d.registration_status,
            seedNumber: d.seed_number,
            groupName: d.group_name,
            registeredAt: d.registered_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getTournamentTeams fallback:', err);
      }
    }

    return tournamentTeamRepository.getByTournament(tournamentId);
  },

  /**
   * Fetches team roster squad members.
   */
  getTeamRoster(teamId: string, tournamentId?: string): TeamRosterMember[] {
    return rosterRepository.getRoster(teamId, tournamentId);
  },
};
