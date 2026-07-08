-- Restrict curriculum_settings reads to authenticated users (draft exposure)
DROP POLICY IF EXISTS "Anyone reads curriculum_settings" ON public.curriculum_settings;
CREATE POLICY "Authenticated reads curriculum_settings"
  ON public.curriculum_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Lock down SECURITY DEFINER functions not intended for direct client RPC.
-- Edge functions use service_role which bypasses these grants.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_entitlement(uuid, text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_rate_limit(uuid, text, timestamptz) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deactivate_expired_entitlements() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_active_entitlement(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.bump_rate_limit(uuid, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.deactivate_expired_entitlements() TO service_role;