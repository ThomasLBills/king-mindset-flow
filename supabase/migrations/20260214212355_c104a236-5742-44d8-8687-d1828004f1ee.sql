
-- Allow any authenticated user to read curriculum_settings (single row, non-sensitive)
DROP POLICY IF EXISTS "Users read published curriculum_settings" ON public.curriculum_settings;

CREATE POLICY "Authenticated read curriculum_settings"
  ON public.curriculum_settings FOR SELECT
  USING (true);
