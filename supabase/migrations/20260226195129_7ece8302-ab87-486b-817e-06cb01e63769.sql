
-- Create gratitude_entries table
CREATE TABLE public.gratitude_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_1 TEXT NOT NULL,
  entry_2 TEXT NOT NULL,
  entry_3 TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

-- Enable RLS
ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;

-- Users manage own entries
CREATE POLICY "Users manage own gratitude"
ON public.gratitude_entries
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins read all
CREATE POLICY "Admins read all gratitude"
ON public.gratitude_entries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
