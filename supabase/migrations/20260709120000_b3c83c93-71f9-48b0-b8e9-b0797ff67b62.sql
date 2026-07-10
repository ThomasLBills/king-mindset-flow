-- Forge redesign: covenant + "your why" (one row per user).
-- Written during onboarding (why at the "Why freedom?" step, signature at the
-- covenant step); shown on Profile and the Stand Firm crisis screen.

CREATE TABLE public.user_covenants (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  why text,
  signed_name text,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_covenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own covenant"
  ON public.user_covenants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own covenant"
  ON public.user_covenants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own covenant"
  ON public.user_covenants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_covenants_updated_at
  BEFORE UPDATE ON public.user_covenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
