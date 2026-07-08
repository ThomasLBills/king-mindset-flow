-- Cleanup: remove QA test artifacts left over from the E2E temp-password
-- verification (qa-zapier-*@qa.liberatedkings.test).
DO $$
DECLARE
  qa_ids uuid[];
BEGIN
  SELECT array_agg(user_id) INTO qa_ids
  FROM public.profiles
  WHERE email LIKE 'qa-%@qa.liberatedkings.test';

  IF qa_ids IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.payments        WHERE user_id = ANY(qa_ids);
  DELETE FROM public.entitlements    WHERE user_id = ANY(qa_ids);
  DELETE FROM public.user_enrollments WHERE user_id = ANY(qa_ids);
  DELETE FROM public.user_roles      WHERE user_id = ANY(qa_ids);
  DELETE FROM public.chat_channel_members WHERE user_id = ANY(qa_ids);
  DELETE FROM public.profiles        WHERE user_id = ANY(qa_ids);
  DELETE FROM auth.users             WHERE id      = ANY(qa_ids);
END $$;