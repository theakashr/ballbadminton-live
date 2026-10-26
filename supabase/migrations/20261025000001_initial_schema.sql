-- ==============================================================================
-- Migration 01: Core Ball Badminton PostgreSQL Schema
-- Tables: profiles, scoring_configs, tournaments, teams, players,
--         tournament_teams, team_rosters, matches, match_lineups,
--         match_games, score_events, scorer_assignments, audit_logs
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'tournament_admin', 'official_scorer', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tournament_format AS ENUM ('5s', 'Doubles', 'Mixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tournament_visibility AS ENUM ('public', 'unlisted', 'draft');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tournament_registration_status AS ENUM ('open', 'closed', 'invite-only', 'upcoming');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tournament_status AS ENUM ('upcoming', 'live', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE match_status AS ENUM ('upcoming', 'live', 'completed', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE player_position AS ENUM ('Front / Net', 'Centre / Pivot', 'Base / Deep', 'Server');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE scorer_status AS ENUM ('assigned', 'active_scoring', 'available', 'offline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE score_event_type AS ENUM (
        'rally_point',
        'service_fault',
        'ace',
        'penalty_point',
        'undo',
        'timeout',
        'substitution',
        'set_complete',
        'match_complete'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Profiles Table (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    designation TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Scoring Configurations Table
CREATE TABLE IF NOT EXISTS public.scoring_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    points_per_set INT NOT NULL DEFAULT 29 CHECK (points_per_set IN (29, 35)),
    best_of_sets INT NOT NULL DEFAULT 3 CHECK (best_of_sets IN (1, 3, 5)),
    serving_system TEXT NOT NULL DEFAULT 'two_hands' CHECK (serving_system IN ('two_hands', 'single_hand')),
    deuce_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_overtime_cap INT NOT NULL DEFAULT 33 CHECK (max_overtime_cap >= points_per_set),
    court_surface TEXT NOT NULL DEFAULT 'Outdoor Red Clay',
    ball_specification TEXT NOT NULL DEFAULT 'BBFI Standard Yellow Woollen Ball (27-30g)',
    auto_publish BOOLEAN NOT NULL DEFAULT TRUE,
    umpire_pin_required BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Tournaments Table
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    organizer TEXT NOT NULL,
    venue TEXT NOT NULL,
    city TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL CHECK (end_date >= start_date),
    registration_deadline DATE CHECK (registration_deadline IS NULL OR registration_deadline <= start_date),
    max_teams INT NOT NULL DEFAULT 24 CHECK (max_teams >= 2 AND max_teams <= 64),
    courts_count INT NOT NULL DEFAULT 4 CHECK (courts_count >= 1 AND courts_count <= 24),
    format tournament_format NOT NULL DEFAULT '5s',
    category TEXT NOT NULL DEFAULT 'Men''s Open 5s',
    match_format TEXT NOT NULL DEFAULT 'Best of 3 Sets (29 Points per set)',
    visibility tournament_visibility NOT NULL DEFAULT 'public',
    registration_status tournament_registration_status NOT NULL DEFAULT 'open',
    status tournament_status NOT NULL DEFAULT 'upcoming',
    prize_pool TEXT,
    surface_type TEXT DEFAULT 'Outdoor Red Clay',
    ball_type TEXT DEFAULT 'BBFI Standard Yellow Woollen Ball (27-30g)',
    chief_referee TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_name VARCHAR(6) NOT NULL,
    state TEXT NOT NULL,
    city TEXT NOT NULL,
    logo_bg TEXT NOT NULL DEFAULT '#211329',
    accent_color TEXT NOT NULL DEFAULT '#FF851B',
    captain_name TEXT NOT NULL,
    coach_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Players Table
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    jersey_number INT NOT NULL CHECK (jersey_number >= 1 AND jersey_number <= 99),
    default_position player_position NOT NULL DEFAULT 'Front / Net',
    is_captain BOOLEAN NOT NULL DEFAULT FALSE,
    state TEXT NOT NULL,
    experience_years INT DEFAULT 3,
    matches_played INT NOT NULL DEFAULT 0,
    points_scored INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Tournament Teams (Registration link)
CREATE TABLE IF NOT EXISTS public.tournament_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE RESTRICT,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
    registration_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (registration_status IN ('pending', 'confirmed', 'withdrawn', 'disqualified')),
    seed_number INT,
    group_name TEXT,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tournament_id, team_id)
);

-- 7. Team Rosters (Squad membership)
CREATE TABLE IF NOT EXISTS public.team_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
    jersey_number INT CHECK (jersey_number >= 1 AND jersey_number <= 99),
    position player_position NOT NULL DEFAULT 'Front / Net',
    is_captain BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(team_id, player_id, tournament_id)
);

