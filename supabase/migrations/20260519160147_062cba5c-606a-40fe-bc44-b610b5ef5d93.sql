CREATE TABLE public.yield_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  yield_type text NOT NULL,
  custom_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.yield_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own yield logs"
ON public.yield_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own yield logs"
ON public.yield_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins read all yield logs"
ON public.yield_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_yield_logs_user_created ON public.yield_logs(user_id, created_at DESC);