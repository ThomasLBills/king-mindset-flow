-- Correct Task 2: remove the leaky directory policy + column grants, and
-- replace the view with SECURITY DEFINER helpers that expose only the four
-- safe directory columns.

-- 1. Undo the previous overly-permissive setup.
DROP POLICY IF EXISTS "Authenticated users read directory rows" ON public.profiles;
DROP VIEW IF EXISTS public.profiles_directory;

-- Restore normal table-level SELECT so owner/admin row policies can return
-- all columns. Row-level policies now do all the filtering.
GRANT SELECT ON public.profiles TO authenticated;

-- Column-level grants we added last migration are superseded by the
-- table-level grant above; strip them to keep the grant surface clean.
REVOKE SELECT (user_id, display_name, first_name, avatar_url)
  ON public.profiles FROM authenticated;
REVOKE SELECT (
  email, name, last_name, phone, timezone, onboarding_completed,
  password_set, must_change_password, last_seen_at, created_at, updated_at
) ON public.profiles FROM authenticated;

-- 2. Cross-user directory access via SECURITY DEFINER functions only.
--    These are the ONLY sanctioned way for a signed-in user to read another
--    user's profile fields, and they return just the four safe columns.

CREATE OR REPLACE FUNCTION public.get_profiles_directory(_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  display_name text,
  first_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.first_name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
    AND auth.uid() IS NOT NULL
$$;

REVOKE ALL ON FUNCTION public.get_profiles_directory(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profiles_directory(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.search_profiles_directory(_query text)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  first_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.first_name, p.avatar_url
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.user_id <> auth.uid()
    AND char_length(coalesce(_query, '')) >= 2
    AND (
      p.display_name ILIKE '%' || _query || '%'
      OR p.first_name ILIKE '%' || _query || '%'
    )
  LIMIT 10
$$;

REVOKE ALL ON FUNCTION public.search_profiles_directory(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_profiles_directory(text) TO authenticated;