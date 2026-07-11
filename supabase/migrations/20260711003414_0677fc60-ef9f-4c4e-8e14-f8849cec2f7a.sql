-- Revoke EXECUTE from PUBLIC, anon, and authenticated on SECURITY DEFINER
-- functions that should only run via service_role (edge functions/cron) or
-- as trigger callbacks. service_role and postgres retain access.

REVOKE EXECUTE ON FUNCTION public.bump_rate_limit(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deactivate_expired_entitlements() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_join_default_channels() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;