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
