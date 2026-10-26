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
-- ==============================================================================
-- Migration 02: Row Level Security (RLS) & Role-Based Authorization
-- ==============================================================================

-- 1. Enable RLS on All Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Security Definer Helper Functions (Prevent recursive policy lookups)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role 
    FROM public.profiles 
    WHERE id = auth.uid() AND is_active = TRUE;
    
    RETURN COALESCE(v_role, 'viewer'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_current_user_role() = 'super_admin'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.is_tournament_admin(p_tournament_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_super_admin() THEN
        RETURN TRUE;
    END IF;

    -- Check if user is creator or assigned tournament admin
    RETURN EXISTS (
        SELECT 1 FROM public.tournaments
        WHERE id = p_tournament_id 
          AND (created_by = auth.uid() OR public.get_current_user_role() = 'tournament_admin'::user_role)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.can_score_match(p_match_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Super admin can always score
    IF public.is_super_admin() THEN
        RETURN TRUE;
    END IF;

    -- Assigned scorer can score
    IF EXISTS (
        SELECT 1 FROM public.scorer_assignments
        WHERE match_id = p_match_id 
          AND scorer_user_id = auth.uid()
          AND status IN ('assigned', 'active_scoring')
    ) THEN
        RETURN TRUE;
    END IF;

    -- Tournament admin for this match's tournament can score
    RETURN EXISTS (
        SELECT 1 FROM public.matches m
        JOIN public.tournaments t ON t.id = m.tournament_id
        WHERE m.id = p_match_id 
          AND (t.created_by = auth.uid() OR public.get_current_user_role() = 'tournament_admin'::user_role)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth, pg_temp;

-- ==============================================================================
-- 3. RLS Policies
-- ==============================================================================

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can update own details except role"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Cannot self-elevate
    );

CREATE POLICY "Only super_admin can insert or delete profiles or change roles"
    ON public.profiles FOR ALL
    USING (public.is_super_admin());

-- TOURNAMENTS
CREATE POLICY "Public tournaments are viewable by all"
    ON public.tournaments FOR SELECT
    USING (
        (visibility = 'public' AND NOT is_archived)
        OR public.is_super_admin()
        OR (auth.uid() IS NOT NULL AND created_by = auth.uid())
    );

CREATE POLICY "Super and Tournament Admins can manage tournaments"
    ON public.tournaments FOR INSERT
    WITH CHECK (
        public.get_current_user_role() IN ('super_admin', 'tournament_admin')
    );

CREATE POLICY "Super and Tournament Admins can update tournaments"
    ON public.tournaments FOR UPDATE
    USING (public.is_tournament_admin(id))
    WITH CHECK (public.is_tournament_admin(id));

CREATE POLICY "Only super admin can delete or archive tournaments"
    ON public.tournaments FOR DELETE
    USING (public.is_super_admin());

-- TEAMS
CREATE POLICY "Teams are viewable by all"
    ON public.teams FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can insert teams"
    ON public.teams FOR INSERT
    WITH CHECK (public.get_current_user_role() IN ('super_admin', 'tournament_admin'));

CREATE POLICY "Admins can update teams"
    ON public.teams FOR UPDATE
    USING (public.get_current_user_role() IN ('super_admin', 'tournament_admin'))
    WITH CHECK (public.get_current_user_role() IN ('super_admin', 'tournament_admin'));

CREATE POLICY "Only super admin can delete teams"
    ON public.teams FOR DELETE
    USING (public.is_super_admin());

-- PLAYERS & ROSTERS
CREATE POLICY "Players are viewable by all"
    ON public.players FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage players"
    ON public.players FOR ALL
    USING (public.get_current_user_role() IN ('super_admin', 'tournament_admin'));

CREATE POLICY "Team rosters are viewable by all"
    ON public.team_rosters FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage rosters"
    ON public.team_rosters FOR ALL
    USING (public.get_current_user_role() IN ('super_admin', 'tournament_admin'));

CREATE POLICY "Tournament teams are viewable by all"
    ON public.tournament_teams FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage tournament teams"
    ON public.tournament_teams FOR ALL
    USING (public.get_current_user_role() IN ('super_admin', 'tournament_admin'));

-- MATCHES
CREATE POLICY "Public matches are viewable by all"
    ON public.matches FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tournaments t
            WHERE t.id = tournament_id 
              AND (t.visibility = 'public' OR public.is_tournament_admin(t.id))
        )
    );

CREATE POLICY "Admins can schedule and manage matches"
    ON public.matches FOR INSERT
    WITH CHECK (public.is_tournament_admin(tournament_id));

CREATE POLICY "Admins or assigned scorers can update matches"
    ON public.matches FOR UPDATE
    USING (public.can_score_match(id))
    WITH CHECK (public.can_score_match(id));

CREATE POLICY "Only super admin can delete matches"
    ON public.matches FOR DELETE
    USING (public.is_super_admin());

-- MATCH LINEUPS
CREATE POLICY "Match lineups are viewable by all"
    ON public.match_lineups FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins or assigned scorers can manage match lineups"
    ON public.match_lineups FOR ALL
    USING (public.can_score_match(match_id))
    WITH CHECK (public.can_score_match(match_id));

-- MATCH GAMES
CREATE POLICY "Match games are viewable by all"
    ON public.match_games FOR SELECT
    USING (TRUE);

CREATE POLICY "Match games modifiable by authorized match scorers"
    ON public.match_games FOR ALL
    USING (public.can_score_match(match_id));

-- SCORE EVENTS
CREATE POLICY "Score events viewable by all"
    ON public.score_events FOR SELECT
    USING (TRUE);

CREATE POLICY "Score events can only be inserted by authorized match scorers"
    ON public.score_events FOR INSERT
    WITH CHECK (public.can_score_match(match_id));

-- SCORER ASSIGNMENTS
CREATE POLICY "Scorer assignments viewable by all authenticated"
    ON public.scorer_assignments FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can assign scorers"
    ON public.scorer_assignments FOR ALL
    USING (public.get_current_user_role() IN ('super_admin', 'tournament_admin'));

-- SCORING CONFIGS
CREATE POLICY "Scoring configs viewable by all"
    ON public.scoring_configs FOR SELECT
    USING (TRUE);

CREATE POLICY "Only super admin can modify scoring configs"
    ON public.scoring_configs FOR ALL
    USING (public.is_super_admin());

-- AUDIT LOGS
CREATE POLICY "Admins can read audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.get_current_user_role() IN ('super_admin', 'tournament_admin'));

CREATE POLICY "System and authorized users can append audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
-- ==============================================================================
-- Migration 03: Authoritative Scoring Functions & Integrity RPCs
-- ==============================================================================

-- 1. START MATCH RPC
CREATE OR REPLACE FUNCTION public.start_match_rpc(p_match_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_match public.matches%ROWTYPE;
    v_config JSONB;
BEGIN
    -- Authorization check
    IF NOT public.can_score_match(p_match_id) THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: User is not authorized to officiate this match';
    END IF;

    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Match does not exist';
    END IF;

    IF v_match.status = 'completed' THEN
        RAISE EXCEPTION 'INVALID_STATE: Completed matches cannot be restarted';
    END IF;

    -- Snapshot scoring config if not already snapshotted
    IF v_match.config_snapshot IS NULL THEN
        SELECT jsonb_build_object(
            'points_per_set', COALESCE(c.points_per_set, v_match.max_points_per_set, 29),
            'best_of_sets', COALESCE(c.best_of_sets, 3),
            'serving_system', COALESCE(c.serving_system, 'two_hands'),
            'deuce_enabled', COALESCE(c.deuce_enabled, TRUE),
            'max_overtime_cap', COALESCE(c.max_overtime_cap, 33),
            'court_surface', COALESCE(c.court_surface, 'Outdoor Red Clay')
        ) INTO v_config
        FROM public.scoring_configs c
        WHERE c.is_default = TRUE
        LIMIT 1;

        IF v_config IS NULL THEN
            v_config := jsonb_build_object(
                'points_per_set', v_match.max_points_per_set,
                'best_of_sets', 3,
                'serving_system', 'two_hands',
                'deuce_enabled', TRUE,
                'max_overtime_cap', 33,
                'court_surface', 'Outdoor Red Clay'
            );
        END IF;
    ELSE
        v_config := v_match.config_snapshot;
    END IF;

    -- Initialize Game 1 if not exists
    INSERT INTO public.match_games (match_id, game_number, team1_score, team2_score, started_at)
    VALUES (p_match_id, 1, 0, 0, timezone('utc'::text, now()))
    ON CONFLICT (match_id, game_number) DO NOTHING;

    -- Update match state
    UPDATE public.matches
    SET status = 'live',
        started_at = COALESCE(started_at, timezone('utc'::text, now())),
        config_snapshot = v_config,
        version = version + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_match_id;

    -- Update scorer assignment status
    UPDATE public.scorer_assignments
    SET status = 'active_scoring'
    WHERE match_id = p_match_id AND scorer_user_id = auth.uid();

    -- Audit log
    INSERT INTO public.audit_logs (action, entity_type, entity_id, entity_name, user_id, user_email, details)
    VALUES (
        'MATCH_STARTED',
        'match',
        p_match_id,
        'Match ' || p_match_id,
        auth.uid(),
        COALESCE((SELECT email FROM public.profiles WHERE id = auth.uid()), 'system'),
        jsonb_build_object('config_snapshot', v_config)
    );

    RETURN jsonb_build_object('success', TRUE, 'status', 'live', 'match_id', p_match_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 2. PAUSE MATCH RPC
CREATE OR REPLACE FUNCTION public.pause_match_rpc(p_match_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_match public.matches%ROWTYPE;
BEGIN
    IF NOT public.can_score_match(p_match_id) THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: User is not authorized to officiate this match';
    END IF;

    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
    IF NOT FOUND OR v_match.status <> 'live' THEN
        RAISE EXCEPTION 'INVALID_STATE: Only LIVE matches can be paused';
    END IF;

    UPDATE public.matches
    SET status = 'paused',
        notes = COALESCE(p_reason, notes),
        version = version + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_match_id;

    INSERT INTO public.audit_logs (action, entity_type, entity_id, entity_name, user_id, user_email, details)
    VALUES (
        'MATCH_PAUSED',
        'match',
        p_match_id,
        'Match ' || p_match_id,
        auth.uid(),
        COALESCE((SELECT email FROM public.profiles WHERE id = auth.uid()), 'system'),
        jsonb_build_object('reason', p_reason)
    );

    RETURN jsonb_build_object('success', TRUE, 'status', 'paused');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 3. RECORD SCORE POINT RPC (Authoritative Transaction with Idempotency & Optimistic Concurrency)
CREATE OR REPLACE FUNCTION public.record_point_rpc(
    p_match_id UUID,
    p_awarded_team_id UUID,
    p_event_type score_event_type DEFAULT 'rally_point',
    p_expected_version INT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_player_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_match public.matches%ROWTYPE;
    v_game public.match_games%ROWTYPE;
    v_next_seq INT;
    v_new_t1 INT;
    v_new_t2 INT;
    v_target_points INT;
    v_max_cap INT;
    v_best_of INT;
    v_sets_to_win INT;
    v_game_won BOOLEAN := FALSE;
    v_winner_team_id UUID := NULL;
    v_match_completed BOOLEAN := FALSE;
    v_new_hand INT;
    v_new_serving_team UUID;
    v_existing_event public.score_events%ROWTYPE;
BEGIN
    -- 1. Authorization check
    IF NOT public.can_score_match(p_match_id) THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: Caller not authorized to score match';
    END IF;

    -- 2. Idempotency Check (Duplicate request prevention)
    IF p_idempotency_key IS NOT NULL THEN
        SELECT * INTO v_existing_event 
        FROM public.score_events 
        WHERE match_id = p_match_id AND idempotency_key = p_idempotency_key;
        
        IF FOUND THEN
            -- Already applied safely, return current state without re-incrementing
            SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
            SELECT * INTO v_game FROM public.match_games WHERE match_id = p_match_id AND game_number = v_match.current_set;
            RETURN jsonb_build_object(
                'success', TRUE,
                'idempotent_replay', TRUE,
                'match_id', p_match_id,
                'current_set', v_match.current_set,
                'team1_score', v_game.team1_score,
                'team2_score', v_game.team2_score,
                'version', v_match.version
            );
        END IF;
    END IF;

    -- 3. Lock match row
    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Match does not exist';
    END IF;

    IF v_match.status <> 'live' THEN
        RAISE EXCEPTION 'INVALID_STATE: Match is not live (current status: %)', v_match.status;
    END IF;

    -- 4. Optimistic Concurrency Check
    IF p_expected_version IS NOT NULL AND v_match.version <> p_expected_version THEN
        RAISE EXCEPTION 'CONCURRENCY_ERROR: Version mismatch (expected %, current %). Refresh state.',
            p_expected_version, v_match.version;
    END IF;

    -- 5. Lock current active game
    SELECT * INTO v_game 
    FROM public.match_games 
    WHERE match_id = p_match_id AND game_number = v_match.current_set FOR UPDATE;
    
    IF NOT FOUND THEN
        -- Auto create game if missing
        INSERT INTO public.match_games (match_id, game_number, team1_score, team2_score, started_at)
        VALUES (p_match_id, v_match.current_set, 0, 0, timezone('utc'::text, now()))
        RETURNING * INTO v_game;
    END IF;

    -- 6. Read rules configuration from match snapshot
    v_target_points := COALESCE((v_match.config_snapshot->>'points_per_set')::INT, v_match.max_points_per_set, 29);
    v_max_cap := COALESCE((v_match.config_snapshot->>'max_overtime_cap')::INT, 33);
    v_best_of := COALESCE((v_match.config_snapshot->>'best_of_sets')::INT, 3);
    v_sets_to_win := (v_best_of / 2) + 1; -- e.g. best of 3 needs 2 sets

    -- 7. Calculate new rally score
    IF p_awarded_team_id = v_match.team1_id THEN
        v_new_t1 := v_game.team1_score + 1;
        v_new_t2 := v_game.team2_score;
    ELSIF p_awarded_team_id = v_match.team2_id THEN
        v_new_t1 := v_game.team1_score;
        v_new_t2 := v_game.team2_score + 1;
    ELSE
        RAISE EXCEPTION 'INVALID_TEAM: Awarded team does not participate in this match';
    END IF;

    -- 8. Ball Badminton 29-Point Game Win Evaluation
    -- Standard: First to 29 with 2-point margin, or whoever hits max cap (33 points)
    IF (v_new_t1 >= v_target_points AND (v_new_t1 - v_new_t2 >= 2 OR v_new_t1 >= v_max_cap)) THEN
        v_game_won := TRUE;
        v_winner_team_id := v_match.team1_id;
    ELSIF (v_new_t2 >= v_target_points AND (v_new_t2 - v_new_t1 >= 2 OR v_new_t2 >= v_max_cap)) THEN
        v_game_won := TRUE;
        v_winner_team_id := v_match.team2_id;
    END IF;

    -- 9. Service Hand Rotation Logic (Ball Badminton Traditional 2 Hands)
    v_new_serving_team := v_match.serving_team_id;
    v_new_hand := v_match.serving_hand;

    IF p_awarded_team_id <> v_match.serving_team_id THEN
        -- Side out or 2nd hand
        IF v_match.serving_hand = 1 THEN
            v_new_hand := 2; -- Move to 2nd Hand
        ELSE
            -- Change of service to receiving team (1st Hand)
            v_new_hand := 1;
            IF v_match.serving_team_id = v_match.team1_id THEN
                v_new_serving_team := v_match.team2_id;
            ELSE
                v_new_serving_team := v_match.team1_id;
            END IF;
        END IF;
    END IF;

    -- 10. Update match_games
    UPDATE public.match_games
    SET team1_score = v_new_t1,
        team2_score = v_new_t2,
        is_completed = v_game_won,
        winner_team_id = v_winner_team_id,
        completed_at = CASE WHEN v_game_won THEN timezone('utc'::text, now()) ELSE completed_at END
    WHERE id = v_game.id;

    -- 11. Determine sequence number
    SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO v_next_seq
    FROM public.score_events
    WHERE match_id = p_match_id;

    -- 12. Insert Authoritative Score Event
    INSERT INTO public.score_events (
        match_id,
        game_number,
        sequence_number,
        point_awarded_to_team_id,
        team1_score_after,
        team2_score_after,
        serving_team_id,
        serving_hand,
        event_type,
        player_id,
        details,
        idempotency_key,
        created_by
    ) VALUES (
        p_match_id,
        v_match.current_set,
        v_next_seq,
        p_awarded_team_id,
        v_new_t1,
        v_new_t2,
        v_new_serving_team,
        v_new_hand,
        p_event_type,
        p_player_id,
        p_details,
        p_idempotency_key,
        auth.uid()
    );

    -- 13. If game won, evaluate match victory
    IF v_game_won THEN
        DECLARE
            v_t1_sets INT := v_match.team1_sets_won + CASE WHEN v_winner_team_id = v_match.team1_id THEN 1 ELSE 0 END;
            v_t2_sets INT := v_match.team2_sets_won + CASE WHEN v_winner_team_id = v_match.team2_id THEN 1 ELSE 0 END;
        BEGIN
            IF v_t1_sets >= v_sets_to_win OR v_t2_sets >= v_sets_to_win THEN
                v_match_completed := TRUE;
                UPDATE public.matches
                SET team1_sets_won = v_t1_sets,
                    team2_sets_won = v_t2_sets,
                    status = 'completed',
                    completed_at = timezone('utc'::text, now()),
                    version = version + 1,
                    updated_at = timezone('utc'::text, now())
                WHERE id = p_match_id;
            ELSE
                -- Next set preparation
                UPDATE public.matches
                SET team1_sets_won = v_t1_sets,
                    team2_sets_won = v_t2_sets,
                    current_set = current_set + 1,
                    serving_team_id = v_winner_team_id,
                    serving_hand = 1,
                    version = version + 1,
                    updated_at = timezone('utc'::text, now())
                WHERE id = p_match_id;

                -- Create next game row
                INSERT INTO public.match_games (match_id, game_number, team1_score, team2_score, started_at)
                VALUES (p_match_id, v_match.current_set + 1, 0, 0, timezone('utc'::text, now()))
                ON CONFLICT (match_id, game_number) DO NOTHING;
            END IF;
        END;
    ELSE
        -- Normal rally point update
        UPDATE public.matches
        SET serving_team_id = v_new_serving_team,
            serving_hand = v_new_hand,
            version = version + 1,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_match_id;
    END IF;

    -- Return updated payload
    RETURN jsonb_build_object(
        'success', TRUE,
        'match_id', p_match_id,
        'sequence_number', v_next_seq,
        'current_set', v_match.current_set,
        'team1_score', v_new_t1,
        'team2_score', v_new_t2,
        'game_won', v_game_won,
        'match_completed', v_match_completed,
        'serving_team_id', v_new_serving_team,
        'serving_hand', v_new_hand,
        'version', v_match.version + 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 4. UNDO LAST POINT RPC
CREATE OR REPLACE FUNCTION public.undo_last_point_rpc(
    p_match_id UUID,
    p_expected_version INT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_match public.matches%ROWTYPE;
    v_last_event public.score_events%ROWTYPE;
    v_prev_event public.score_events%ROWTYPE;
    v_prev_t1 INT := 0;
    v_prev_t2 INT := 0;
    v_prev_srv_team UUID;
    v_prev_hand INT := 1;
BEGIN
    IF NOT public.can_score_match(p_match_id) THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: Caller not authorized to officiate match';
    END IF;

    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
    IF NOT FOUND OR v_match.status <> 'live' THEN
        RAISE EXCEPTION 'INVALID_STATE: Match is not live';
    END IF;

    IF p_expected_version IS NOT NULL AND v_match.version <> p_expected_version THEN
        RAISE EXCEPTION 'CONCURRENCY_ERROR: Version mismatch';
    END IF;

    -- Find latest point event for this match
    SELECT * INTO v_last_event
    FROM public.score_events
    WHERE match_id = p_match_id AND event_type NOT IN ('undo')
    ORDER BY sequence_number DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: No score events found to undo';
    END IF;

    -- Find the event prior to the last event to restore state
    SELECT * INTO v_prev_event
    FROM public.score_events
    WHERE match_id = p_match_id 
      AND sequence_number < v_last_event.sequence_number
      AND event_type NOT IN ('undo')
    ORDER BY sequence_number DESC
    LIMIT 1;

    IF FOUND THEN
        v_prev_t1 := v_prev_event.team1_score_after;
        v_prev_t2 := v_prev_event.team2_score_after;
        v_prev_srv_team := v_prev_event.serving_team_id;
        v_prev_hand := v_prev_event.serving_hand;
    ELSE
        v_prev_t1 := 0;
        v_prev_t2 := 0;
        v_prev_srv_team := v_match.team1_id;
        v_prev_hand := 1;
    END IF;

    -- Revert match_games score
    UPDATE public.match_games
    SET team1_score = v_prev_t1,
        team2_score = v_prev_t2,
        is_completed = FALSE,
        winner_team_id = NULL
    WHERE match_id = p_match_id AND game_number = v_last_event.game_number;

    -- Log compensating undo event
    INSERT INTO public.score_events (
        match_id,
        game_number,
        sequence_number,
        point_awarded_to_team_id,
        team1_score_after,
        team2_score_after,
        serving_team_id,
        serving_hand,
        event_type,
        details,
        created_by
    ) VALUES (
        p_match_id,
        v_last_event.game_number,
        v_last_event.sequence_number + 1,
        NULL,
        v_prev_t1,
        v_prev_t2,
        v_prev_srv_team,
        v_prev_hand,
        'undo',
        jsonb_build_object('undone_sequence', v_last_event.sequence_number),
        auth.uid()
    );

    -- Update match
    UPDATE public.matches
    SET serving_team_id = v_prev_srv_team,
        serving_hand = v_prev_hand,
        version = version + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_match_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'undone_sequence', v_last_event.sequence_number,
        'team1_score', v_prev_t1,
        'team2_score', v_prev_t2,
        'version', v_match.version + 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 5. COMPLETE MATCH RPC
CREATE OR REPLACE FUNCTION public.complete_match_rpc(p_match_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS JSONB AS $$
BEGIN
    IF NOT public.can_score_match(p_match_id) THEN
        RAISE EXCEPTION 'PERMISSION_DENIED';
    END IF;

    UPDATE public.matches
    SET status = 'completed',
        completed_at = timezone('utc'::text, now()),
        notes = COALESCE(p_notes, notes),
        version = version + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_match_id;

    UPDATE public.scorer_assignments
    SET status = 'available'
    WHERE match_id = p_match_id;

    RETURN jsonb_build_object('success', TRUE, 'status', 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- ==============================================================================
-- Least-Privilege Execution Grants
-- ==============================================================================
REVOKE EXECUTE ON FUNCTION public.start_match_rpc(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_match_rpc(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.pause_match_rpc(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_match_rpc(UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.record_point_rpc(UUID, UUID, score_event_type, INT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_point_rpc(UUID, UUID, score_event_type, INT, TEXT, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.undo_last_point_rpc(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.undo_last_point_rpc(UUID, INT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.complete_match_rpc(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_match_rpc(UUID, TEXT) TO authenticated;
-- ==============================================================================
-- Migration 04: Initial Super Admin Setup, Auth Trigger & Seed Configs
-- ==============================================================================

-- 1. Auto-create Profile on Supabase User Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role := 'viewer';
BEGIN
    -- Explicit designated Super Admin provisioning requires verified email confirmation
    IF LOWER(NEW.email) = 'akashakashr505@gmail.com' AND (NEW.email_confirmed_at IS NOT NULL OR NEW.confirmed_at IS NOT NULL) THEN
        v_role := 'super_admin';
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        designation,
        is_active
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        v_role,
        CASE WHEN LOWER(NEW.email) = 'akashakashr505@gmail.com' AND (NEW.email_confirmed_at IS NOT NULL OR NEW.confirmed_at IS NOT NULL)
             THEN 'Platform Super Admin & Owner' 
             ELSE 'Spectator / Official' 
        END,
        TRUE
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = CASE 
            WHEN LOWER(EXCLUDED.email) = 'akashakashr505@gmail.com' AND (NEW.email_confirmed_at IS NOT NULL OR NEW.confirmed_at IS NOT NULL) 
            THEN 'super_admin'::user_role 
            ELSE public.profiles.role 
        END,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- Bind Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Explicit Trusted Bootstrap Procedure for Super Administrator
-- This function can ONLY be executed by postgres / service_role directly within SQL Console
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(p_admin_email TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
BEGIN
    IF current_user NOT IN ('postgres', 'supabase_admin') THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: Only database administrator in SQL Console can bootstrap super_admin';
    END IF;

    SELECT id INTO v_user_id FROM public.profiles WHERE LOWER(email) = LOWER(p_admin_email);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'USER_NOT_FOUND: User profile with email % does not exist yet. Please have the user sign up first.', p_admin_email;
    END IF;

    UPDATE public.profiles
    SET role = 'super_admin'::user_role,
        designation = 'Platform Super Admin & Owner',
        is_active = TRUE,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_user_id;

    RETURN jsonb_build_object('success', TRUE, 'email', p_admin_email, 'role', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) TO service_role;

-- 3. Privileged Role Granting Function (Executable only by Super Admin)
CREATE OR REPLACE FUNCTION public.grant_user_role(
    p_target_email TEXT,
    p_new_role user_role,
    p_designation TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_target_id UUID;
    v_caller_role user_role;
BEGIN
    -- Check caller is super admin
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF v_caller_role <> 'super_admin' THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: Only Super Admin (akashakashr505@gmail.com) can grant roles';
    END IF;

    -- Lookup target
    SELECT id INTO v_target_id FROM public.profiles WHERE LOWER(email) = LOWER(p_target_email);
    IF v_target_id IS NULL THEN
        RAISE EXCEPTION 'USER_NOT_FOUND: Profile with email % does not exist yet. Ask user to sign up first.', p_target_email;
    END IF;

    -- Protect primary super admin from demotion
    IF LOWER(p_target_email) = 'akashakashr505@gmail.com' AND p_new_role <> 'super_admin' THEN
        RAISE EXCEPTION 'FORBIDDEN: The Primary Super Admin cannot be demoted';
    END IF;

    UPDATE public.profiles
    SET role = p_new_role,
        designation = COALESCE(p_designation, designation),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_target_id;

    -- Audit log
    INSERT INTO public.audit_logs (action, entity_type, entity_id, entity_name, user_id, user_email, details)
    VALUES (
        'ROLE_GRANTED',
        'user',
        v_target_id,
        p_target_email,
        auth.uid(),
        (SELECT email FROM public.profiles WHERE id = auth.uid()),
        jsonb_build_object('new_role', p_new_role, 'designation', p_designation)
    );

    RETURN jsonb_build_object('success', TRUE, 'email', p_target_email, 'role', p_new_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

REVOKE EXECUTE ON FUNCTION public.grant_user_role(TEXT, user_role, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_user_role(TEXT, user_role, TEXT) TO authenticated;

-- 3. Seed Default BBFI Scoring Configuration
INSERT INTO public.scoring_configs (
    name,
    points_per_set,
    best_of_sets,
    serving_system,
    deuce_enabled,
    max_overtime_cap,
    court_surface,
    ball_specification,
    auto_publish,
    umpire_pin_required,
    is_default
) VALUES (
    'BBFI Standard 29-Point Traditional Rules',
    29,
    3,
    'two_hands',
    TRUE,
    33,
    'Outdoor Red Clay',
    'BBFI Standard Yellow Woollen Ball (27-30g)',
    TRUE,
    TRUE,
    TRUE
)
ON CONFLICT DO NOTHING;
