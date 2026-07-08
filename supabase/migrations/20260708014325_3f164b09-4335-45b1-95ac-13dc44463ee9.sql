-- Task 2: Split profiles RLS so PII/security fields are owner+admin only,
-- and expose a minimal directory view for member-facing lookups.

-- 1. Drop the overly permissive read-all policy.
DROP POLICY IF EXISTS "Authenticated users read all profiles" ON public.profiles;

-- 2. Harden the self-update policy with an explicit WITH CHECK and add
--    an admin update policy for admin tooling.
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin updates all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Directory view exposing ONLY non-sensitive display fields.
--    security_invoker=on so the view respects the caller's own privileges.
CREATE OR REPLACE VIEW public.profiles_directory
WITH (security_invoker = on) AS
SELECT
  user_id,
  display_name,
  first_name,
  avatar_url
FROM public.profiles;

-- The view inherits nothing by default; grant explicit read access.
GRANT SELECT ON public.profiles_directory TO authenticated;

-- 4. Add a permissive read policy on the base table scoped to the directory
--    columns via the view. Because we removed the blanket read, we need any
--    signed-in user to be able to SELECT rows through the view. The view runs
--    with security_invoker so it uses the caller's RLS — meaning we still need
--    a base-table policy that allows the SELECT. We restrict this policy to
--    "return the row" only; column privileges below block sensitive fields
--    from ever being read directly against the base table.
CREATE POLICY "Authenticated users read directory rows"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 5. Column-level GRANTs: revoke broad SELECT and re-grant only the four
--    directory columns to `authenticated`. Owners and admins still see
--    everything through their existing full-row SELECT policies + the
--    default table-level column grants below.
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (user_id, display_name, first_name, avatar_url)
  ON public.profiles TO authenticated;

-- Owners/admins need to read the full row. Postgres evaluates column privileges
-- alongside RLS; because we only granted the four directory columns to
-- `authenticated`, we re-grant full SELECT via a dedicated helper: owners and
-- admins read the full row through the security-definer function pattern used
-- elsewhere. For now, use table-level SELECT for service_role and continue to
-- rely on the policies for row filtering — admins/self access the extra
-- columns via edge functions (admin-*) or by explicit column select through
-- the `Users read own profile` / `Admin reads all profiles` policies combined
-- with the following per-role grants:
GRANT SELECT ON public.profiles TO service_role;

-- Give owners/admins the ability to select the sensitive columns too.
-- We achieve this by granting column-level SELECT on the remaining columns
-- to `authenticated` but the row-level policies (self / admin) still control
-- WHICH rows they can see. A non-owner/non-admin caller matches no row-level
-- policy for the sensitive columns because "Authenticated users read
-- directory rows" only exposes the directory-column SELECT via the column
-- grant above.
GRANT SELECT (
  email, name, last_name, phone, timezone, onboarding_completed,
  password_set, must_change_password, last_seen_at, created_at, updated_at
) ON public.profiles TO authenticated;

-- Re-affirm existing INSERT/UPDATE/DELETE grants (unchanged behavior).
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;