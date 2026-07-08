
-- Fix missing WITH CHECK on FOR ALL policies so users can only write their own rows
DROP POLICY IF EXISTS "Users manage own course progress" ON public.course_progress;
CREATE POLICY "Users manage own course progress" ON public.course_progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users manage own lesson progress" ON public.lesson_progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own action items" ON public.user_action_items;
CREATE POLICY "Users manage own action items" ON public.user_action_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add WITH CHECK to chat_read_cursors UPDATE policy
DROP POLICY IF EXISTS "Users update own cursors" ON public.chat_read_cursors;
CREATE POLICY "Users update own cursors" ON public.chat_read_cursors
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Lock down SECURITY DEFINER functions not meant for client callers
REVOKE EXECUTE ON FUNCTION public.bump_rate_limit(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deactivate_expired_entitlements() FROM PUBLIC, anon, authenticated;

-- Add admin guard inside evidence counts (called from admin UI)
CREATE OR REPLACE FUNCTION public.get_evidence_counts_by_user()
 RETURNS TABLE(user_id uuid, evidence_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT ee.user_id, count(*)::bigint AS evidence_count
    FROM public.evidence_events ee
    GROUP BY ee.user_id;
END;
$function$;
