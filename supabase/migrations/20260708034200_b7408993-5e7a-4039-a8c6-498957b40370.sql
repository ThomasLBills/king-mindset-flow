
DROP POLICY IF EXISTS "Users read published lessons" ON public.lessons;
CREATE POLICY "Users read published lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_active_entitlement(auth.uid(), 'course_app_access')
    )
  );

DROP POLICY IF EXISTS "Users read resources of published lessons" ON public.lesson_resources;
CREATE POLICY "Users read resources of published lessons"
  ON public.lesson_resources FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_resources.lesson_id
        AND l.status = 'published'
    )
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_active_entitlement(auth.uid(), 'course_app_access')
    )
  );

DROP POLICY IF EXISTS "Recipient updates connection status" ON public.brotherhood_connections;
CREATE POLICY "Recipient updates connection status"
  ON public.brotherhood_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id AND requester_id <> recipient_id)
  WITH CHECK (auth.uid() = recipient_id AND requester_id <> recipient_id);

REVOKE EXECUTE ON FUNCTION public.bump_rate_limit(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deactivate_expired_entitlements() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_evidence_counts_by_user() FROM PUBLIC, anon, authenticated;
