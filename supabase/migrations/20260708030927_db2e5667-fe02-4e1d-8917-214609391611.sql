
-- 1. Weeks: replace public read with published-only for authenticated + admins
DROP POLICY IF EXISTS "Anyone reads weeks" ON public.weeks;

CREATE POLICY "Authenticated read published weeks"
ON public.weeks FOR SELECT
TO authenticated
USING (status = 'published' OR public.has_role(auth.uid(), 'admin'::app_role));

REVOKE SELECT ON public.weeks FROM anon;

-- 2. Chat message content/image url + reaction emoji constraints
ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_content_length_check
    CHECK (char_length(content) <= 5000) NOT VALID;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_image_url_scheme_check
    CHECK (image_url IS NULL OR image_url ~* '^https?://') NOT VALID;

ALTER TABLE public.chat_reactions
  ADD CONSTRAINT chat_reactions_emoji_length_check
    CHECK (char_length(emoji) <= 16) NOT VALID;

-- 3. Admin audit log: cap payload size (~100KB)
ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_payload_size_check
    CHECK (
      (before_json IS NULL OR octet_length(before_json::text) <= 102400)
      AND (after_json IS NULL OR octet_length(after_json::text) <= 102400)
    ) NOT VALID;

-- 4. Lock down SECURITY DEFINER function execution surface.
--    Anon should never invoke any of these helpers directly.
REVOKE EXECUTE ON FUNCTION public.get_profiles_directory(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_profiles_directory(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_evidence_counts_by_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_join_default_channels() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_rate_limit(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_entitlement(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_community_armor_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.deactivate_expired_entitlements() FROM PUBLIC, anon, authenticated;

-- Re-grant to service_role so edge functions and admin jobs continue to work.
GRANT EXECUTE ON FUNCTION public.get_profiles_directory(uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_profiles_directory(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_evidence_counts_by_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.bump_rate_limit(uuid, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_active_entitlement(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_community_armor_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deactivate_expired_entitlements() TO service_role;
