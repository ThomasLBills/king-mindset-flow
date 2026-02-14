
-- Allow reading weeks and curriculum_lessons for admin with dev bypass
-- The "Users read published weeks" policy stays for user-facing queries
-- But admin queries need broader access

DROP POLICY IF EXISTS "Users read published weeks" ON public.weeks;
CREATE POLICY "Anyone reads published weeks"
  ON public.weeks FOR SELECT
  USING (status = 'published');

-- For admin: the "Admins manage weeks" ALL policy covers SELECT too,
-- but dev bypass has no admin role. Let's handle it by checking the context.
-- Actually the real fix is: when logged in as admin, the admin policy works.
-- With dev bypass (no auth), we need a fallback. Let's make it auth-based.
CREATE POLICY "Authenticated read all weeks"
  ON public.weeks FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users read published curriculum_lessons" ON public.curriculum_lessons;
CREATE POLICY "Anyone reads published curriculum_lessons"
  ON public.curriculum_lessons FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated read all curriculum_lessons"
  ON public.curriculum_lessons FOR SELECT
  USING (auth.uid() IS NOT NULL);
