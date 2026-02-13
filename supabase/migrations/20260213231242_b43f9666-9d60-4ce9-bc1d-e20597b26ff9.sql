
-- =============================================
-- CURRICULUM CMS + PROGRESS TRACKING MIGRATION
-- =============================================

-- 1) PROGRAMS
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  cover_image_url text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage programs" ON public.programs FOR ALL
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read published programs" ON public.programs FOR SELECT
  USING (status = 'published');

-- 2) COURSES
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  cover_image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  order_index integer NOT NULL DEFAULT 0,
  visibility text NOT NULL DEFAULT 'paid' CHECK (visibility IN ('free','paid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(program_id, slug)
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage courses" ON public.courses FOR ALL
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read published courses" ON public.courses FOR SELECT
  USING (status = 'published');

-- 3) MODULES
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, slug)
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage modules" ON public.modules FOR ALL
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read published modules" ON public.modules FOR SELECT
  USING (status = 'published');

-- 4) LESSONS
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  order_index integer NOT NULL DEFAULT 0,
  content_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  video_url text,
  audio_url text,
  duration_minutes integer,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module_id, slug)
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lessons" ON public.lessons FOR ALL
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read published lessons" ON public.lessons FOR SELECT
  USING (status = 'published');

-- 5) LESSON RESOURCES
CREATE TABLE public.lesson_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'link' CHECK (type IN ('file','link')),
  title text NOT NULL,
  url text,
  storage_path text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lesson resources" ON public.lesson_resources FOR ALL
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read resources of published lessons" ON public.lesson_resources FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lessons WHERE lessons.id = lesson_resources.lesson_id AND lessons.status = 'published'
  ));

-- 6) CURRICULUM VERSIONS
CREATE TABLE public.curriculum_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('program','course','module','lesson')),
  entity_id uuid NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  snapshot_json jsonb NOT NULL,
  created_by uuid NOT NULL,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.curriculum_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage versions" ON public.curriculum_versions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 7) ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('global','course')),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read published announcements" ON public.announcements FOR SELECT
  USING (status = 'published');

-- 8) ADMIN AUDIT LOG
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create','update','delete','publish','unpublish','reorder','duplicate')),
  entity_type text NOT NULL,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit log" ON public.admin_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert audit log" ON public.admin_audit_log FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 9) LESSON PROGRESS
CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  percent integer NOT NULL DEFAULT 0 CHECK (percent >= 0 AND percent <= 100),
  last_viewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own lesson progress" ON public.lesson_progress FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Admins read all lesson progress" ON public.lesson_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 10) COURSE PROGRESS
CREATE TABLE public.course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  percent integer NOT NULL DEFAULT 0 CHECK (percent >= 0 AND percent <= 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own course progress" ON public.course_progress FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Admins read all course progress" ON public.course_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 11) USER ACTION ITEMS
CREATE TABLE public.user_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  text text NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own action items" ON public.user_action_items FOR ALL
  USING (auth.uid() = user_id);

-- 12) USER JOURNAL ENTRIES
CREATE TABLE public.user_journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  prompt text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journal entries" ON public.user_journal_entries FOR ALL
  USING (auth.uid() = user_id);

-- UPDATED_AT TRIGGERS
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_course_progress_updated_at BEFORE UPDATE ON public.course_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- INDEXES
CREATE INDEX idx_courses_program_id ON public.courses(program_id);
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_modules_course_id ON public.modules(course_id);
CREATE INDEX idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX idx_lessons_status ON public.lessons(status);
CREATE INDEX idx_lesson_resources_lesson_id ON public.lesson_resources(lesson_id);
CREATE INDEX idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);
CREATE INDEX idx_course_progress_user ON public.course_progress(user_id);
CREATE INDEX idx_audit_log_admin ON public.admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_log_entity ON public.admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_announcements_status ON public.announcements(status);

-- STORAGE BUCKET for curriculum files
INSERT INTO storage.buckets (id, name, public) VALUES ('curriculum-files', 'curriculum-files', true);

CREATE POLICY "Admins upload curriculum files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'curriculum-files' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update curriculum files" ON storage.objects FOR UPDATE
  USING (bucket_id = 'curriculum-files' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete curriculum files" ON storage.objects FOR DELETE
  USING (bucket_id = 'curriculum-files' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone reads curriculum files" ON storage.objects FOR SELECT
  USING (bucket_id = 'curriculum-files');
