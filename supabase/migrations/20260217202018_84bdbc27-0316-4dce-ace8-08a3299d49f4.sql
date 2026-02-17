
-- Table to track RAS evidence events per user
CREATE TABLE public.evidence_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for monthly queries
CREATE INDEX idx_evidence_events_user_month ON public.evidence_events (user_id, created_at);

-- Enable RLS
ALTER TABLE public.evidence_events ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own evidence
CREATE POLICY "Users manage own evidence"
ON public.evidence_events
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can read all evidence
CREATE POLICY "Admins read all evidence"
ON public.evidence_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
