
-- =============================================
-- MILESTONE 3: Daily Progress Tracking Tables
-- =============================================

-- Daily check-ins (mood/awareness tracking)
CREATE TABLE public.daily_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  check_in_date date NOT NULL DEFAULT CURRENT_DATE,
  feelings text[] NOT NULL DEFAULT '{}',
  needs_support boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, check_in_date)
);

ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own check-ins"
  ON public.daily_check_ins FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily completions (faith items, pillar items, digital wisdom)
CREATE TABLE public.daily_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  completion_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL, -- 'faith', 'connection', 'fitness', 'digital_wisdom'
  item_id text NOT NULL,  -- 'prayer', 'scripture', 'renewed-mind', 'presence', etc.
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, completion_date, category, item_id)
);

ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own completions"
  ON public.daily_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Freedom calendar (streak tracking)
CREATE TABLE public.freedom_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.freedom_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own streak"
  ON public.freedom_streaks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- MILESTONE 4: Add moderator role
-- =============================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';

-- =============================================
-- Auto-join default channels on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_join_default_channels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO chat_channel_members (channel_id, user_id)
  SELECT id, NEW.id FROM chat_channels WHERE is_default = true
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created_join_channels
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_join_default_channels();

-- Add admin read policies for new tables
CREATE POLICY "Admins read all check-ins"
  ON public.daily_check_ins FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins read all completions"
  ON public.daily_completions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins read all streaks"
  ON public.freedom_streaks FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
