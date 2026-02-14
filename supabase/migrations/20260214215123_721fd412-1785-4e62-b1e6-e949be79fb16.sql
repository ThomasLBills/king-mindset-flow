
-- Fix curriculum_lessons: drop restrictive, create permissive
DROP POLICY IF EXISTS "Admins manage curriculum_lessons" ON public.curriculum_lessons;
DROP POLICY IF EXISTS "Anyone reads curriculum_lessons" ON public.curriculum_lessons;

CREATE POLICY "Admins manage curriculum_lessons"
  ON public.curriculum_lessons FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone reads curriculum_lessons"
  ON public.curriculum_lessons FOR SELECT
  USING (true);

-- Fix weeks: drop restrictive, create permissive
DROP POLICY IF EXISTS "Admins manage weeks" ON public.weeks;
DROP POLICY IF EXISTS "Anyone reads weeks" ON public.weeks;

CREATE POLICY "Admins manage weeks"
  ON public.weeks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone reads weeks"
  ON public.weeks FOR SELECT
  USING (true);

-- Fix curriculum_settings: drop restrictive, create permissive
DROP POLICY IF EXISTS "Admins manage curriculum_settings" ON public.curriculum_settings;
DROP POLICY IF EXISTS "Authenticated read curriculum_settings" ON public.curriculum_settings;

CREATE POLICY "Admins manage curriculum_settings"
  ON public.curriculum_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone reads curriculum_settings"
  ON public.curriculum_settings FOR SELECT
  USING (true);

-- Fix curriculum_lesson_progress: drop restrictive, create permissive
DROP POLICY IF EXISTS "Admins read all curriculum progress" ON public.curriculum_lesson_progress;
DROP POLICY IF EXISTS "Users manage own curriculum progress" ON public.curriculum_lesson_progress;

CREATE POLICY "Admins read all curriculum progress"
  ON public.curriculum_lesson_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own curriculum progress"
  ON public.curriculum_lesson_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix user_enrollments: drop restrictive, create permissive
DROP POLICY IF EXISTS "Admins read all enrollments" ON public.user_enrollments;
DROP POLICY IF EXISTS "Users manage own enrollment" ON public.user_enrollments;

CREATE POLICY "Admins read all enrollments"
  ON public.user_enrollments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own enrollment"
  ON public.user_enrollments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix curriculum_versions: drop restrictive, create permissive
DROP POLICY IF EXISTS "Admins manage versions" ON public.curriculum_versions;

CREATE POLICY "Admins manage versions"
  ON public.curriculum_versions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix admin_audit_log: drop restrictive, create permissive
DROP POLICY IF EXISTS "Admins insert audit log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;

CREATE POLICY "Admins insert audit log"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins read audit log"
  ON public.admin_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
