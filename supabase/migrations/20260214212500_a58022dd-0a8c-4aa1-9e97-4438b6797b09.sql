
-- Make weeks and curriculum_lessons readable by anyone (metadata is not sensitive)
-- User-facing code filters by status='published' anyway
DROP POLICY IF EXISTS "Authenticated read all weeks" ON public.weeks;
DROP POLICY IF EXISTS "Anyone reads published weeks" ON public.weeks;
CREATE POLICY "Anyone reads weeks"
  ON public.weeks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated read all curriculum_lessons" ON public.curriculum_lessons;
DROP POLICY IF EXISTS "Anyone reads published curriculum_lessons" ON public.curriculum_lessons;
CREATE POLICY "Anyone reads curriculum_lessons"
  ON public.curriculum_lessons FOR SELECT
  USING (true);
