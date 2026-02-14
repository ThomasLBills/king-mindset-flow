
-- =============================================
-- PHASE 1: Fresh Curriculum Tables
-- =============================================

-- Curriculum Settings (single row)
CREATE TABLE public.curriculum_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'The 8-Week Journey',
  subtitle text,
  cover_image_url text,
  duration_label text DEFAULT '8-Week Journey',
  status text NOT NULL DEFAULT 'draft',
  drip_mode text NOT NULL DEFAULT 'weekly',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.curriculum_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage curriculum_settings"
  ON public.curriculum_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read published curriculum_settings"
  ON public.curriculum_settings FOR SELECT
  USING (status = 'published');

-- Weeks table
CREATE TABLE public.weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number integer NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  order_index integer NOT NULL DEFAULT 0,
  unlock_day_offset integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage weeks"
  ON public.weeks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read published weeks"
  ON public.weeks FOR SELECT
  USING (status = 'published');

-- Curriculum Lessons
CREATE TABLE public.curriculum_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  summary text,
  duration_minutes integer,
  order_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  unlock_rule text NOT NULL DEFAULT 'inherit',
  unlock_day_offset integer,
  content_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  video_url text,
  audio_url text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.curriculum_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage curriculum_lessons"
  ON public.curriculum_lessons FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read published curriculum_lessons"
  ON public.curriculum_lessons FOR SELECT
  USING (status = 'published');

-- User Enrollments
CREATE TABLE public.user_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own enrollment"
  ON public.user_enrollments FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all enrollments"
  ON public.user_enrollments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Curriculum Lesson Progress
CREATE TABLE public.curriculum_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.curriculum_lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started',
  percent integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  last_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.curriculum_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own curriculum progress"
  ON public.curriculum_lesson_progress FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all curriculum progress"
  ON public.curriculum_lesson_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_curriculum_settings_updated_at
  BEFORE UPDATE ON public.curriculum_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_weeks_updated_at
  BEFORE UPDATE ON public.weeks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_curriculum_lessons_updated_at
  BEFORE UPDATE ON public.curriculum_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_curriculum_lesson_progress_updated_at
  BEFORE UPDATE ON public.curriculum_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed the single curriculum row
INSERT INTO public.curriculum_settings (title, subtitle, duration_label, status, drip_mode)
VALUES ('The 8-Week Journey', 'Your path to freedom and purpose', '8-Week Journey', 'draft', 'weekly');

-- Seed 8 weeks with default drip offsets (Week 1 = day 0, Week 2 = day 7, etc.)
INSERT INTO public.weeks (week_number, title, summary, order_index, unlock_day_offset, status) VALUES
  (1, 'Week 1: Grace', 'Understanding grace and forgiveness', 0, 0, 'draft'),
  (2, 'Week 2: Identity', 'Discovering who you truly are', 1, 7, 'draft'),
  (3, 'Week 3: The Mind', 'Renewing your thought patterns', 2, 14, 'draft'),
  (4, 'Week 4: Spirit', 'Walking in the Spirit', 3, 21, 'draft'),
  (5, 'Week 5: Temptation', 'Overcoming temptation', 4, 28, 'draft'),
  (6, 'Week 6: Rhythms', 'Building life-giving rhythms', 5, 35, 'draft'),
  (7, 'Week 7: Brotherhood', 'The power of community', 6, 42, 'draft'),
  (8, 'Week 8: Purpose', 'Living with purpose', 7, 49, 'draft');
