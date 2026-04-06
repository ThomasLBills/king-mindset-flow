
CREATE TABLE public.user_declarations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  declaration_text TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_declarations_position_check CHECK (position >= 1 AND position <= 5),
  CONSTRAINT user_declarations_user_position_unique UNIQUE (user_id, position)
);

ALTER TABLE public.user_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own declarations"
  ON public.user_declarations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
