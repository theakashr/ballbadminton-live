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