-- 8. Matches Table
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE RESTRICT,
    stage TEXT NOT NULL DEFAULT 'Group Stage',
    category TEXT NOT NULL DEFAULT 'Men''s Open 5s',
    court TEXT NOT NULL DEFAULT 'Centre Court',
    status match_status NOT NULL DEFAULT 'upcoming',
    scheduled_time TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    team1_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
    team2_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
    CHECK (team1_id <> team2_id),
    current_set INT NOT NULL DEFAULT 1 CHECK (current_set >= 1 AND current_set <= 5),
    team1_sets_won INT NOT NULL DEFAULT 0 CHECK (team1_sets_won >= 0 AND team1_sets_won <= 3),
    team2_sets_won INT NOT NULL DEFAULT 0 CHECK (team2_sets_won >= 0 AND team2_sets_won <= 3),
    serving_team_id UUID REFERENCES public.teams(id),
    serving_hand INT NOT NULL DEFAULT 1 CHECK (serving_hand IN (1, 2)),
    max_points_per_set INT NOT NULL DEFAULT 29 CHECK (max_points_per_set IN (29, 35)),
    venue TEXT NOT NULL,
    city TEXT NOT NULL,
    referee TEXT,
    notes TEXT,
    version INT NOT NULL DEFAULT 1,
    config_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Match Lineups
CREATE TABLE IF NOT EXISTS public.match_lineups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
    position player_position NOT NULL,
    is_starting BOOLEAN NOT NULL DEFAULT TRUE,
    is_substitute BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT NOT NULL DEFAULT 1,
    UNIQUE(match_id, player_id)
);

-- 10. Match Games (Sets)
CREATE TABLE IF NOT EXISTS public.match_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    game_number INT NOT NULL CHECK (game_number >= 1 AND game_number <= 5),
    team1_score INT NOT NULL DEFAULT 0 CHECK (team1_score >= 0),
    team2_score INT NOT NULL DEFAULT 0 CHECK (team2_score >= 0),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    duration_minutes INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(match_id, game_number)
);

-- 11. Score Events (Authoritative Point Ledger)
CREATE TABLE IF NOT EXISTS public.score_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE RESTRICT,
    game_number INT NOT NULL,
    sequence_number INT NOT NULL,
    point_awarded_to_team_id UUID REFERENCES public.teams(id),
    team1_score_after INT NOT NULL,
    team2_score_after INT NOT NULL,
    serving_team_id UUID REFERENCES public.teams(id),
    serving_hand INT CHECK (serving_hand IN (1, 2)),
    event_type score_event_type NOT NULL DEFAULT 'rally_point',
    player_id UUID REFERENCES public.players(id),
    details JSONB DEFAULT '{}'::jsonb,
    idempotency_key TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(match_id, sequence_number),
    UNIQUE(match_id, idempotency_key)
);

-- 12. Scorer Assignments
CREATE TABLE IF NOT EXISTS public.scorer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
    court TEXT NOT NULL,
    scorer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    certification_level TEXT NOT NULL DEFAULT 'BBFI Grade A',
    status scorer_status NOT NULL DEFAULT 'assigned',
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    entity_name TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    ip_address TEXT,
    details JSONB DEFAULT '{}'::jsonb
);

-- ==============================================================================
-- Indexes for Performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_tournaments_visibility ON public.tournaments(visibility);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_match_games_match ON public.match_games(match_id);
CREATE INDEX IF NOT EXISTS idx_score_events_match ON public.score_events(match_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_score_events_idempotency ON public.score_events(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scorer_assignments_scorer ON public.scorer_assignments(scorer_user_id);
CREATE INDEX IF NOT EXISTS idx_scorer_assignments_match ON public.scorer_assignments(match_id);
CREATE INDEX IF NOT EXISTS idx_team_rosters_team ON public.team_rosters(team_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
