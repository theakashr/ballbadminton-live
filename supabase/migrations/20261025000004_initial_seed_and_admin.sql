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
