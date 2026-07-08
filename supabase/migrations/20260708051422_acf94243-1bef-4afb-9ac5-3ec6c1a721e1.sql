-- Revoke default PUBLIC EXECUTE on all SECURITY DEFINER helpers, then re-grant
-- narrowly to the roles that actually need to call them.

-- Trigger-only / internal helpers: no client access.
REVOKE ALL ON FUNCTION public.auto_join_default_channels() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_join_default_channels() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO service_role;

-- Backend-only helpers (edge functions / cron).
REVOKE ALL ON FUNCTION public.bump_rate_limit(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deactivate_expired_entitlements() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_rate_limit(uuid, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.deactivate_expired_entitlements() TO service_role;

-- Helpers intentionally exposed to signed-in users (used by RLS policies or client code).
-- Revoke anon + PUBLIC first, then grant to authenticated + service_role.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_active_entitlement(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_profiles_directory(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.search_profiles_directory(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_community_armor_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_evidence_counts_by_user() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_active_entitlement(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_profiles_directory(uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_profiles_directory(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_community_armor_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_evidence_counts_by_user() TO authenticated, service_role;