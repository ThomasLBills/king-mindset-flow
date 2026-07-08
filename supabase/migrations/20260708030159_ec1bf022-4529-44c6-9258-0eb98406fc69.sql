-- Scope curriculum_lessons SELECT to published rows for entitled users; admins keep full access.
DROP POLICY IF EXISTS "Anyone reads curriculum_lessons" ON public.curriculum_lessons;

CREATE POLICY "Entitled users read published curriculum_lessons"
ON public.curriculum_lessons
FOR SELECT
TO authenticated
USING (
  status = 'published'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_active_entitlement(auth.uid(), 'course_app_access')
  )
);

-- Ensure anon has no read access to lesson content (drafts or published)
REVOKE SELECT ON public.curriculum_lessons FROM anon;