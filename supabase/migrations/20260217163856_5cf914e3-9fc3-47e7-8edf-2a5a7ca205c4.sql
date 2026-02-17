
-- Table to log crisis button ("I Need Strength") usage
CREATE TABLE public.crisis_button_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  selected_feeling TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crisis_button_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own crisis events"
  ON public.crisis_button_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_crisis_events_user_time ON public.crisis_button_events (user_id, triggered_at);

-- Table to log relapse/reset events
CREATE TABLE public.relapse_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  relapsed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  day_of_week INTEGER,
  program_day INTEGER,
  recent_emotions TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.relapse_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own relapse events"
  ON public.relapse_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_relapse_events_user_time ON public.relapse_events (user_id, relapsed_at);

-- Table to store generated pattern insights
CREATE TABLE public.pattern_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pattern_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scripture_reference TEXT NOT NULL,
  scripture_text TEXT NOT NULL,
  action_step TEXT NOT NULL,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  surfaced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pattern_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pattern insights"
  ON public.pattern_insights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_pattern_insights_user ON public.pattern_insights (user_id, surfaced_at);
